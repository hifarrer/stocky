'use client';

import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-slate-700 animate-pulse"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button
        onClick={() => router.push('/auth')}
        variant="default"
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-medium text-white">
          {user.username || user.email}
        </p>
        <p className="text-xs text-slate-400">{user.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="border-slate-700 hover:bg-slate-800"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

