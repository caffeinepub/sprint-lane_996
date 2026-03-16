import React from "react";
import { Check, Clock, Calendar, Users } from "lucide-react";

interface LandingPageProps {
  onLogin: () => void;
  isLoggingIn: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLogin,
  isLoggingIn,
}) => {
  return (
    <div className="min-h-screen bg-[#E8E8E8] relative overflow-hidden animate-fade-in">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-2 h-2 bg-sprint-text-primary rounded-sm"></div>
              <div className="w-2 h-2 bg-sprint-text-primary rounded-sm"></div>
              <div className="w-2 h-2 bg-sprint-text-primary rounded-sm"></div>
              <div className="w-2 h-2 bg-sprint-text-primary rounded-sm"></div>
            </div>
          </div>
          <span className="font-semibold text-sprint-text-primary text-lg">
            SprintLane
          </span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative max-w-7xl mx-auto px-6 pt-16 pb-32">
        {/* Floating Decorative Elements */}

        {/* Sticky Note - Top Left */}
        <div className="absolute left-4 top-8 lg:left-12 lg:top-16 animate-float z-10">
          <div className="relative">
            {/* Pin */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-md z-10"></div>
            {/* Note */}
            <div className="w-40 bg-yellow-200 p-4 shadow-float rounded-sm -rotate-6">
              <p className="text-xs text-yellow-900 font-handwriting italic leading-relaxed">
                Capture important ideas and stay on top of your workflow
                effortlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Checkmark Badge - Left */}
        <div className="absolute left-8 top-64 lg:left-24 lg:top-72 animate-float-delayed z-10">
          <div className="w-12 h-12 bg-sprint-accent-500 rounded-xl shadow-float flex items-center justify-center rotate-12">
            <Check className="w-6 h-6 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Today's Tasks Card - Bottom Left */}
        <div className="absolute left-4 bottom-16 lg:left-8 lg:bottom-24 animate-float z-10 hidden sm:block">
          <div className="w-56 bg-white rounded-xl shadow-float p-4">
            <h4 className="font-semibold text-sprint-text-primary text-sm mb-3">
              Active Tasks
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-xs">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-xs text-sprint-text-primary">
                    Campaign brainstorming
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-sprint-text-tertiary">
                      Sep 10
                    </span>
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="w-3/5 h-full bg-orange-400 rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-sprint-text-tertiary">
                      60%
                    </span>
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full bg-green-400 border border-white"></div>
                      <div className="w-4 h-4 rounded-full bg-blue-400 border border-white"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center text-xs">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-xs text-sprint-text-primary">
                    Presentation deck v4
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-sprint-text-tertiary">
                      Sep 18
                    </span>
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-green-400 rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-sprint-text-tertiary">
                      112%
                    </span>
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full bg-purple-400 border border-white"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reminders Card - Top Right */}
        <div className="absolute right-4 top-8 lg:right-12 lg:top-12 animate-float z-10 hidden sm:block">
          <div className="w-48 bg-white rounded-xl shadow-float p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sprint-text-primary text-sm">
                Upcoming
              </h4>
              <span className="text-[10px] text-sprint-text-tertiary px-2 py-0.5 bg-gray-100 rounded">
                Sessions
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-sprint-text-tertiary mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-sprint-text-primary">
                    Team Sync
                  </p>
                  <p className="text-[10px] text-sprint-text-tertiary">
                    Marketing department check-in
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-sprint-accent-500">
                <Clock className="w-3 h-3" />
                <span>13:00 - 13:45</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clock Badge - Right */}
        <div className="absolute right-8 top-56 lg:right-24 lg:top-64 animate-float-delayed z-10">
          <div className="w-14 h-14 bg-white rounded-xl shadow-float flex items-center justify-center">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-gray-300 rounded-full flex items-center justify-center">
                <div className="w-0.5 h-3 bg-red-500 absolute origin-bottom -translate-y-1 rotate-45"></div>
                <div className="w-0.5 h-2 bg-gray-800 absolute origin-bottom -translate-y-0.5"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Collaboration Card - Bottom Right */}
        <div className="absolute right-4 bottom-16 lg:right-8 lg:bottom-24 animate-float z-10 hidden sm:block">
          <div className="w-48 bg-white rounded-xl shadow-float p-4">
            <h4 className="font-semibold text-sprint-text-primary text-sm mb-3">
              Team Workspace
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                  AB
                </div>
                <div className="w-8 h-8 rounded-full bg-green-400 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                  CD
                </div>
                <div className="w-8 h-8 rounded-full bg-purple-400 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                  EF
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-sprint-text-primary font-medium">
                  Share and work together
                </p>
                <p className="text-[10px] text-sprint-text-tertiary">
                  Delegate tasks to teammates
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="text-center pt-20 pb-8 relative z-20">
          {/* App Icon */}
          <div className="inline-flex mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <div className="grid grid-cols-2 gap-1">
                <div className="w-4 h-4 bg-sprint-text-primary rounded-md"></div>
                <div className="w-4 h-4 bg-sprint-text-primary rounded-md"></div>
                <div className="w-4 h-4 bg-sprint-text-primary rounded-md"></div>
                <div className="w-4 h-4 bg-sprint-text-primary rounded-md"></div>
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-sprint-text-primary mb-2">
            Organize, execute, deliver
          </h1>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-sprint-accent-500 mb-6">
            seamlessly
          </h2>

          {/* Description */}
          <p className="text-sprint-text-secondary text-lg max-w-md mx-auto mb-10">
            Streamline your workflow and accomplish more every day.
          </p>

          {/* CTA Button */}
          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="px-8 py-4 bg-sprint-accent-500 hover:bg-sprint-accent-600 text-white rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in with Internet Identity"
            )}
          </button>
        </div>
      </main>

      {/* Powered by ICP Badge - Fixed bottom right */}
      <div className="fixed bottom-6 right-6 z-30">
        <div className="bg-white rounded-lg shadow-md px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-sprint-text-tertiary">Powered by</span>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded rotate-45"></div>
            <span className="text-xs font-semibold text-sprint-text-primary">
              ICP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
