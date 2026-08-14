from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MeetingCreate(BaseModel):
    title: str


class MeetingResponse(BaseModel):
    id: int
    title: str
    meeting_code: str
    host_id: int
    status: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class ParticipantResponse(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    role: str
    joined_at: datetime | None = None


class MeetingDetailsResponse(BaseModel):
    meeting: MeetingResponse
    participants: list[
        ParticipantResponse
    ]