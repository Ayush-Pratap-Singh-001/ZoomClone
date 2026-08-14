"use client";

interface Props {
  audioEnabled: boolean;
  videoEnabled: boolean;
  isSharing: boolean;
  isHost: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreen: () => void;
  onParticipants: () => void;
  onChat: () => void;
  onLeave: () => void;
  onEnd: () => void;
}

export default function MeetingControls({
  audioEnabled,
  videoEnabled,
  isSharing,
  isHost,
  onToggleAudio,
  onToggleVideo,
  onToggleScreen,
  onParticipants,
  onChat,
  onLeave,
  onEnd,
}: Props) {
  return (
    <footer className="flex items-center justify-center gap-2 border-t border-slate-800 bg-slate-950 p-4">
      <button
        onClick={onToggleAudio}
        className={`rounded-full px-5 py-3 ${
          audioEnabled
            ? "bg-slate-800 hover:bg-slate-700"
            : "bg-red-600"
        }`}
      >
        {audioEnabled
          ? "🎤"
          : "🔇"}
      </button>

      <button
        onClick={onToggleVideo}
        className={`rounded-full px-5 py-3 ${
          videoEnabled
            ? "bg-slate-800 hover:bg-slate-700"
            : "bg-red-600"
        }`}
      >
        {videoEnabled
          ? "📹"
          : "📵"}
      </button>

      <button
        onClick={onToggleScreen}
        className={`rounded-full px-5 py-3 ${
          isSharing
            ? "bg-blue-600"
            : "bg-slate-800 hover:bg-slate-700"
        }`}
      >
        🖥
      </button>

      <button
        onClick={onParticipants}
        className="rounded-full bg-slate-800 px-5 py-3 hover:bg-slate-700"
      >
        👥
      </button>

      <button
        onClick={onChat}
        className="rounded-full bg-slate-800 px-5 py-3 hover:bg-slate-700"
      >
        💬
      </button>

      {isHost ? (
        <button
          onClick={onEnd}
          className="ml-3 rounded-full bg-red-600 px-5 py-3 font-semibold hover:bg-red-700"
        >
          End
        </button>
      ) : (
        <button
          onClick={onLeave}
          className="ml-3 rounded-full bg-red-600 px-5 py-3 font-semibold hover:bg-red-700"
        >
          Leave
        </button>
      )}
    </footer>
  );
}