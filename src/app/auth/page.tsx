'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || 'Login failed');
        return;
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    // Validate passwords match
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }

    // Validate password length
    if (registerPassword.length < 8) {
      setRegisterError('Password must be at least 8 characters long');
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerEmail,
          username: registerUsername || undefined,
          password: registerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.error || 'Registration failed');
        return;
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/');
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError('An unexpected error occurred');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">BlockyFi</h1>
          <p className="text-slate-400">Real-time market insights and analytics</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Welcome</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="login-email" className="text-sm font-medium text-slate-200">
                      Email
                    </label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="bg-slate-900 border-slate-700 text-white"
                      disabled={loginLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="login-password" className="text-sm font-medium text-slate-200">
                      Password
                    </label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="bg-slate-900 border-slate-700 text-white"
                      disabled={loginLoading}
                    />
                  </div>

                  {loginError && (
                    <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-md p-3">
                      {loginError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="register-email" className="text-sm font-medium text-slate-200">
                      Email
                    </label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="bg-slate-900 border-slate-700 text-white"
                      disabled={registerLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="register-username" className="text-sm font-medium text-slate-200">
                      Username (optional)
                    </label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="johndoe"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                      disabled={registerLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="register-password" className="text-sm font-medium text-slate-200">
                      Password
                    </label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      className="bg-slate-900 border-slate-700 text-white"
                      disabled={registerLoading}
                    />
                    <p className="text-xs text-slate-400">Must be at least 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="register-confirm-password" className="text-sm font-medium text-slate-200">
                      Confirm Password
                    </label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                      className="bg-slate-900 border-slate-700 text-white"
                      disabled={registerLoading}
                    />
                  </div>

                  {registerError && (
                    <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-md p-3">
                      {registerError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={registerLoading}
                  >
                    {registerLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-400 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

