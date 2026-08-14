"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getToken } from "@/lib/auth";

interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export function useWebSocket(
  meetingCode: string,
  enabled: boolean = true
) {
  const socketRef =
    useRef<WebSocket | null>(null);

  const [connected, setConnected] =
    useState(false);

  const [lastMessage, setLastMessage] =
    useState<WebSocketMessage | null>(
      null
    );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!meetingCode) {
      return;
    }

    const token = getToken();

    if (!token) {
      console.error(
        "No authentication token found"
      );
      return;
    }

    const wsBaseUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      "ws://localhost:8000";

    const socket = new WebSocket(
      `${wsBaseUrl}/ws/meetings/${meetingCode}?token=${encodeURIComponent(
        token
      )}`
    );

    socketRef.current = socket;

    socket.onopen = () => {
      console.log(
        "WebSocket connected:",
        meetingCode
      );

      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const message =
          JSON.parse(event.data);

        console.log(
          "WebSocket message:",
          message
        );

        setLastMessage(message);
      } catch (error) {
        console.error(
          "Invalid WebSocket message:",
          error
        );
      }
    };

    socket.onclose = (event) => {
      console.log(
        "WebSocket closed:",
        event.code,
        event.reason
      );

      setConnected(false);
    };

    socket.onerror = (error) => {
      console.error(
        "WebSocket connection failed:",
        error
      );

      setConnected(false);
    };

    return () => {
      socket.close();

      socketRef.current = null;

      setConnected(false);
    };
  }, [meetingCode, enabled]);

  const sendMessage = useCallback(
    (
      message: Record<string, unknown>
    ) => {
      const socket =
        socketRef.current;

      if (
        !socket ||
        socket.readyState !==
          WebSocket.OPEN
      ) {
        console.warn(
          "WebSocket is not connected"
        );

        return;
      }

      socket.send(
        JSON.stringify(message)
      );
    },
    []
  );

  return {
    connected,
    lastMessage,
    sendMessage,
  };
}