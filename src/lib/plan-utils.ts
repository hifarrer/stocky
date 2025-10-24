import { usePlan } from '@/contexts/PlanContext';

/**
 * Utility function to add delay for free users
 * Demo mode - all users get real-time data
 */
export function addDataDelay<T>(data: T, isPremium: boolean): T {
  if (isPremium) {
    return data;
  }
  
  // Demo mode - no delays for any users
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
    dataDelay: 0, // Demo mode - no delays for any users
    shouldUseRealTime: true, // Demo mode - real-time for all users
  };
}

/**
 * Format data delay message for users
 */
export function getDataDelayMessage(isPremium: boolean): string {
  return 'Real-time data'; // Demo mode - all users get real-time data
}
