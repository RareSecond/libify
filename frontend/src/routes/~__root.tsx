import { Center, createTheme, Loader, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShellLayout } from "../components/AppShell";
import { MediaPlayer } from "../components/MediaPlayer";
import { SpotifyPlayerProvider } from "../contexts/SpotifyPlayerContext";
import { useAuthControllerGetProfile } from "../data/api";

const queryClient = new QueryClient();

// Custom dark theme with orange as primary color
const theme = createTheme({
  colors: {
    dark: [
      "#C1C2C5", // 0 - lightest text
      "#A6A7AB", // 1 - light text
      "#909296", // 2 - muted text
      "#5c5f66", // 3 - disabled text
      "#373A40", // 4 - border
      "#2C2E33", // 5 - hover bg
      "#25262b", // 6 - default bg
      "#1A1B1E", // 7 - app bg
      "#141517", // 8 - darker bg
      "#101113", // 9 - darkest bg
    ],
    orange: [
      "#fff4e6", // 0 - lightest
      "#ffe8cc", // 1
      "#ffd8a8", // 2
      "#ffc078", // 3
      "#ffa94d", // 4
      "#ff922b", // 5
      "#fd7e14", // 6 - primary shade
      "#f76707", // 7
      "#e8590c", // 8
      "#d9480f", // 9 - darkest
    ],
  },
  defaultGradient: { deg: 135, from: "orange.6", to: "orange.8" },
  defaultRadius: "md",
  fontFamily: "system-ui, -apple-system, sans-serif",
  headings: { fontWeight: "700" },
  primaryColor: "orange",
  primaryShade: 6,
});

export const Route = createRootRoute({ component: RootComponent });

function AuthWrapper() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

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

  // Handle authentication-based redirects
  useEffect(() => {
    if (isLoading) return;

    const isAuthenticated = !error && !!profile;
    const isWelcomePage = currentPath === "/welcome";

    // Redirect unauthenticated users to welcome page
    if (!isAuthenticated && !isWelcomePage) {
      navigate({ to: "/welcome" });
    }

    // Redirect authenticated users away from welcome page to dashboard
    if (isAuthenticated && isWelcomePage) {
      navigate({ to: "/" });
    }
  }, [isLoading, error, profile, currentPath, navigate]);

  if (isLoading) {
    return (
      <Center className="h-screen">
        <Loader size="lg" />
      </Center>
    );
  }

  // Not authenticated - show welcome page
  if (error || !profile) {
    return <Outlet />;
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
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <AuthWrapper />
      </QueryClientProvider>
    </MantineProvider>
  );
}
