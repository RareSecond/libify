import { Button, Center, Loader, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";

import { AppShellLayout } from "../components/AppShell";
import { MediaPlayer } from "../components/MediaPlayer";
import { SpotifyPlayerProvider } from "../contexts/SpotifyPlayerContext";
import { useAuthControllerGetProfile } from "../data/api";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: RootComponent,
});

function AuthWrapper() {
  const {
    data: profile,
    error,
    isLoading,
  } = useAuthControllerGetProfile({
    query: {
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  });

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Not authenticated - show login page
  if (error || !profile) {
    return (
      <Center h="100vh">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Spotlib</h1>
          <p className="text-gray-600 mb-8">
            Login with Spotify to access your music library
          </p>
          <Button
            color="green"
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_API_URL}/auth/spotify`;
            }}
            size="lg"
          >
            Login with Spotify
          </Button>
        </div>
      </Center>
    );
  }

  // Authenticated - show app with navigation
  return (
    <SpotifyPlayerProvider>
      <AppShellLayout>
        <Outlet />
        <MediaPlayer />
      </AppShellLayout>
    </SpotifyPlayerProvider>
  );
}

function RootComponent() {
  return (
    <MantineProvider>
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <AuthWrapper />
      </QueryClientProvider>
    </MantineProvider>
  );
}
