'use client';

import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, Briefcase } from 'lucide-react';

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">
              {user.username || user.email}
            </p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
        <DropdownMenuLabel className="text-slate-200">
          My Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem
          onClick={() => router.push('/profile')}
          className="cursor-pointer text-slate-200 focus:bg-slate-700 focus:text-white"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push('/portfolio')}
          className="cursor-pointer text-slate-200 focus:bg-slate-700 focus:text-white"
        >
          <Briefcase className="mr-2 h-4 w-4" />
          <span>Portfolio</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer text-red-400 focus:bg-slate-700 focus:text-red-300"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

