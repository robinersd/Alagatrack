import { ArrowLeft, Activity, Smartphone, Database, Cloud } from 'lucide-react';
import { Button } from './ui/button';
import type { Page } from '../App';

interface AboutPageProps {
  onNavigate: (page: Page) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
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

      {/* Content */}
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl text-gray-900 mb-8 text-center">
            About <span className="text-blue-600">AlagaTrack</span>
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              AlagaTrack is an innovative mobile and web-based system developed to assist Community Health Workers (CHWs) in efficiently monitoring, recording, and reporting community health data.
            </p>

            <p className="text-gray-700 text-lg leading-relaxed mb-8">
              This mobile prototype serves as the portable version of the AlagaTrack system, giving CHWs access to essential tools right from their smartphones. It helps them log activities, update health records, and submit reports anytime and anywhere, especially while performing fieldwork in remote areas.
            </p>

            {/* Features */}
            <div className="grid md:grid-cols-2 gap-6 my-12">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <div className="bg-blue-600 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl text-gray-900 mb-2">Mobile Access</h3>
                <p className="text-gray-700">Access essential tools from anywhere, anytime with our mobile-first design</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <div className="bg-purple-600 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl text-gray-900 mb-2">Data Management</h3>
                <p className="text-gray-700">Efficiently record and manage community health data in real-time</p>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6">
                <div className="bg-pink-600 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Cloud className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl text-gray-900 mb-2">Cloud Sync</h3>
                <p className="text-gray-700">Automatic synchronization ensures your data is always up to date</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <div className="bg-blue-600 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl text-gray-900 mb-2">Real-time Reporting</h3>
                <p className="text-gray-700">Submit reports instantly from the field for faster response times</p>
              </div>
            </div>

            {/* Mission Statement */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white my-8">
              <h2 className="text-2xl mb-4">Our Mission</h2>
              <p className="text-lg leading-relaxed">
                To empower Community Health Workers with modern digital tools that streamline their workflow, 
                improve data accuracy, and ultimately contribute to better health outcomes in communities across the region.
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={() => onNavigate('register')}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started with AlagaTrack
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
