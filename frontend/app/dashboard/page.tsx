"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import {
  getToken,
  getUser,
  logout,
} from "@/lib/auth";


interface User {
  id: number;
  name: string;
  email: string;
}


interface Meeting {
  id: number;
  title: string;
  meeting_code: string;
  host_id: number;
  status: string;
  created_at: string;
}


interface CreateMeetingResponse {
  message: string;
  meeting: Meeting;
}


export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [meetings, setMeetings] =
    useState<Meeting[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [meetingTitle, setMeetingTitle] =
    useState("");

  const [joinCode, setJoinCode] =
    useState("");

  const [error, setError] =
    useState("");

  const [copiedCode, setCopiedCode] =
    useState<string | null>(null);


  useEffect(() => {
    const token = getToken();
    const currentUser = getUser();

    if (!token || !currentUser) {
      router.replace("/login");
      return;
    }

    setUser(currentUser);

    loadMeetings();
  }, [router]);


  async function loadMeetings() {
    try {
      setLoading(true);
      setError("");

      const data =
        await apiRequest<Meeting[]>(
          "/api/meetings"
        );

      setMeetings(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load meetings:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load meetings"
      );
    } finally {
      setLoading(false);
    }
  }


  async function createMeeting(
    event: FormEvent
  ) {
    event.preventDefault();

    const title =
      meetingTitle.trim();

    if (!title) {
      setError(
        "Please enter a meeting title."
      );
      return;
    }

    try {
      setCreating(true);
      setError("");

      const data =
        await apiRequest<CreateMeetingResponse>(
          "/api/meetings",
          {
            method: "POST",
            body: JSON.stringify({
              title,
            }),
          }
        );

      console.log(
        "Created meeting:",
        data
      );

      const meetingCode =
        data?.meeting?.meeting_code;

      if (!meetingCode) {
        console.error(
          "Invalid meeting response:",
          data
        );

        throw new Error(
          "Meeting was created but no meeting code was returned."
        );
      }

      setMeetingTitle("");

      router.push(
        `/meeting/${meetingCode}`
      );
    } catch (error) {
      console.error(
        "Failed to create meeting:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create meeting"
      );
    } finally {
      setCreating(false);
    }
  }


  function joinMeeting(
    event: FormEvent
  ) {
    event.preventDefault();

    const code =
      joinCode.trim();

    if (!code) {
      setError(
        "Please enter a meeting code."
      );
      return;
    }

    setError("");

    router.push(
      `/meeting/${code}`
    );
  }


  function openMeeting(
    meetingCode: string
  ) {
    if (!meetingCode) {
      setError(
        "Invalid meeting code."
      );
      return;
    }

    router.push(
      `/meeting/${meetingCode}`
    );
  }


  async function copyInviteLink(
    meetingCode: string
  ) {
    try {
      const link =
        `${window.location.origin}/meeting/${meetingCode}`;

      await navigator.clipboard.writeText(
        link
      );

      setCopiedCode(
        meetingCode
      );

      setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy invite link:",
        error
      );
    }
  }


  function handleLogout() {
    logout();

    router.replace("/login");
  }


  function formatDate(
    dateString: string
  ) {
    try {
      return new Date(
        dateString
      ).toLocaleString(
        undefined,
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );
    } catch {
      return dateString;
    }
  }


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}

      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-xl font-bold">
              ZoomClone
            </h1>

            <p className="text-xs text-slate-500">
              Video communication
            </p>
          </div>


          <div className="flex items-center gap-4">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {user?.name}
              </p>

              <p className="text-xs text-slate-500">
                {user?.email}
              </p>
            </div>


            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Logout
            </button>

          </div>

        </div>
      </header>


      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Welcome */}

        <section className="mb-10">

          <h2 className="text-3xl font-bold">
            Welcome back
            {user?.name
              ? `, ${user.name}`
              : ""}
          </h2>

          <p className="mt-2 text-slate-400">
            Start a meeting or join an
            existing one.
          </p>

        </section>


        {/* Error */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}


        {/* Actions */}

        <section className="grid gap-6 md:grid-cols-2">

          {/* Create meeting */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-5">

              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-2xl">
                +
              </div>

              <h3 className="text-xl font-semibold">
                New Meeting
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create a new meeting and
                invite others.
              </p>

            </div>


            <form
              onSubmit={createMeeting}
              className="space-y-4"
            >

              <input
                type="text"
                value={meetingTitle}
                onChange={(event) =>
                  setMeetingTitle(
                    event.target.value
                  )
                }
                placeholder="Meeting title"
                maxLength={100}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />


              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Create Meeting"}
              </button>

            </form>

          </div>


          {/* Join meeting */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-5">

              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600/10 text-2xl">
                →
              </div>

              <h3 className="text-xl font-semibold">
                Join Meeting
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Enter a meeting code to
                join.
              </p>

            </div>


            <form
              onSubmit={joinMeeting}
              className="space-y-4"
            >

              <input
                type="text"
                value={joinCode}
                onChange={(event) =>
                  setJoinCode(
                    event.target.value
                  )
                }
                placeholder="Enter meeting code"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm uppercase outline-none transition placeholder:font-sans placeholder:text-slate-600 focus:border-blue-500"
              />


              <button
                type="submit"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold transition hover:bg-slate-700"
              >
                Join Meeting
              </button>

            </form>

          </div>

        </section>


        {/* Meetings */}

        <section className="mt-12">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold">
                Your Meetings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Meetings you have created.
              </p>
            </div>


            <button
              onClick={loadMeetings}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Refresh
            </button>

          </div>


          {meetings.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-2xl">
                📹
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No meetings yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Create your first meeting
                to get started.
              </p>

            </div>

          ) : (

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {meetings.map(
                (meeting) => (
                  <div
                    key={meeting.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
                  >

                    {/* Meeting header */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <h3 className="truncate font-semibold">
                          {meeting.title}
                        </h3>

                        <p className="mt-2 text-xs text-slate-500">
                          Meeting ID
                        </p>

                        <p className="font-mono text-sm text-slate-300">
                          {meeting.meeting_code}
                        </p>

                      </div>


                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
                          meeting.status ===
                          "active"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {meeting.status}
                      </span>

                    </div>


                    {/* Date */}

                    <p className="mt-4 text-xs text-slate-600">
                      Created{" "}
                      {formatDate(
                        meeting.created_at
                      )}
                    </p>


                    {/* Actions */}

                    <div className="mt-5 flex gap-2">

                      {meeting.status ===
                        "active" && (
                        <button
                          onClick={() =>
                            openMeeting(
                              meeting.meeting_code
                            )
                          }
                          className="flex-1 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold transition hover:bg-blue-700"
                        >
                          Join
                        </button>
                      )}


                      <button
                        onClick={() =>
                          copyInviteLink(
                            meeting.meeting_code
                          )
                        }
                        className="rounded-lg border border-slate-700 px-3 py-2.5 text-sm transition hover:bg-slate-800"
                      >
                        {copiedCode ===
                        meeting.meeting_code
                          ? "Copied!"
                          : "Invite"}
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
}