from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.rooms: dict[
            str,
            dict[int, WebSocket]
        ] = defaultdict(dict)

    async def connect(
        self,
        meeting_code: str,
        user_id: int,
        websocket: WebSocket
    ):
        await websocket.accept()

        self.rooms[meeting_code][user_id] = websocket

    def disconnect(
        self,
        meeting_code: str,
        user_id: int
    ):
        room = self.rooms.get(meeting_code)

        if not room:
            return

        room.pop(user_id, None)

        if not room:
            self.rooms.pop(meeting_code, None)

    async def send_to_user(
        self,
        meeting_code: str,
        user_id: int,
        message: dict
    ):
        room = self.rooms.get(meeting_code)

        if not room:
            return

        websocket = room.get(user_id)

        if websocket:
            await websocket.send_json(message)

    async def broadcast(
        self,
        meeting_code: str,
        message: dict,
        exclude_user_id: int | None = None
    ):
        room = self.rooms.get(meeting_code)

        if not room:
            return

        disconnected = []

        for user_id, websocket in room.items():
            if user_id == exclude_user_id:
                continue

            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(user_id)

        for user_id in disconnected:
            self.disconnect(
                meeting_code,
                user_id
            )

    def get_participants(
        self,
        meeting_code: str
    ) -> list[int]:
        room = self.rooms.get(meeting_code)

        if not room:
            return []

        return list(room.keys())

    def is_connected(
        self,
        meeting_code: str,
        user_id: int
    ) -> bool:
        room = self.rooms.get(meeting_code)

        if not room:
            return False

        return user_id in room


manager = ConnectionManager()