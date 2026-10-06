import { Activity } from 'lucide-react';
import { Button } from './ui/button';
import type { Page, User } from '../App';
import homeBackground from '../assets/homeBackground.png'

interface HomePageProps {
  onNavigate: (page: Page) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  currentUser: User | null;
}

export function HomePage({ onNavigate, isLoggedIn, onLogout, currentUser }: HomePageProps) {
  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${homeBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-purple-600/40 to-pink-600/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-lg p-2">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xl">AlagaTrack</span>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <button 
              onClick={() => onNavigate('home')}
              className="text-white hover:text-blue-200 transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => onNavigate('about')}
              className="text-white hover:text-blue-200 transition-colors"
            >
              About
            </button>
            <button 
              onClick={() => onNavigate('contact')}
              className="text-white hover:text-blue-200 transition-colors"
            >
              Contact
            </button>
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => onNavigate(currentUser?.role === 'admin' ? 'admin-dashboard' : 'chw-dashboard')}
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={onLogout}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => onNavigate('login')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Login
              </Button>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl text-white mb-6">
              Empowering <span className="text-blue-300">Community</span>
              <br />
              <span className="text-pink-300">Health</span> Workers
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Streamline supervision, coordination, and reporting of health activities in your community with our comprehensive digital platform
            </p>
            <Button
              onClick={() => onNavigate('register')}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
            >
              Get Started →
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="bg-blue-500 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-white text-xl mb-2">CHW Management</h3>
              <p className="text-white/80">Efficiently manage and track community health workers in your area</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="bg-purple-500 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-white text-xl mb-2">Task Assignment</h3>
              <p className="text-white/80">Create and assign tasks to health workers with ease</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="bg-blue-400 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white text-xl mb-2">Report Submission</h3>
              <p className="text-white/80">Submit and track health reports in real-time</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="bg-pink-500 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-white text-xl mb-2">Analytics Dashboard</h3>
              <p className="text-white/80">View insights and analytics on health activities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
