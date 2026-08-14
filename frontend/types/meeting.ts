export interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  host_id: number;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface Participant {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  joined_at: string;
  left_at: string | null;
}

export interface MeetingDetails {
  meeting: Meeting;
  participants: Participant[];
}