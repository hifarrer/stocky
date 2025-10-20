'use client';

import React from 'react';
import { Menu, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/contexts';
import { UserMenu } from '@/components/auth/UserMenu';
import { AlertsMenu } from '@/components/auth/AlertsMenu';
import Link from 'next/link';

interface SimpleHeaderProps {
  onMenuToggle?: () => void;
}

export function SimpleHeader({ onMenuToggle }: SimpleHeaderProps) {
  const { isConnected } = useWebSocket();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between px-4">
        {/* Left Section: Logo & Menu */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <TrendingUp className="h-6 w-6 text-success" />
            <span className="text-xl font-bold">BlockyFi</span>
          </Link>
        </div>

        {/* Center Section: Empty (no search bar) */}
        <div className="flex-1 max-w-md mx-4">
          {/* Empty space where search would be */}
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center space-x-2">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-success' : 'bg-danger'
              }`}
            />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Alerts Menu */}
          <AlertsMenu />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
