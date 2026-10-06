import { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import * as api from '../utils/api';
import type { Page, User } from '../App';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
  onLogin: (user: User) => void;
  users: User[];
}

export function LoginPage({ onNavigate, onLogin, users }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  useEffect(() => {
    // Check if user was blocked previously
    const blockedUntil = localStorage.getItem('login_blocked_until');
    if (blockedUntil) {
      const timeRemaining = parseInt(blockedUntil) - Date.now();
      if (timeRemaining > 0) {
        setIsBlocked(true);
        setBlockTimeRemaining(Math.ceil(timeRemaining / 1000));
      } else {
        localStorage.removeItem('login_blocked_until');
        localStorage.removeItem('login_failed_attempts');
      }
    }

    const attempts = localStorage.getItem('login_failed_attempts');
    if (attempts) {
      setFailedAttempts(parseInt(attempts));
    }
  }, []);

  useEffect(() => {
    if (isBlocked && blockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setFailedAttempts(0);
            localStorage.removeItem('login_blocked_until');
            localStorage.removeItem('login_failed_attempts');
            toast.success('You can now try logging in again');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isBlocked, blockTimeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      toast.error(`Too many failed attempts. Try again after ${formatTime(blockTimeRemaining)}`);
      return;
    }

    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    try {
      // Attempt login via API
      const user = await api.login(username, password);
      
      // Successful login - reset attempts
      setFailedAttempts(0);
      localStorage.removeItem('login_failed_attempts');
      localStorage.removeItem('login_blocked_until');
      await api.resetLoginAttempts(username);
      
      toast.success(`Welcome back, ${user.fullName}! (${user.role === 'admin' ? 'Administrator' : 'CHW'})`);
      onLogin(user);
    } catch (error) {
      // Login failed - increment attempts
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem('login_failed_attempts', newAttempts.toString());

      if (newAttempts >= 4) {
        // Block for 5 minutes
        const blockUntil = Date.now() + (5 * 60 * 1000);
        localStorage.setItem('login_blocked_until', blockUntil.toString());
        setIsBlocked(true);
        setBlockTimeRemaining(300); // 5 minutes in seconds
        
        // Store block info in database
        await api.updateLoginAttempts(username, { count: newAttempts, blockedUntil: blockUntil });
        
        toast.error('Too many failed attempts. You are blocked for 5 minutes.');
      } else {
        await api.updateLoginAttempts(username, { count: newAttempts, blockedUntil: null });
        toast.error(`Invalid credentials. ${4 - newAttempts} attempts remaining before block.`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-lg p-2">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-gray-900 text-xl">AlagaTrack</span>
          </div>
          <Button
            onClick={() => onNavigate('home')}
            variant="ghost"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Login Form */}
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl text-gray-900 mb-2 text-center">Welcome Back</h1>
          <p className="text-gray-600 text-center mb-8">Login to access your AlagaTrack account</p>

          {/* Block Warning */}
          {isBlocked && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="text-red-900 mb-1">Account Temporarily Blocked</h3>
                  <p className="text-red-700 text-sm">
                    Too many failed login attempts. Try again after:
                  </p>
                  <p className="text-red-900 text-2xl mt-2">
                    {formatTime(blockTimeRemaining)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed Attempts Warning */}
          {!isBlocked && failedAttempts > 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-yellow-900">
                    {4 - failedAttempts} attempt{4 - failedAttempts !== 1 ? 's' : ''} remaining before 5-minute block
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isBlocked}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isBlocked}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  disabled={isBlocked}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              disabled={isBlocked}
            >
              {isBlocked ? `Blocked - ${formatTime(blockTimeRemaining)}` : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-blue-600 hover:text-blue-700"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}