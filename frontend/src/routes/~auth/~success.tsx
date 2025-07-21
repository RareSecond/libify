import { Button } from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/success")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to home after 3 seconds
    const timer = setTimeout(() => {
      navigate({ to: "/" });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="text-2xl font-bold text-green-600">
        Successfully logged in with Spotify!
      </div>
      <p className="text-gray-600">
        You will be redirected to the home page in a few seconds...
      </p>
      <Button
        className="bg-green-500 hover:bg-green-600"
        color="green"
        onClick={() => navigate({ to: "/" })}
        size="lg"
      >
        Go to Home
      </Button>
    </div>
  );
}