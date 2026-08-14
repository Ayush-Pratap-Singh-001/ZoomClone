"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useMediaStream() {
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] =
    useState<MediaStream | null>(null);

  const [audioEnabled, setAudioEnabled] =
    useState(true);

  const [videoEnabled, setVideoEnabled] =
    useState(true);

  const startMedia = useCallback(async () => {
    if (streamRef.current) {
      return streamRef.current;
    }

    const mediaStream =
      await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

    streamRef.current = mediaStream;
    setStream(mediaStream);

    return mediaStream;
  }, []);

  const toggleAudio = useCallback(() => {
    const mediaStream = streamRef.current;

    if (!mediaStream) {
      return false;
    }

    const track = mediaStream.getAudioTracks()[0];

    if (!track) {
      return false;
    }

    track.enabled = !track.enabled;

    setAudioEnabled(track.enabled);

    return track.enabled;
  }, []);

  const toggleVideo = useCallback(() => {
    const mediaStream = streamRef.current;

    if (!mediaStream) {
      return false;
    }

    const track = mediaStream.getVideoTracks()[0];

    if (!track) {
      return false;
    }

    track.enabled = !track.enabled;

    setVideoEnabled(track.enabled);

    return track.enabled;
  }, []);

  const stopMedia = useCallback(() => {
    const mediaStream = streamRef.current;

    if (!mediaStream) {
      return;
    }

    mediaStream.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;
    setStream(null);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  return {
    stream,
    audioEnabled,
    videoEnabled,
    startMedia,
    toggleAudio,
    toggleVideo,
    stopMedia,
  };
}