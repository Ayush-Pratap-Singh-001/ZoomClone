"use client";

interface Participant {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
}

interface Props {
  participants: Participant[];
  currentUserId: number;
  isHost: boolean;
  onMute: (userId: number) => void;
  onRemove: (userId: number) => void;
}

export default function ParticipantsPanel({
  participants,
  currentUserId,
  isHost,
  onMute,
  onRemove,
}: Props) {
  return (
    <aside className="absolute right-0 top-0 z-20 flex h-full w-80 flex-col border-l border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-5 py-4">
        <h2 className="font-semibold">
          Participants
        </h2>

        <p className="text-sm text-slate-500">
          {participants.length} in meeting
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {participants.map(
            (participant) => {
              const isCurrentUser =
                participant.user_id ===
                currentUserId;

              const isParticipantHost =
                participant.role === "host";

              return (
                <div
                  key={participant.user_id}
                  className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">
                      {participant.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        {participant.name}
                        {isCurrentUser &&
                          " (You)"}
                      </p>

                      {isParticipantHost && (
                        <p className="text-xs text-blue-400">
                          Host
                        </p>
                      )}
                    </div>
                  </div>

                  {isHost &&
                    !isCurrentUser &&
                    !isParticipantHost && (
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            onMute(
                              participant.user_id
                            )
                          }
                          className="rounded-md px-2 py-1 text-xs hover:bg-slate-800"
                          title="Mute"
                        >
                          🎤
                        </button>

                        <button
                          onClick={() =>
                            onRemove(
                              participant.user_id
                            )
                          }
                          className="rounded-md px-2 py-1 text-xs text-red-400 hover:bg-slate-800"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    )}
                </div>
              );
            }
          )}
        </div>
      </div>
    </aside>
  );
}