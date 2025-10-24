'use client';

import React from 'react';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  feature?: string;
  className?: string;
}

export function UpgradePrompt({ 
  title = "Premium Feature", 
  description = "This feature is available with a Premium subscription.",
  feature,
  className = ""
}: UpgradePromptProps) {
  return (
    <Card className={`border-dashed border-2 border-muted-foreground/20 ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          {description}
          {feature && (
            <span className="block mt-2 text-sm font-medium">
              {feature}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Premium subscription required</span>
          </div>
          <Link href="/pricing">
            <Button className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
