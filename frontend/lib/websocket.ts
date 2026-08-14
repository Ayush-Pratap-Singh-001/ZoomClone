export function createMeetingWebSocket(
  meetingCode: string,
  token: string
) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_WS_URL;

  const wsUrl =
    configuredUrl ||
    (window.location.protocol === "https:"
      ? `wss://${window.location.host}`
      : "ws://localhost:8000");

  return new WebSocket(
    `${wsUrl}/ws/meetings/${meetingCode}?token=${encodeURIComponent(token)}`
  );
}