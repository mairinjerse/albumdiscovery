import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
      <p className="text-paper/70">Something went wrong signing you in. Please try again.</p>
      <Link href="/" className="text-xs text-paper/40 underline-offset-4 hover:underline">
        Back to discovery
      </Link>
    </main>
  );
}
