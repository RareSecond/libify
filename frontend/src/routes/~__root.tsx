import { Center, createTheme, Loader, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef } from "react";

import { AppShellLayout } from "../components/AppShell";
import { MediaPlayer } from "../components/MediaPlayer";
import { SpotifyPlayerProvider } from "../contexts/SpotifyPlayerContext";
import {
  AuthControllerGetProfileQueryResult,
  useAuthControllerGetProfile,
} from "../data/api";
import { identifyUser, trackPageView } from "../lib/posthog";

// Route path constants
const ROUTES = {
  AUTH_ERROR: "/auth/error",
  FULLSCREEN: "/fullscreen",
  HOME: "/",
  WELCOME: "/welcome",
} as const;

// Auth query configuration
const AUTH_QUERY_CONFIG = {
  retry: false,
  staleTime: 5 * 60 * 1000, // 5 minutes
} as const;

const queryClient = new QueryClient();

// Auth context to share auth state with child routes
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: AuthControllerGetProfileQueryResult | null;
}

// Reusable full-screen loading spinner
function FullScreenLoader() {
  return (
    <Center className="h-screen">
      <Loader size="lg" />
    </Center>
  );
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  profile: null,
});

export const useAuth = () => useContext(AuthContext);

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
  const identifiedUserRef = useRef<null | number>(null);

  const {
    data: profile,
    error,
    isLoading,
  } = useAuthControllerGetProfile({ query: AUTH_QUERY_CONFIG });

  const isAuthenticated = !error && !!profile;
  const isPublicPage =
    currentPath === ROUTES.WELCOME || currentPath === ROUTES.AUTH_ERROR;

  // Track page views on route changes
  useEffect(() => {
    trackPageView(currentPath);
  }, [currentPath]);

  // Identify user in PostHog once authenticated
  useEffect(() => {
    if (profile && identifiedUserRef.current !== profile.id) {
      identifyUser(String(profile.id), {
        email: profile.email,
        name: profile.name,
      });
      identifiedUserRef.current = profile.id;
    }
  }, [profile]);

  // Redirect unauthenticated users to welcome page
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage) {
      navigate({ to: ROUTES.WELCOME });
    }
  }, [isLoading, isAuthenticated, isPublicPage, navigate]);

  // Show loading spinner while auth is being determined
  if (isLoading) {
    return <FullScreenLoader />;
  }

  // Provide auth context to all routes
  const authContextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    profile: profile ?? null,
  };

  // Public pages (welcome, auth error) - render without SpotifyPlayerProvider
  if (isPublicPage) {
    return (
      <AuthContext.Provider value={authContextValue}>
        <Outlet />
      </AuthContext.Provider>
    );
  }

  // Not authenticated and not on welcome page - show loading while redirect happens
  if (!isAuthenticated) {
    return <FullScreenLoader />;
  }

  // Authenticated - show app with navigation and SpotifyPlayerProvider
  const isFullscreenMode = currentPath === ROUTES.FULLSCREEN;

  return (
    <AuthContext.Provider value={authContextValue}>
      <SpotifyPlayerProvider>
        {isFullscreenMode ? (
          <div className="min-h-screen bg-dark-7">
            <Outlet />
            <MediaPlayer />
          </div>
        ) : (
          <AppShellLayout>
            <Outlet />
            <MediaPlayer />
          </AppShellLayout>
        )}
      </SpotifyPlayerProvider>
    </AuthContext.Provider>
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
