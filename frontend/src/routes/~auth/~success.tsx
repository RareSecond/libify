import { Button } from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { OnboardingSyncModal } from "@/components/OnboardingSyncModal";
import { useAuthControllerGetProfile } from "@/data/api";

export const Route = createFileRoute("/auth/success")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useAuthControllerGetProfile();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (profile && !profile.hasCompletedOnboarding) {
      // Show onboarding modal for first-time users
      setShowOnboardingModal(true);
    } else {
      // Auto-redirect to home after 2 seconds for returning users
      const timer = setTimeout(() => {
        navigate({ to: "/" });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [profile, isLoading, navigate]);

  const handleCloseOnboarding = () => {
    setShowOnboardingModal(false);
    // Navigate to tracks page when modal is closed
    navigate({ search: { genres: [] }, to: "/tracks" });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-2xl font-bold text-green-600">
          Successfully logged in with Spotify!
        </div>
        <p className="text-gray-600">
          {profile?.hasCompletedOnboarding
            ? "You will be redirected to the home page in a few seconds..."
            : "Setting up your experience..."}
        </p>
        {profile?.hasCompletedOnboarding && (
          <Button
            className="bg-green-500 hover:bg-green-600"
            color="green"
            onClick={() => navigate({ to: "/" })}
            size="lg"
          >
            Go to Home
          </Button>
        )}
      </div>

      <OnboardingSyncModal
        isOpen={showOnboardingModal}
        onClose={handleCloseOnboarding}
      />
    </>
  );
}
