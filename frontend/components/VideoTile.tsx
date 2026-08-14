"use client";

import { useEffect, useRef } from "react";

interface VideoTileProps {
  stream: MediaStream | null;
  name: string;
  muted?: boolean;
  isLocal?: boolean;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}

export default function VideoTile({
  stream,
  name,
  muted = false,
  isLocal = false,
  audioEnabled = true,
  videoEnabled = true,
}: VideoTileProps) {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    video.srcObject = stream;

    if (stream) {
      video.play().catch(() => {});
    }
  }, [stream]);

  const showVideo =
    Boolean(stream) && videoEnabled;

  return (
    <div className="group relative aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-900">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold">
            {name
              .charAt(0)
              .toUpperCase()}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent p-4">
        <span className="font-medium">
          {name}
          {isLocal && " (You)"}
        </span>

        <div className="flex gap-2">
          {!audioEnabled && (
            <span className="rounded-full bg-red-600/90 px-2 py-1 text-xs">
              🔇
            </span>
          )}

          {!videoEnabled && (
            <span className="rounded-full bg-slate-700/90 px-2 py-1 text-xs">
              📵
            </span>
          )}
        </div>
      </div>
    </div>
  );
}