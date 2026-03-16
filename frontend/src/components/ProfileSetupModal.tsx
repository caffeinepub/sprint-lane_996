import React, { useState } from "react";
import { useSetUserProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  onComplete: () => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  onComplete,
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const setProfile = useSetUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) return;

    try {
      await setProfile.mutateAsync({
        username: username.trim(),
        email: email.trim(),
      });
      onComplete();
    } catch {
      // Error handled by mutation hook
    }
  };

  const isValid = username.trim().length >= 3 && email.trim().includes("@");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <div className="w-12 h-12 bg-sprint-accent-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-sprint-accent-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-sprint-text-primary text-center mb-1">
          Set Up Your Profile
        </h2>
        <p className="text-sm text-sprint-text-secondary text-center mb-6">
          Choose a username and email so teammates can find and invite you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sprint-text-secondary mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. johndoe"
              autoFocus
              className="w-full px-3 py-2 text-sm bg-sprint-bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sprint-accent-500/30 placeholder:text-sprint-text-tertiary"
            />
            {username.trim().length > 0 && username.trim().length < 3 && (
              <p className="text-xs text-red-500 mt-1">
                Username must be at least 3 characters
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-sprint-text-secondary mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              className="w-full px-3 py-2 text-sm bg-sprint-bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sprint-accent-500/30 placeholder:text-sprint-text-tertiary"
            />
          </div>

          <button
            type="submit"
            disabled={!isValid || setProfile.isPending}
            className="w-full px-4 py-2.5 text-sm bg-sprint-accent-500 text-white rounded-lg hover:bg-sprint-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {setProfile.isPending ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};
