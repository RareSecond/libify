import { Button } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { UserProfile } from "@/components/UserProfile";
import {
  useAppControllerGetHello,
  useAuthControllerGetProfile,
} from "@/data/api";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading } = useAppControllerGetHello();
  const {
    data: profile,
    error: profileError,
    isLoading: isProfileLoading,
  } = useAuthControllerGetProfile({ query: { retry: false } });

  const handleSpotifyLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/spotify`;
  };

  if (isLoading || isProfileLoading) {
    return <div>Loading...</div>;
  }

  // Show user profile if logged in
  if (profile && !profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-2xl font-bold">{data}</div>
        <UserProfile />
      </div>
    );
  }

  // Show login button if not logged in
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="text-2xl font-bold">{data}</div>
      <Button
        className="bg-green-500 hover:bg-green-600"
        color="green"
        onClick={handleSpotifyLogin}
        size="lg"
      >
        Login with Spotify
      </Button>
    </div>
  );
}
