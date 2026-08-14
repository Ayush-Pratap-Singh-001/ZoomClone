"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Meeting } from "@/types/meeting";

interface Props {
  meeting: Meeting;
}

export default function MeetingCard({
  meeting,
}: Props) {
  const router = useRouter();

  const [copied, setCopied] =
    useState(false);

  async function copyLink() {
    const link =
      `${window.location.origin}/meeting/${meeting.meeting_code}`;

    await navigator.clipboard.writeText(link);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-white">
            {meeting.title}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Meeting ID
          </p>

          <p className="font-mono text-sm text-slate-300">
            {meeting.meeting_code}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs ${
            meeting.status === "active"
              ? "bg-green-500/10 text-green-400"
              : "bg-slate-800 text-slate-500"
          }`}
        >
          {meeting.status}
        </span>
      </div>

      <div className="mt-6 flex gap-2">
        {meeting.status === "active" && (
          <button
            onClick={() =>
              router.push(
                `/meeting/${meeting.meeting_code}`
              )
            }
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-700"
          >
            Join
          </button>
        )}

        <button
          onClick={copyLink}
          className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm hover:bg-slate-800"
        >
          {copied
            ? "Copied!"
            : "Copy invite"}
        </button>
      </div>
    </div>
  );
}