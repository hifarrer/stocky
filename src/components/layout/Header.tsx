'use client';

import React from 'react';
import { Menu, Settings, Bell, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/search';
import { useSymbol, useUserPreferences, useWebSocket } from '@/contexts';
import { UserMenu } from '@/components/auth/UserMenu';

interface HeaderProps {
  onMenuToggle?: () => void;
  onSettingsOpen?: () => void;
}

export function Header({ onMenuToggle, onSettingsOpen }: HeaderProps) {
  const { selectSymbol } = useSymbol();
  const { watchlist } = useUserPreferences();
  const { isConnected } = useWebSocket();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
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
          
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-success" />
            <span className="text-xl font-bold">BlockyFi</span>
          </div>
        </div>

        {/* Center Section: Search */}
        <div className="flex-1 max-w-md mx-4">
          <SearchInput 
            placeholder="Search stocks, crypto..."
            onSymbolSelect={selectSymbol}
          />
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

          {/* Watchlist Count */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {watchlist.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs flex items-center justify-center text-primary-foreground">
                {watchlist.length}
              </span>
            )}
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" onClick={onSettingsOpen}>
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}