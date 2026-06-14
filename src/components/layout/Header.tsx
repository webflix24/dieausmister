"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import type { SessionUser } from "@/types";

export default function Header({ title }: { title?: string }) {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-semibold text-gray-800">{title ?? ""}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>{user?.name}</span>
          {user?.role === "ADMIN" && (
            <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded font-medium">
              Admin
            </span>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Abmelden</span>
        </button>
      </div>
    </header>
  );
}
