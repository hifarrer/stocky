'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SimpleHeader } from '@/components/layout/SimpleHeader';

export default function TermsPage() {
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
            <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
            <p className="text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="space-y-6">
            {/* Introduction */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Agreement to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  These Terms of Service (&quot;Terms&quot;) govern your use of BlockyFi&apos;s financial dashboard service (&quot;Service&quot;). By accessing or using our service, you agree to be bound by these Terms and all applicable laws and regulations.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  If you do not agree with any of these terms, you are prohibited from using or accessing this service.
                </p>
              </CardContent>
            </Card>

            {/* Service Description */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Service Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  BlockyFi provides a customizable financial dashboard that offers real-time market data, portfolio tracking, and financial analysis tools. Our service includes:
                </p>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>Real-time stock and cryptocurrency price data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>Portfolio tracking and management tools</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>Market analysis and technical indicators</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>Financial news and market sentiment data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>Customizable dashboard widgets</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* User Responsibilities */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">User Responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  By using our service, you agree to:
                </p>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>Provide accurate and complete information when creating your account</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>Maintain the security of your account credentials</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>Use the service only for lawful purposes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>Not attempt to gain unauthorized access to our systems</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>Not use the service to violate any applicable laws or regulations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>Not share your account with others</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Data and Privacy */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Data and Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  By using our service, you consent to the collection and use of information as described in our Privacy Policy.
                </p>
              </CardContent>
            </Card>

            {/* Financial Data Disclaimer */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Financial Data Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  <strong>Important:</strong> The financial data provided through our service is for informational purposes only and should not be considered as financial advice, investment recommendations, or a solicitation to buy or sell securities.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  All market data is provided by third-party sources and may be delayed or inaccurate. We do not guarantee the accuracy, completeness, or timeliness of any financial data.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  You should always consult with qualified financial professionals before making investment decisions.
                </p>
              </CardContent>
            </Card>

            {/* Service Availability */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Service Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  We strive to provide continuous service availability, but we do not guarantee that our service will be uninterrupted or error-free. We may experience downtime for maintenance, updates, or due to circumstances beyond our control.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  We reserve the right to modify, suspend, or discontinue any part of our service at any time without notice.
                </p>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  To the maximum extent permitted by law, BlockyFi shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Our total liability to you for any damages arising from or related to these Terms or the Service shall not exceed the amount you paid us for the Service in the twelve months preceding the claim.
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including if you breach these Terms.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  You may terminate your account at any time by contacting us or using the account deletion features in your profile settings.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Upon termination, your right to use the Service will cease immediately, and we may delete your account and data.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-300">
                    <strong>Email:</strong> legal@blockyfi.com
                  </p>
                  <p className="text-slate-300 mt-2">
                    <strong>Address:</strong> BlockyFi Legal Team<br />
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
