'use client';

import Link from 'next/link';
import { TrendingUp, Shield, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
              <span className="text-xl font-bold text-white">BlockyFi</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Professional financial dashboard for real-time market analysis, stock tracking, and cryptocurrency monitoring.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/portfolio" 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link 
                  href="/profile" 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-slate-400 hover:text-white transition-colors text-sm flex items-center"
                >
                  <Shield className="h-3 w-3 mr-2" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center text-slate-400 text-sm">
                <Mail className="h-3 w-3 mr-2" />
                <span>support@blockyfi.com</span>
              </div>
              <p className="text-slate-400 text-xs">
                Customizable Finance Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} BlockyFi. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
