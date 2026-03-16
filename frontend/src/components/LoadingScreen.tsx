import React from "react";

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-sprint-bg-primary flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="inline-flex mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-pulse">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-4 h-4 bg-sprint-text-primary rounded-md"></div>
              <div className="w-4 h-4 bg-sprint-text-primary rounded-md"></div>
              <div className="w-4 h-4 bg-sprint-text-primary rounded-md"></div>
              <div className="w-4 h-4 bg-sprint-text-primary rounded-md"></div>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-1 mb-4">
          <div
            className="w-2 h-2 bg-sprint-accent-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-sprint-accent-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-sprint-accent-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>

        {/* Text */}
        <p className="text-sprint-text-secondary text-sm">
          Please wait a moment...
        </p>
      </div>
    </div>
  );
};
