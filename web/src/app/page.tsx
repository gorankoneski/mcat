import Link from 'next/link';
import { auth } from '@/lib/auth';

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-8">
      <h1 className="text-4xl font-semibold tracking-tight">MCAT Prep</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Private study app for the MCAT. Lessons, question banks, full-length
        simulators, spaced-repetition flashcards, and an AI Study Counselor
        powered by Claude.
      </p>

      {session?.user ? (
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="mb-2 text-sm text-neutral-500">
            Signed in as <strong>{session.user.email}</strong>
          </p>
          <Link href="/dashboard" className="text-blue-600 underline">
            Go to dashboard →
          </Link>
        </div>
      ) : (
        <Link
          href="/api/auth/signin"
          className="inline-flex w-fit items-center rounded-md bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-black"
        >
          Sign in
        </Link>
      )}

      <p className="text-xs text-neutral-500">
        Invite-only. Ask an admin for access.
      </p>
    </main>
  );
}
