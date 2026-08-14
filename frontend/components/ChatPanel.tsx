"use client";

import {
  FormEvent,
  useState,
} from "react";

interface ChatMessage {
  user_id: number;
  username: string;
  message: string;
  timestamp?: string;
}

interface Props {
  messages: ChatMessage[];
  currentUserId: number;
  onSend: (message: string) => void;
}

export default function ChatPanel({
  messages,
  currentUserId,
  onSend,
}: Props) {
  const [message, setMessage] =
    useState("");

  function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    const value = message.trim();

    if (!value) {
      return;
    }

    onSend(value);
    setMessage("");
  }

  return (
    <aside className="absolute right-0 top-0 z-20 flex h-full w-80 flex-col border-l border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-5 py-4">
        <h2 className="font-semibold">
          Meeting Chat
        </h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-600">
            No messages yet.
            <br />
            Start the conversation.
          </div>
        ) : (
          messages.map(
            (item, index) => (
              <div
                key={`${item.timestamp}-${index}`}
                className={
                  item.user_id ===
                  currentUserId
                    ? "text-right"
                    : "text-left"
                }
              >
                <p className="mb-1 text-xs text-slate-500">
                  {item.username}
                </p>

                <span
                  className={`inline-block max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    item.user_id ===
                    currentUserId
                      ? "bg-blue-600"
                      : "bg-slate-800"
                  }`}
                >
                  {item.message}
                </span>
              </div>
            )
          )
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-slate-800 p-4"
      >
        <input
          value={message}
          onChange={(event) =>
            setMessage(
              event.target.value
            )
          }
          placeholder="Type a message..."
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        <button className="rounded-lg bg-blue-600 px-3">
          →
        </button>
      </form>
    </aside>
  );
}