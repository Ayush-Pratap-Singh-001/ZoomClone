"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

export function useScreenShare(
  replaceVideoTrack: (
    track: MediaStreamTrack
  ) => Promise<void>,
  cameraTrack: MediaStreamTrack | null
) {
  const screenStreamRef =
    useRef<MediaStream | null>(null);

  const [isSharing, setIsSharing] =
    useState(false);

  const startScreenShare =
    useCallback(async () => {
      const stream =
        await navigator.mediaDevices.getDisplayMedia(
          {
            video: true,
            audio: false,
          }
        );

      const screenTrack =
        stream.getVideoTracks()[0];

      if (!screenTrack) {
        return;
      }

      screenStreamRef.current =
        stream;

      await replaceVideoTrack(
        screenTrack
      );

      setIsSharing(true);

      screenTrack.onended = () => {
        if (cameraTrack) {
          replaceVideoTrack(
            cameraTrack
          ).catch(console.error);
        }

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        screenStreamRef.current =
          null;

        setIsSharing(false);
      };
    }, [
      cameraTrack,
      replaceVideoTrack,
    ]);

  const stopScreenShare =
    useCallback(async () => {
      const stream =
        screenStreamRef.current;

      if (!stream) {
        return;
      }

      if (cameraTrack) {
        await replaceVideoTrack(
          cameraTrack
        );
      }

      stream
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      screenStreamRef.current =
        null;

      setIsSharing(false);
    }, [
      cameraTrack,
      replaceVideoTrack,
    ]);

  return {
    isSharing,
    startScreenShare,
    stopScreenShare,
  };
}