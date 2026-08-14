"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { apiRequest } from "@/lib/api";

import {
  getToken,
  getUser,
} from "@/lib/auth";

import {
  useWebSocket,
} from "@/hooks/useWebSocket";

import {
  useMediaStream,
} from "@/hooks/useMediaStream";

import {
  useWebRTC,
} from "@/hooks/useWebRTC";

import {
  useScreenShare,
} from "@/hooks/useScreenShare";

import VideoGrid from "@/components/VideoGrid";

import MeetingControls from "@/components/MeetingControls";

import ParticipantsPanel from "@/components/ParticipantsPanel";

import ChatPanel from "@/components/ChatPanel";

import {
  MeetingDetails,
} from "@/types/meeting";


interface ChatMessage {
  user_id: number;
  username: string;
  message: string;
  timestamp?: string;
}


interface MediaState {
  audio: boolean;
  video: boolean;
}


export default function MeetingPage() {
  const params = useParams();

  const router = useRouter();

  const meetingCode =
    typeof params.meetingCode ===
    "string"
      ? params.meetingCode
      : "";


  const user = getUser();


  const [meeting, setMeeting] =
    useState<MeetingDetails | null>(
      null
    );


  const [messages, setMessages] =
    useState<ChatMessage[]>([]);


  const [mediaStates, setMediaStates] =
    useState<
      Record<number, MediaState>
    >({});


  const [
    showParticipants,
    setShowParticipants,
  ] = useState(false);


  const [
    showChat,
    setShowChat,
  ] = useState(false);


  const [
    meetingEnded,
    setMeetingEnded,
  ] = useState(false);


  const [
    copied,
    setCopied,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    meetingReady,
    setMeetingReady,
  ] = useState(false);


  const {
    connected,
    lastMessage,
    sendMessage,
  } = useWebSocket(
    meetingCode,
    meetingReady
  );


  const {
    stream,
    audioEnabled,
    videoEnabled,
    startMedia,
    toggleAudio,
    toggleVideo,
    stopMedia,
  } = useMediaStream();


  const {
    remoteStreams,
    replaceVideoTrack,
  } = useWebRTC({
    meetingCode,
    localStream: stream,
    connected,
    lastMessage,
    sendMessage,
  });


  const cameraTrack =
    stream?.getVideoTracks()[0] ||
    null;


  const {
    isSharing,
    startScreenShare,
    stopScreenShare,
  } = useScreenShare(
    replaceVideoTrack,
    cameraTrack
  );


  const isHost =
    meeting?.meeting.host_id ===
    user?.id;


  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    if (!meetingCode) {
      setError(
        "Invalid meeting link."
      );
      setLoading(false);
      return;
    }

    initializeMeeting();
  }, [
    router,
    meetingCode,
  ]);


  useEffect(() => {
    if (!meetingReady) {
      return;
    }

    startMedia().catch(
      (mediaError) => {
        console.error(
          "Media error:",
          mediaError
        );

        setError(
          "Camera or microphone permission was denied."
        );
      }
    );
  }, [
    meetingReady,
    startMedia,
  ]);


  useEffect(() => {
    if (!lastMessage) {
      return;
    }


    if (
      lastMessage.type ===
      "user_joined"
    ) {
      refreshMeeting();
    }


    if (
      lastMessage.type ===
      "user_left"
    ) {
      const userId = Number(
        lastMessage.user_id
      );

      setMediaStates(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[userId];

          return next;
        }
      );

      refreshMeeting();
    }


    if (
      lastMessage.type ===
      "media_state"
    ) {
      const userId = Number(
        lastMessage.user_id
      );

      setMediaStates(
        (previous) => ({
          ...previous,
          [userId]: {
            audio: Boolean(
              lastMessage.audio
            ),
            video: Boolean(
              lastMessage.video
            ),
          },
        })
      );
    }


    if (
      lastMessage.type ===
      "chat"
    ) {
      setMessages(
        (previous) => [
          ...previous,
          {
            user_id: Number(
              lastMessage.user_id
            ),
            username: String(
              lastMessage.username
            ),
            message: String(
              lastMessage.message
            ),
            timestamp:
              lastMessage.timestamp
                ? String(
                    lastMessage.timestamp
                  )
                : undefined,
          },
        ]
      );
    }


    if (
      lastMessage.type ===
      "force_mute"
    ) {
      if (audioEnabled) {
        toggleAudio();
      }
    }


    if (
      lastMessage.type ===
      "removed_from_meeting"
    ) {
      stopMedia();

      router.push("/dashboard");
    }


    if (
      lastMessage.type ===
      "meeting_ended"
    ) {
      stopMedia();

      setMeetingEnded(true);
    }
  }, [
    lastMessage,
    audioEnabled,
    router,
    stopMedia,
    toggleAudio,
  ]);


  async function initializeMeeting() {
    try {
      setLoading(true);

      setError("");


      // Step 1:
      // Load meeting details

      const meetingData =
        await apiRequest<MeetingDetails>(
          `/api/meetings/${meetingCode}`
        );


      setMeeting(meetingData);


      // Step 2:
      // Join the meeting before
      // loading messages

      await apiRequest(
        `/api/meetings/${meetingCode}/join`,
        {
          method: "POST",
        }
      );


      // Step 3:
      // Now it is safe to load
      // chat history

      await loadMessages();


      // Step 4:
      // Only now allow WebSocket
      // connection

      setMeetingReady(true);

    } catch (error) {
      console.error(
        "Failed to initialize meeting:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to join meeting"
      );
    } finally {
      setLoading(false);
    }
  }


  async function refreshMeeting() {
    try {
      const data =
        await apiRequest<MeetingDetails>(
          `/api/meetings/${meetingCode}`
        );

      setMeeting(data);
    } catch (error) {
      console.error(
        "Failed to refresh meeting:",
        error
      );
    }
  }


  async function loadMessages() {
    try {
      const data =
        await apiRequest<
          ChatMessage[]
        >(
          `/api/meetings/${meetingCode}/messages`
        );

      setMessages(data);

    } catch (error) {
      console.error(
        "Could not load messages:",
        error
      );
    }
  }


  function handleToggleAudio() {
    const enabled =
      toggleAudio();

    sendMessage({
      type: "media_state",
      audio: enabled,
      video: videoEnabled,
    });

    setMediaStates(
      (previous) => ({
        ...previous,
        [user?.id || 0]: {
          audio: enabled,
          video: videoEnabled,
        },
      })
    );
  }


  function handleToggleVideo() {
    const enabled =
      toggleVideo();

    sendMessage({
      type: "media_state",
      audio: audioEnabled,
      video: enabled,
    });

    setMediaStates(
      (previous) => ({
        ...previous,
        [user?.id || 0]: {
          audio: audioEnabled,
          video: enabled,
        },
      })
    );
  }


  async function handleScreenShare() {
    try {
      if (isSharing) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (error) {
      console.error(
        "Screen sharing failed:",
        error
      );
    }
  }


  function sendChat(
    message: string
  ) {
    sendMessage({
      type: "chat",
      message,
    });
  }


  function muteParticipant(
    userId: number
  ) {
    sendMessage({
      type: "host_mute",
      target_user_id: userId,
    });
  }


  function removeParticipant(
    userId: number
  ) {
    sendMessage({
      type: "remove_participant",
      target_user_id: userId,
    });
  }


  async function copyMeetingLink() {
    const link =
      `${window.location.origin}/meeting/${meetingCode}`;

    await navigator.clipboard.writeText(
      link
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }


  async function leaveMeeting() {
    try {
      stopMedia();

      await apiRequest(
        `/api/meetings/${meetingCode}/leave`,
        {
          method: "POST",
        }
      );

    } catch (error) {
      console.error(
        "Failed to leave meeting:",
        error
      );

    } finally {
      router.push("/dashboard");
    }
  }


  async function endMeeting() {
    try {
      stopMedia();

      await apiRequest(
        `/api/meetings/${meetingCode}/end`,
        {
          method: "POST",
        }
      );

      router.push("/dashboard");

    } catch (error) {
      console.error(
        "Failed to end meeting:",
        error
      );
    }
  }


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>
          Joining meeting...
        </p>
      </main>
    );
  }


  if (meetingEnded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-3xl">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-bold">
            Meeting ended
          </h1>

          <p className="mt-3 text-slate-400">
            The host has ended this
            meeting.
          </p>

          <button
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
          >
            Back to Dashboard
          </button>

        </div>
      </main>
    );
  }


  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="text-center">

          <h1 className="text-2xl font-bold">
            Unable to join meeting
          </h1>

          <p className="mt-3 text-red-400">
            {error}
          </p>

          <button
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            className="mt-6 rounded-lg bg-blue-600 px-5 py-3"
          >
            Back to Dashboard
          </button>

        </div>
      </main>
    );
  }


  return (
    <main className="relative flex min-h-screen flex-col bg-black text-white">

      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">

        <div>

          <h1 className="font-semibold">
            {meeting?.meeting.title}
          </h1>

          <div className="flex items-center gap-3">

            <p className="font-mono text-sm text-slate-500">
              {meetingCode}
            </p>

            <button
              onClick={
                copyMeetingLink
              }
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {copied
                ? "Invite link copied"
                : "Copy invite link"}
            </button>

          </div>

        </div>


        <div
          className={`flex items-center gap-2 text-sm ${
            connected
              ? "text-green-400"
              : "text-red-400"
          }`}
        >

          <span
            className={`h-2 w-2 rounded-full ${
              connected
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />

          {connected
            ? "Connected"
            : "Connecting..."}

        </div>

      </header>


      <section className="relative flex flex-1 items-center justify-center overflow-hidden p-6">

        <div className="w-full max-w-7xl">

          <VideoGrid
            localStream={stream}
            remoteStreams={
              remoteStreams
            }
            participants={
              meeting?.participants ||
              []
            }
            currentUserId={
              user?.id || 0
            }
            mediaStates={
              mediaStates
            }
          />

        </div>


        {showParticipants && (
          <ParticipantsPanel
            participants={
              meeting?.participants ||
              []
            }
            currentUserId={
              user?.id || 0
            }
            isHost={isHost}
            onMute={
              muteParticipant
            }
            onRemove={
              removeParticipant
            }
          />
        )}


        {showChat && (
          <ChatPanel
            messages={messages}
            currentUserId={
              user?.id || 0
            }
            onSend={sendChat}
          />
        )}

      </section>


      <MeetingControls
        audioEnabled={
          audioEnabled
        }
        videoEnabled={
          videoEnabled
        }
        isSharing={isSharing}
        isHost={isHost}
        onToggleAudio={
          handleToggleAudio
        }
        onToggleVideo={
          handleToggleVideo
        }
        onToggleScreen={
          handleScreenShare
        }
        onParticipants={() => {
          setShowParticipants(
            (value) => !value
          );

          setShowChat(false);
        }}
        onChat={() => {
          setShowChat(
            (value) => !value
          );

          setShowParticipants(
            false
          );
        }}
        onLeave={
          leaveMeeting
        }
        onEnd={endMeeting}
      />

    </main>
  );
}