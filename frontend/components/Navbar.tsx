"use client";

import { useRouter } from "next/navigation";
import { getUser, logout } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const user = getUser();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-8 py-5 text-white">
      <button
        onClick={() => router.push("/dashboard")}
        className="text-xl font-bold"
      >
        ZoomClone
      </button>

      <div className="flex items-center gap-5">
        {user && (
          <span className="text-sm text-slate-400">
            {user.name}
          </span>
        )}

        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}