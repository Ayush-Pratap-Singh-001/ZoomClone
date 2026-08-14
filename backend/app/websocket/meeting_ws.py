from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)

from jose import JWTError

from app.core.database import SessionLocal

from app.core.security import (
    decode_access_token,
)

from app.models.meeting import Meeting
from app.models.user import User
from app.models.message import Message

from app.websocket.manager import manager


router = APIRouter()


def get_user_from_token(
    token: str,
    db,
):
    try:
        payload = decode_access_token(
            token
        )

        user_id = payload.get(
            "sub"
        )

        if user_id is None:
            print(
                "WebSocket authentication failed: "
                "token has no user ID"
            )

            return None

        user_id = int(user_id)

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:
            print(
                "WebSocket authentication failed: "
                f"user {user_id} not found"
            )

            return None

        return user

    except (
        JWTError,
        ValueError,
        TypeError,
    ) as error:

        print(
            "WebSocket authentication error:",
            error
        )

        return None

    except Exception as error:

        print(
            "Unexpected WebSocket "
            "authentication error:",
            error
        )

        return None


@router.websocket(
    "/ws/meetings/{meeting_code}"
)
async def meeting_websocket(
    websocket: WebSocket,
    meeting_code: str,
):
    db = SessionLocal()

    user = None

    try:

        print(
            "WebSocket connection attempt:",
            meeting_code
        )


        token = (
            websocket.query_params.get(
                "token"
            )
        )


        if not token:

            print(
                "WebSocket rejected: "
                "no token"
            )

            await websocket.close(
                code=1008
            )

            return


        user = get_user_from_token(
            token,
            db
        )


        if not user:

            print(
                "WebSocket rejected: "
                "invalid token"
            )

            await websocket.close(
                code=1008
            )

            return


        print(
            "WebSocket authenticated user:",
            user.id,
            user.name
        )


        meeting = (
            db.query(Meeting)
            .filter(
                Meeting.meeting_code
                == meeting_code
            )
            .first()
        )


        if not meeting:

            print(
                "WebSocket rejected: "
                "meeting not found:",
                meeting_code
            )

            await websocket.close(
                code=1008
            )

            return


        if meeting.status == "ended":

            print(
                "WebSocket rejected: "
                "meeting has ended:",
                meeting_code
            )

            await websocket.close(
                code=1008
            )

            return


        existing_users = (
            manager.get_participants(
                meeting_code
            )
        )


        await manager.connect(
            meeting_code,
            user.id,
            websocket
        )


        print(
            "WebSocket connected:",
            meeting_code,
            "user:",
            user.id
        )


        await websocket.send_json(
            {
                "type":
                    "room_state",
                "participants":
                    existing_users,
            }
        )


        await manager.broadcast(
            meeting_code,
            {
                "type":
                    "user_joined",
                "user_id":
                    user.id,
                "username":
                    user.name,
            },
            exclude_user_id=user.id,
        )


        while True:

            data = (
                await websocket.receive_json()
            )

            message_type = data.get(
                "type"
            )


            if message_type == "offer":

                target_user_id = data.get(
                    "target_user_id"
                )

                if target_user_id:

                    await manager.send_to_user(
                        meeting_code,
                        int(
                            target_user_id
                        ),
                        {
                            "type":
                                "offer",
                            "from_user_id":
                                user.id,
                            "offer":
                                data.get(
                                    "offer"
                                ),
                        },
                    )


            elif message_type == "answer":

                target_user_id = data.get(
                    "target_user_id"
                )

                if target_user_id:

                    await manager.send_to_user(
                        meeting_code,
                        int(
                            target_user_id
                        ),
                        {
                            "type":
                                "answer",
                            "from_user_id":
                                user.id,
                            "answer":
                                data.get(
                                    "answer"
                                ),
                        },
                    )


            elif (
                message_type
                == "ice_candidate"
            ):

                target_user_id = data.get(
                    "target_user_id"
                )

                if target_user_id:

                    await manager.send_to_user(
                        meeting_code,
                        int(
                            target_user_id
                        ),
                        {
                            "type":
                                "ice_candidate",
                            "from_user_id":
                                user.id,
                            "candidate":
                                data.get(
                                    "candidate"
                                ),
                        },
                    )


            elif message_type == "chat":

                message = (
                    data.get(
                        "message",
                        ""
                    )
                    .strip()
                )

                if not message:
                    continue


                chat_message = Message(
                    meeting_id=meeting.id,
                    user_id=user.id,
                    message=message,
                    created_at=datetime.now(
                        timezone.utc
                    ),
                )


                db.add(
                    chat_message
                )

                db.commit()

                db.refresh(
                    chat_message
                )


                await manager.broadcast(
                    meeting_code,
                    {
                        "type":
                            "chat",
                        "user_id":
                            user.id,
                        "username":
                            user.name,
                        "message":
                            message,
                        "timestamp":
                            chat_message
                            .created_at
                            .isoformat(),
                    },
                )


            elif (
                message_type
                == "media_state"
            ):

                await manager.broadcast(
                    meeting_code,
                    {
                        "type":
                            "media_state",
                        "user_id":
                            user.id,
                        "audio":
                            data.get(
                                "audio",
                                True
                            ),
                        "video":
                            data.get(
                                "video",
                                True
                            ),
                    },
                    exclude_user_id=user.id,
                )


            elif (
                message_type
                == "host_mute"
            ):

                target_user_id = data.get(
                    "target_user_id"
                )

                if not target_user_id:
                    continue


                if (
                    user.id
                    != meeting.host_id
                ):
                    continue


                await manager.send_to_user(
                    meeting_code,
                    int(
                        target_user_id
                    ),
                    {
                        "type":
                            "force_mute",
                    },
                )


            elif (
                message_type
                == "remove_participant"
            ):

                target_user_id = data.get(
                    "target_user_id"
                )

                if not target_user_id:
                    continue


                if (
                    user.id
                    != meeting.host_id
                ):
                    continue


                await manager.send_to_user(
                    meeting_code,
                    int(
                        target_user_id
                    ),
                    {
                        "type":
                            "removed_from_meeting",
                    },
                )


    except WebSocketDisconnect:

        print(
            "WebSocket disconnected:",
            meeting_code,
            (
                user.id
                if user
                else "unknown user"
            )
        )


    except Exception as error:

        print(
            "WebSocket error:",
            error
        )

        try:

            await websocket.close(
                code=1011
            )

        except Exception:
            pass


    finally:

        if user:

            manager.disconnect(
                meeting_code,
                user.id
            )


            await manager.broadcast(
                meeting_code,
                {
                    "type":
                        "user_left",
                    "user_id":
                        user.id,
                    "username":
                        user.name,
                },
            )


        db.close()