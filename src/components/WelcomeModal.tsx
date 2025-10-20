'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay for smooth animation
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleLogin = () => {
    router.push('/auth');
  };

  const handleMaybeLater = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleMaybeLater}
      />
      
      {/* Modal content */}
      <div 
        className={`relative bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="https://res.cloudinary.com/dqemas8ht/image/upload/v1760924789/Blockyfi_rhuczn.png" 
            alt="Blockyfi Logo" 
            className="h-16 w-auto"
          />
        </div>

        {/* Demo Video */}
        <div className="mb-6">
          <video 
            src="https://res.cloudinary.com/dqemas8ht/video/upload/v1760924773/blockydemo_ah3j5p.mp4"
            controls
            autoPlay
            muted
            loop
            playsInline
            className="w-full rounded-lg shadow-lg"
            poster=""
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-slate-200 text-sm leading-relaxed">
            Login to continue using Blockyfi for free and access real-time market data, news, and analysis.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleMaybeLater}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleLogin}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
}
