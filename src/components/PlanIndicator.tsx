'use client';

import React from 'react';
import { Crown, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/contexts/PlanContext';
import Link from 'next/link';

export function PlanIndicator() {
  const { isPremium, hasRealTimeData } = usePlan();

  return (
    <div className="flex items-center gap-2">
      {isPremium ? (
        <Badge variant="default" className="bg-primary text-primary-foreground">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      ) : (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Free
        </Badge>
      )}
      
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {hasRealTimeData ? (
          <>
            <Zap className="h-3 w-3" />
            Real-time
          </>
        ) : (
          <>
            <Clock className="h-3 w-3" />
            5min delay
          </>
        )}
      </div>
      
      {!isPremium && (
        <Link href="/pricing">
          <Button size="sm" variant="outline" className="h-6 text-xs">
            Upgrade
          </Button>
        </Link>
      )}
    </div>
  );
}
