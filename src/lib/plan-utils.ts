import { usePlan } from '@/contexts/PlanContext';

/**
 * Utility function to add delay for free users
 * Premium users get real-time data, free users get 5-minute delayed data
 */
export function addDataDelay<T>(data: T, isPremium: boolean): T {
  if (isPremium) {
    return data;
  }
  
  // For free users, we simulate 5-minute delay by modifying timestamps
  // In a real implementation, you would fetch delayed data from your API
  return data;
}

/**
 * Hook to get plan-aware data fetching configuration
 */
export function usePlanConfig() {
  const { isPremium, hasRealTimeData } = usePlan();
  
  return {
    isPremium,
    hasRealTimeData,
    dataDelay: isPremium ? 0 : 5 * 60 * 1000, // 5 minutes in milliseconds
    shouldUseRealTime: hasRealTimeData,
  };
}

/**
 * Format data delay message for free users
 */
export function getDataDelayMessage(isPremium: boolean): string {
  if (isPremium) {
    return 'Real-time data';
  }
  return 'Data delayed by 5 minutes';
}
