import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';

export default async function AppNav() {
  const session = await auth();
  if (!session?.user) return null;

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <nav className="sticky top-0 z-10 flex items-center gap-4 border-b border-neutral-200 bg-white/80 px-6 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <Link href="/dashboard" className="font-semibold">
        MCAT Prep
      </Link>
      <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/dashboard" className="hover:underline">Today</Link>
        <Link href="/lessons" className="hover:underline">Lessons</Link>
        <Link href="/exams" className="hover:underline">Exams</Link>
        <Link href="/counselor" className="hover:underline">Counselor</Link>
        {session.user.role === 'ADMIN' && (
          <Link href="/admin" className="hover:underline">Admin</Link>
        )}
      </div>
      <div className="ml-auto flex items-center gap-3 text-sm">
        <span className="text-neutral-500">{session.user.email}</span>
        <form action={handleSignOut}>
          <button className="text-neutral-500 hover:underline">Sign out</button>
        </form>
      </div>
    </nav>
  );
}
