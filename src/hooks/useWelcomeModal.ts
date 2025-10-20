'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const MODAL_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const FIRST_VISIT_KEY = 'blockyfi_first_visit';
const LAST_MODAL_SHOWN_KEY = 'blockyfi_last_modal_shown';

export function useWelcomeModal() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Don't show modal while auth is loading
    if (isLoading) return;

    // Don't show modal if user is authenticated
    if (isAuthenticated) {
      setShowModal(false);
      return;
    }

    // Check if this is the first visit
    const isFirstVisit = !localStorage.getItem(FIRST_VISIT_KEY);
    
    if (isFirstVisit) {
      // Mark first visit and show modal immediately
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
      setShowModal(true);
      return;
    }

    // For returning users, check if 5 minutes have passed since last modal
    const lastModalShown = localStorage.getItem(LAST_MODAL_SHOWN_KEY);
    const now = Date.now();

    if (!lastModalShown || (now - parseInt(lastModalShown)) >= MODAL_INTERVAL) {
      setShowModal(true);
      localStorage.setItem(LAST_MODAL_SHOWN_KEY, now.toString());
    }
  }, [isAuthenticated, isLoading]);

  const closeModal = () => {
    setShowModal(false);
  };

  return {
    showModal,
    closeModal,
  };
}
