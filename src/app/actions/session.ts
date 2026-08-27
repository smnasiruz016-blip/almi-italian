"use server";

// The logout server action, lifted out of (shell)/layout.tsx.
//
// It used to be declared inline in that layout with `"use server"` inside an async function.
// That was fine while the layout was a server component, but the layout is now pure and the
// Sidebar — a client component — needs to call it. A server action in its own "use server"
// module is importable from client code; one declared inside a server component is not.
//
// This file holds no session read of its own: destroySession() reads the cookie at call time,
// inside a POST, which is a request Next already treats as dynamic. Nothing here can drag a
// static page back into dynamic rendering.

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
