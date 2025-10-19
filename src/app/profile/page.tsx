'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  // Email form state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Initialize email from user
  useEffect(() => {
    if (user) {
      setEmail(user.email);
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (email === user?.email) {
      setEmailError('This is already your current email');
      return;
    }

    setEmailLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/auth/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailError(data.error || 'Failed to update email');
        return;
      }

      // Update token and user in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Refresh user in context
      await refreshUser();

      setEmailSuccess('Email updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setEmailSuccess(''), 3000);
    } catch (error) {
      console.error('Update email error:', error);
      setEmailError('An unexpected error occurred');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to update password');
        return;
      }

      setPasswordSuccess('Password updated successfully!');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      console.error('Update password error:', error);
      setPasswordError('An unexpected error occurred');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 py-8">
      <div className="max-w-3xl mx-auto">
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
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-slate-400">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Account Info */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Account Information</CardTitle>
              <CardDescription className="text-slate-400">
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300">Username</label>
                <p className="text-white mt-1">{user.username || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Member since</label>
                <p className="text-white mt-1">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Update Email */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Update Email
              </CardTitle>
              <CardDescription className="text-slate-400">
                Change your email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-200">
                    New Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                    disabled={emailLoading}
                  />
                </div>

                {emailError && (
                  <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-md p-3">
                    {emailError}
                  </div>
                )}

                {emailSuccess && (
                  <div className="text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 rounded-md p-3">
                    {emailSuccess}
                  </div>
                )}

                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={emailLoading}
                >
                  {emailLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Email'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Update Password */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription className="text-slate-400">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="current-password" className="text-sm font-medium text-slate-200">
                    Current Password
                  </label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                    disabled={passwordLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium text-slate-200">
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                    disabled={passwordLoading}
                  />
                  <p className="text-xs text-slate-400">Must be at least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-slate-200">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                    disabled={passwordLoading}
                  />
                </div>

                {passwordError && (
                  <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-md p-3">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 rounded-md p-3">
                    {passwordSuccess}
                  </div>
                )}

                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

