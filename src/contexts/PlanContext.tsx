'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PlanType = 'free' | 'premium';

interface PlanContextType {
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  isPremium: boolean;
  isFree: boolean;
  hasPortfolioAccess: boolean;
  hasRealTimeData: boolean;
  hasPrioritySupport: boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

interface PlanProviderProps {
  children: ReactNode;
}

export function PlanProvider({ children }: PlanProviderProps) {
  const [plan, setPlanState] = useState<PlanType>('free');

  // Load plan from localStorage on mount
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('user-plan') as PlanType;
      if (savedPlan && (savedPlan === 'free' || savedPlan === 'premium')) {
        setPlanState(savedPlan);
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
    }
  }, []);

  // Save plan to localStorage when it changes
  const setPlan = (newPlan: PlanType) => {
    setPlanState(newPlan);
    try {
      localStorage.setItem('user-plan', newPlan);
    } catch (error) {
      console.error('Error saving user plan:', error);
    }
  };

  const isPremium = plan === 'premium';
  const isFree = plan === 'free';
  const hasPortfolioAccess = isPremium;
  const hasRealTimeData = isPremium;
  const hasPrioritySupport = isPremium;

  const value: PlanContextType = {
    plan,
    setPlan,
    isPremium,
    isFree,
    hasPortfolioAccess,
    hasRealTimeData,
    hasPrioritySupport,
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
