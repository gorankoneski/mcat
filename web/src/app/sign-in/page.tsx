import { signIn, auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Sign in — MCAT Prep' };

async function signInWithEmail(formData: FormData) {
  'use server';
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return;
  await signIn('nodemailer', { email, redirectTo: '/dashboard' });
}

async function signInWithApple() {
  'use server';
  await signIn('apple', { redirectTo: '/dashboard' });
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const params = await searchParams;
  if (params.error === 'AccessDenied') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          This app is invite-only. Ask an admin to issue an invite for your
          email address.
        </p>
        <a href="/" className="text-blue-600 underline">
          Back
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Invite-only. Use the email your admin invited.
        </p>
      </div>

      <form action={signInWithApple}>
        <button
          type="submit"
          className="w-full rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
        >
          Sign in with Apple
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-neutral-500">
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        <span>or</span>
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <form action={signInWithEmail} className="flex flex-col gap-3">
        <label className="text-sm font-medium">Email magic link</label>
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-4 py-2 dark:border-neutral-700"
        >
          Send link
        </button>
      </form>
    </main>
  );
}
