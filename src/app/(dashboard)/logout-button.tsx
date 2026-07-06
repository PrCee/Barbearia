"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full mt-2 py-2.5 rounded-xl text-xs font-medium text-neutral-500 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
    >
      Sair
    </button>
  );
}
