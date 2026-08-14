from datetime import datetime, timezone
import secrets
import string

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import MeetingParticipant
from app.models.message import Message

from app.websocket.manager import manager

from app.schemas.meeting import (
    MeetingCreate,
)


router = APIRouter(
    prefix="/api/meetings",
    tags=["Meetings"],
)


def generate_meeting_code(
    length: int = 10,
) -> str:
    characters = (
        string.ascii_uppercase
        + string.digits
    )

    return "".join(
        secrets.choice(characters)
        for _ in range(length)
    )


def get_meeting_or_404(
    meeting_code: str,
    db: Session,
):
    meeting = (
        db.query(Meeting)
        .filter(
            Meeting.meeting_code
            == meeting_code
        )
        .first()
    )

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    return meeting


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_meeting(
    meeting_data: MeetingCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    meeting_code = (
        generate_meeting_code()
    )

    while (
        db.query(Meeting)
        .filter(
            Meeting.meeting_code
            == meeting_code
        )
        .first()
        is not None
    ):
        meeting_code = (
            generate_meeting_code()
        )

    meeting = Meeting(
        title=meeting_data.title,
        meeting_code=meeting_code,
        host_id=current_user.id,
        status="active",
        created_at=datetime.now(
            timezone.utc
        ),
    )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    participant = MeetingParticipant(
        meeting_id=meeting.id,
        user_id=current_user.id,
        role="host",
        joined_at=datetime.now(
            timezone.utc
        ),
    )

    db.add(participant)
    db.commit()

    return {
        "message": "Meeting created successfully",
        "meeting": {
            "id": meeting.id,
            "title": meeting.title,
            "meeting_code": meeting.meeting_code,
            "host_id": meeting.host_id,
            "status": meeting.status,
            "created_at": meeting.created_at,
        },
    }


@router.get(
    "/history",
)
def get_meeting_history(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    meetings = (
        db.query(Meeting)
        .filter(
            Meeting.host_id
            == current_user.id
        )
        .order_by(
            Meeting.created_at.desc()
        )
        .all()
    )

    result = []

    for meeting in meetings:
        result.append(
            {
                "id": meeting.id,
                "title": meeting.title,
                "meeting_code":
                    meeting.meeting_code,
                "host_id":
                    meeting.host_id,
                "status":
                    meeting.status,
                "created_at":
                    meeting.created_at,
            }
        )

    return result


@router.get(
    "/{meeting_code}",
)
def get_meeting(
    meeting_code: str,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(
        meeting_code,
        db,
    )

    participants = (
        db.query(
            MeetingParticipant
        )
        .filter(
            MeetingParticipant.meeting_id
            == meeting.id
        )
        .all()
    )

    participant_list = []

    for participant in participants:
        user = (
            db.query(User)
            .filter(
                User.id
                == participant.user_id
            )
            .first()
        )

        if not user:
            continue

        participant_list.append(
            {
                "id": participant.id,
                "user_id":
                    participant.user_id,
                "name": user.name,
                "email": user.email,
                "role":
                    participant.role,
                "joined_at":
                    participant.joined_at,
            }
        )

    return {
        "meeting": {
            "id": meeting.id,
            "title": meeting.title,
            "meeting_code":
                meeting.meeting_code,
            "host_id":
                meeting.host_id,
            "status":
                meeting.status,
            "created_at":
                meeting.created_at,
        },
        "participants":
            participant_list,
    }


@router.post(
    "/{meeting_code}/join",
)
def join_meeting(
    meeting_code: str,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(
        meeting_code,
        db,
    )

    if meeting.status == "ended":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting has ended",
        )

    existing_participant = (
        db.query(
            MeetingParticipant
        )
        .filter(
            MeetingParticipant.meeting_id
            == meeting.id,
            MeetingParticipant.user_id
            == current_user.id,
        )
        .first()
    )

    if existing_participant:
        return {
            "message":
                "Already joined",
            "participant": {
                "id":
                    existing_participant.id,
                "user_id":
                    existing_participant.user_id,
                "role":
                    existing_participant.role,
            },
        }

    participant = MeetingParticipant(
        meeting_id=meeting.id,
        user_id=current_user.id,
        role="participant",
        joined_at=datetime.now(
            timezone.utc
        ),
    )

    db.add(participant)
    db.commit()
    db.refresh(participant)

    return {
        "message":
            "Joined meeting successfully",
        "participant": {
            "id":
                participant.id,
            "user_id":
                participant.user_id,
            "role":
                participant.role,
        },
    }


@router.post(
    "/{meeting_code}/leave",
)
async def leave_meeting(
    meeting_code: str,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(
        meeting_code,
        db,
    )

    participant = (
        db.query(
            MeetingParticipant
        )
        .filter(
            MeetingParticipant.meeting_id
            == meeting.id,
            MeetingParticipant.user_id
            == current_user.id,
        )
        .first()
    )

    if not participant:
        return {
            "message":
                "You are not in this meeting"
        }

    if (
        current_user.id
        == meeting.host_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Host cannot leave the meeting. "
                "End the meeting instead."
            ),
        )

    db.delete(participant)
    db.commit()

    await manager.send_to_user(
        meeting_code,
        current_user.id,
        {
            "type":
                "user_left",
            "user_id":
                current_user.id,
        },
    )

    await manager.broadcast(
        meeting_code,
        {
            "type":
                "user_left",
            "user_id":
                current_user.id,
            "username":
                current_user.name,
        },
        exclude_user_id=current_user.id,
    )

    return {
        "message":
            "Left meeting successfully"
    }


@router.post(
    "/{meeting_code}/end",
)
async def end_meeting(
    meeting_code: str,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(
        meeting_code,
        db,
    )

    if (
        meeting.host_id
        != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only the meeting host "
                "can end the meeting"
            ),
        )

    if meeting.status == "ended":
        return {
            "message":
                "Meeting already ended"
        }

    meeting.status = "ended"

    db.commit()
    db.refresh(meeting)

    await manager.broadcast(
        meeting_code,
        {
            "type":
                "meeting_ended",
        },
    )

    return {
        "message":
            "Meeting ended successfully",
        "meeting": {
            "id":
                meeting.id,
            "meeting_code":
                meeting.meeting_code,
            "status":
                meeting.status,
        },
    }

@router.get("")
def get_my_meetings(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    meetings = (
        db.query(Meeting)
        .filter(
            Meeting.host_id
            == current_user.id
        )
        .order_by(
            Meeting.created_at.desc()
        )
        .all()
    )

    result = []

    for meeting in meetings:
        result.append(
            {
                "id": meeting.id,
                "title": meeting.title,
                "meeting_code":
                    meeting.meeting_code,
                "host_id":
                    meeting.host_id,
                "status":
                    meeting.status,
                "created_at":
                    meeting.created_at,
            }
        )

    return result
@router.get(
    "/{meeting_code}/messages",
)
def get_meeting_messages(
    meeting_code: str,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(
        meeting_code,
        db,
    )

    participant = (
        db.query(
            MeetingParticipant
        )
        .filter(
            MeetingParticipant.meeting_id
            == meeting.id,
            MeetingParticipant.user_id
            == current_user.id,
        )
        .first()
    )

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You are not a participant "
                "of this meeting"
            ),
        )

    messages = (
        db.query(Message)
        .filter(
            Message.meeting_id
            == meeting.id
        )
        .order_by(
            Message.created_at.asc()
        )
        .all()
    )

    result = []

    for message in messages:
        message_user = (
            db.query(User)
            .filter(
                User.id
                == message.user_id
            )
            .first()
        )

        if not message_user:
            continue

        result.append(
            {
                "user_id":
                    message_user.id,
                "username":
                    message_user.name,
                "message":
                    message.message,
                "timestamp":
                    message.created_at.isoformat(),
            }
        )

    return result