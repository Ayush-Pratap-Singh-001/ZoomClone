"use client";

import VideoTile from "./VideoTile";

interface Participant {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
}

interface MediaState {
  audio: boolean;
  video: boolean;
}

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<number, MediaStream>;
  participants: Participant[];
  currentUserId: number;
  mediaStates: Record<number, MediaState>;
}

export default function VideoGrid({
  localStream,
  remoteStreams,
  participants,
  currentUserId,
  mediaStates,
}: VideoGridProps) {
  const remoteParticipants =
    participants.filter(
      (participant) =>
        participant.user_id !== currentUserId
    );

  const totalTiles =
    remoteParticipants.length + 1;

  let gridClass = "grid-cols-1";

  if (totalTiles === 2) {
    gridClass = "grid-cols-1 md:grid-cols-2";
  } else if (totalTiles <= 4) {
    gridClass =
      "grid-cols-1 md:grid-cols-2";
  } else {
    gridClass =
      "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  }

  const localMediaState =
    mediaStates[currentUserId] || {
      audio: true,
      video: true,
    };

  return (
    <div
      className={`grid w-full gap-4 ${gridClass}`}
    >
      <VideoTile
        stream={localStream}
        name="You"
        muted
        isLocal
        audioEnabled={
          localMediaState.audio
        }
        videoEnabled={
          localMediaState.video
        }
      />

      {remoteParticipants.map(
        (participant) => {
          const mediaState =
            mediaStates[
              participant.user_id
            ] || {
              audio: true,
              video: true,
            };

          return (
            <VideoTile
              key={participant.user_id}
              stream={
                remoteStreams.get(
                  participant.user_id
                ) || null
              }
              name={participant.name}
              audioEnabled={
                mediaState.audio
              }
              videoEnabled={
                mediaState.video
              }
            />
          );
        }
      )}
    </div>
  );
}