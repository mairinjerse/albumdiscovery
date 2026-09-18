"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

export default function AuthButton() {
  const { user, loading } = useAuth();

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (loading) {
    return <div className="h-8 w-20" />;
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="rounded-full border border-paper/20 px-4 py-1.5 text-xs font-medium text-paper/80 transition hover:border-paper/40 hover:text-paper"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/library"
        className="text-xs font-medium text-paper/70 underline-offset-4 hover:text-paper hover:underline"
      >
        My library
      </Link>
      <button
        onClick={signOut}
        className="rounded-full border border-paper/20 px-4 py-1.5 text-xs font-medium text-paper/80 transition hover:border-paper/40 hover:text-paper"
      >
        Sign out
      </button>
    </div>
  );
}
