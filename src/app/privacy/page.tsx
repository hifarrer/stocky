'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SimpleHeader } from '@/components/layout/SimpleHeader';

export default function PrivacyPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SimpleHeader 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <div className="p-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-6 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="space-y-6">
            {/* Introduction */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Introduction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  Welcome to BlockyFi. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our financial dashboard service. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the service.
                </p>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Personal Information</h3>
                  <p className="text-slate-300 leading-relaxed">
                    We may collect personal information that you voluntarily provide to us when you register for an account, including your name, email address, and any other information you choose to provide.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Financial Data</h3>
                  <p className="text-slate-300 leading-relaxed">
                    We collect and process financial market data, including stock prices, cryptocurrency prices, and market information to provide you with real-time financial insights and portfolio tracking.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Usage Information</h3>
                  <p className="text-slate-300 leading-relaxed">
                    We automatically collect certain information about your use of our service, including your IP address, browser type, device information, and usage patterns to improve our service and user experience.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Your Information */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>To provide, operate, and maintain our financial dashboard service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>To process your transactions and manage your account</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>To send you technical notices, updates, security alerts, and support messages</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>To respond to your comments, questions, and provide customer service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>To develop new products, services, features, and functionality</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>To monitor and analyze trends, usage, and activities in connection with our service</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Information Sharing */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Information Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:
                </p>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>With your explicit consent</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>To comply with legal obligations or respond to lawful requests</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>To protect our rights, property, or safety, or that of our users</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>With trusted service providers who assist us in operating our service</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Data Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  We use industry-standard encryption to protect your data both in transit and at rest, and we regularly review our security practices to ensure they meet the highest standards.
                </p>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Your Rights and Choices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  You have certain rights regarding your personal information:
                </p>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span><strong>Access:</strong> You can request access to the personal information we hold about you</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span><strong>Correction:</strong> You can request correction of inaccurate personal information</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span><strong>Deletion:</strong> You can request deletion of your personal information</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span><strong>Portability:</strong> You can request a copy of your data in a structured format</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span><strong>Opt-out:</strong> You can opt-out of certain communications from us</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Cookies and Tracking Technologies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your experience on our service. These technologies help us understand how you use our service and improve its functionality.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  You can control cookie settings through your browser preferences, but please note that disabling cookies may affect the functionality of our service.
                </p>
              </CardContent>
            </Card>

            {/* Third-Party Services */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Third-Party Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  Our service integrates with third-party financial data providers, including but not limited to Polygon.io and CoinGecko, to provide real-time market data. These third-party services have their own privacy policies, and we encourage you to review them.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  We do not control the privacy practices of these third-party services and are not responsible for their privacy policies or practices.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Privacy Policy */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-300">
                    <strong>Email:</strong> privacy@blockyfi.com
                  </p>
                  <p className="text-slate-300 mt-2">
                    <strong>Address:</strong> BlockyFi Privacy Team<br />
                    Customizable Finance Dashboard<br />
                    United States
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
