import { useState } from 'react';
import { ArrowLeft, Activity, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import type { Page, User } from '../App';

interface RegisterPageProps {
  onNavigate: (page: Page) => void;
  onRegister: (user: User, password: string) => Promise<User>;
  existingUsers: User[];
}

export function RegisterPage({ onNavigate, onRegister, existingUsers }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'chw' as 'admin' | 'chw',
    contactNumber: '',
    barangayZone: '',
    chwArea: '',
    homeAddress: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.username || !formData.email || !formData.fullName || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    // Check if username already exists
    if (existingUsers.some(user => user.username === formData.username)) {
      toast.error('Username already exists');
      return;
    }

    // Check if email already exists
    if (existingUsers.some(user => user.email === formData.email)) {
      toast.error('Email already exists');
      return;
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}`,
      username: formData.username,
      email: formData.email,
      fullName: formData.fullName,
      role: formData.role,
      contactNumber: formData.contactNumber,
      barangayZone: formData.barangayZone,
      chwArea: formData.chwArea,
      homeAddress: formData.homeAddress,
      theme: 'light'
    };

    try {
      await onRegister(newUser, formData.password);
      onNavigate('login');
    } catch (error) {
      // Error already handled in parent component
      console.error('Registration failed:', error);
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

      {/* Registration Form */}
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl text-gray-900 mb-2 text-center">Create Account</h1>
          <p className="text-gray-600 text-center mb-8">Register to get started with AlagaTrack</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Dela Cruz"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="juandc"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Register as *</Label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'chw' })}
              >
                <option value="chw">Community Health Worker (CHW)</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {formData.role === 'chw' && (
              <>
                <div>
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    placeholder="+63 123 456 7890"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="barangayZone">Barangay/Zone</Label>
                  <Input
                    id="barangayZone"
                    type="text"
                    placeholder="Barangay 1, Zone A"
                    value={formData.barangayZone}
                    onChange={(e) => setFormData({ ...formData, barangayZone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="chwArea">CHW Area</Label>
                  <Input
                    id="chwArea"
                    type="text"
                    placeholder="Area 1"
                    value={formData.chwArea}
                    onChange={(e) => setFormData({ ...formData, chwArea: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="homeAddress">Home Address</Label>
                  <Input
                    id="homeAddress"
                    type="text"
                    placeholder="123 Main St, Barangay 1"
                    value={formData.homeAddress}
                    onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-blue-600 hover:text-blue-700"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}