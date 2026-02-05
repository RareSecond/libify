import { Button } from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { useAuthControllerGetProfile } from "@/data/api";
import { trackSignupCompleted } from "@/lib/posthog";

export const Route = createFileRoute("/auth/success")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useAuthControllerGetProfile();
  const hasTrackedSignupRef = useRef(false);

  // Track signup completion once when authenticated
  useEffect(() => {
    if (!isLoading && profile && !hasTrackedSignupRef.current) {
      trackSignupCompleted();
      hasTrackedSignupRef.current = true;
    }
  }, [isLoading, profile]);

  useEffect(() => {
    if (isLoading || !profile) return;

    if (!profile.hasCompletedOnboarding) {
      // New user: redirect to insights (sync is triggered from insights page)
      navigate({ to: "/insights" });
    } else {
      // Returning user: auto-redirect to home after 2 seconds
      const timer = setTimeout(() => {
        navigate({ to: "/" });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [profile, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="text-2xl font-bold text-green-600">
        Successfully logged in with Spotify!
      </div>
      <p className="text-gray-600">
        {profile?.hasCompletedOnboarding
          ? "You will be redirected to the home page in a few seconds..."
          : "Setting up your library..."}
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
  );
}
