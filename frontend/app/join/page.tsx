"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();

  const [meetingCode, setMeetingCode] =
    useState("");

  function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!meetingCode.trim()) {
      return;
    }

    router.push(
      `/meeting/${meetingCode.trim().toUpperCase()}`
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8"
      >
        <h1 className="text-3xl font-bold">
          Join Meeting
        </h1>

        <p className="mt-2 text-slate-400">
          Enter the meeting code to continue.
        </p>

        <input
          value={meetingCode}
          onChange={(e) =>
            setMeetingCode(e.target.value)
          }
          placeholder="ABC123XYZ"
          className="mt-6 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 uppercase outline-none focus:border-blue-500"
        />

        <button
          className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700"
        >
          Continue
        </button>
      </form>
    </main>
  );
}