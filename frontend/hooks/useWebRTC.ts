"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface SignalingMessage {
  type: string;
  [key: string]: unknown;
}

interface UseWebRTCProps {
  meetingCode: string;
  localStream: MediaStream | null;
  connected: boolean;
  lastMessage: SignalingMessage | null;
  sendMessage: (message: SignalingMessage) => void;
}

export function useWebRTC({
  meetingCode,
  localStream,
  connected,
  lastMessage,
  sendMessage,
}: UseWebRTCProps) {
  const peersRef = useRef<
    Map<number, RTCPeerConnection>
  >(new Map());

  const pendingCandidatesRef = useRef<
    Map<number, RTCIceCandidateInit[]>
  >(new Map());

  const [remoteStreams, setRemoteStreams] =
    useState<Map<number, MediaStream>>(
      new Map()
    );

  const configuration: RTCConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  const createPeerConnection = useCallback(
    (userId: number) => {
      const existing =
        peersRef.current.get(userId);

      if (existing) {
        return existing;
      }

      const peer =
        new RTCPeerConnection(configuration);

      if (localStream) {
        localStream
          .getTracks()
          .forEach((track) => {
            peer.addTrack(
              track,
              localStream
            );
          });
      }

      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }

        sendMessage({
          type: "ice_candidate",
          target_user_id: userId,
          candidate: event.candidate.toJSON(),
        });
      };

      peer.ontrack = (event) => {
        const [stream] = event.streams;

        if (!stream) {
          return;
        }

        setRemoteStreams((previous) => {
          const next = new Map(previous);

          next.set(userId, stream);

          return next;
        });
      };

      peer.onconnectionstatechange = () => {
        const state =
          peer.connectionState;

        if (
          state === "failed" ||
          state === "closed"
        ) {
          peer.close();

          peersRef.current.delete(
            userId
          );

          setRemoteStreams((previous) => {
            const next = new Map(previous);

            next.delete(userId);

            return next;
          });
        }
      };

      peersRef.current.set(
        userId,
        peer
      );

      return peer;
    },
    [localStream, sendMessage]
  );

  const createOffer = useCallback(
    async (userId: number) => {
      const peer =
        createPeerConnection(userId);

      const offer =
        await peer.createOffer();

      await peer.setLocalDescription(
        offer
      );

      sendMessage({
        type: "offer",
        target_user_id: userId,
        offer,
      });
    },
    [createPeerConnection, sendMessage]
  );

  const handleOffer = useCallback(
    async (
      userId: number,
      offer: RTCSessionDescriptionInit
    ) => {
      const peer =
        createPeerConnection(userId);

      await peer.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const candidates =
        pendingCandidatesRef.current.get(
          userId
        ) || [];

      for (const candidate of candidates) {
        await peer.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }

      pendingCandidatesRef.current.delete(
        userId
      );

      const answer =
        await peer.createAnswer();

      await peer.setLocalDescription(
        answer
      );

      sendMessage({
        type: "answer",
        target_user_id: userId,
        answer,
      });
    },
    [createPeerConnection, sendMessage]
  );

  const handleAnswer = useCallback(
    async (
      userId: number,
      answer: RTCSessionDescriptionInit
    ) => {
      const peer =
        peersRef.current.get(userId);

      if (!peer) {
        return;
      }

      await peer.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      const candidates =
        pendingCandidatesRef.current.get(
          userId
        ) || [];

      for (const candidate of candidates) {
        await peer.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }

      pendingCandidatesRef.current.delete(
        userId
      );
    },
    []
  );

  const handleIceCandidate = useCallback(
    async (
      userId: number,
      candidate: RTCIceCandidateInit
    ) => {
      const peer =
        peersRef.current.get(userId);

      if (
        !peer ||
        !peer.remoteDescription
      ) {
        const pending =
          pendingCandidatesRef.current.get(
            userId
          ) || [];

        pending.push(candidate);

        pendingCandidatesRef.current.set(
          userId,
          pending
        );

        return;
      }

      await peer.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    },
    []
  );

  useEffect(() => {
    if (!connected || !localStream) {
      return;
    }

    if (!lastMessage) {
      return;
    }

    const message = lastMessage;

    if (message.type === "room_state") {
      const participants =
        message.participants as number[];

      participants.forEach((userId) => {
        if (
          typeof userId === "number"
        ) {
          createOffer(userId).catch(
            console.error
          );
        }
      });

      return;
    }

    if (message.type === "offer") {
      const userId =
        Number(message.from_user_id);

      handleOffer(
        userId,
        message.offer as RTCSessionDescriptionInit
      ).catch(console.error);

      return;
    }

    if (message.type === "answer") {
      const userId =
        Number(message.from_user_id);

      handleAnswer(
        userId,
        message.answer as RTCSessionDescriptionInit
      ).catch(console.error);

      return;
    }

    if (
      message.type ===
      "ice_candidate"
    ) {
      const userId =
        Number(message.from_user_id);

      handleIceCandidate(
        userId,
        message.candidate as RTCIceCandidateInit
      ).catch(console.error);

      return;
    }

    if (message.type === "user_left") {
      const userId =
        Number(message.user_id);

      const peer =
        peersRef.current.get(userId);

      peer?.close();

      peersRef.current.delete(userId);

      setRemoteStreams((previous) => {
        const next = new Map(previous);

        next.delete(userId);

        return next;
      });
    }
  }, [
    connected,
    localStream,
    lastMessage,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  ]);

  useEffect(() => {
    if (!localStream) {
      return;
    }

    peersRef.current.forEach(
      (peer) => {
        const senders =
          peer.getSenders();

        localStream
          .getTracks()
          .forEach((track) => {
            const sender = senders.find(
              (item) =>
                item.track?.kind ===
                track.kind
            );

            if (sender) {
              sender.replaceTrack(
                track
              );
            } else {
              peer.addTrack(
                track,
                localStream
              );
            }
          });
      }
    );
  }, [localStream]);

  useEffect(() => {
    return () => {
      peersRef.current.forEach(
        (peer) => peer.close()
      );

      peersRef.current.clear();
    };
  }, [meetingCode]);
const replaceVideoTrack = useCallback(
  async (track: MediaStreamTrack) => {
    peersRef.current.forEach(
      (peer) => {
        const sender =
          peer
            .getSenders()
            .find(
              (item) =>
                item.track?.kind === "video"
            );

        if (sender) {
          sender.replaceTrack(track);
        }
      }
    );
  },
  []
);
return {
  remoteStreams,
  replaceVideoTrack,
};
}