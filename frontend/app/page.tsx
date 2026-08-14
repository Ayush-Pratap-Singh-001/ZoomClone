"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between px-8 py-6">
        <h1 className="text-2xl font-bold">
          ZoomClone
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/login")}
            className="rounded-lg border border-slate-700 px-5 py-2 hover:bg-slate-800"
          >
            Login
          </button>

          <button
            onClick={() => router.push("/register")}
            className="rounded-lg bg-blue-600 px-5 py-2 hover:bg-blue-700"
          >
            Get Started
          </button>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[75vh] max-w-6xl items-center px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-blue-400">
            Video communication made simple
          </p>

          <h2 className="text-5xl font-bold leading-tight md:text-7xl">
            Connect.
            <br />
            Collaborate.
            <br />
            Communicate.
          </h2>

          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            A real-time video communication platform
            built with Next.js, FastAPI and WebRTC.
          </p>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => router.push("/register")}
              className="rounded-xl bg-blue-600 px-7 py-3 font-semibold hover:bg-blue-700"
            >
              Start a Meeting
            </button>

            <button
              onClick={() => router.push("/login")}
              className="rounded-xl border border-slate-700 px-7 py-3 font-semibold hover:bg-slate-800"
            >
              Join a Meeting
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}