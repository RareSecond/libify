import { AppShell, Burger, Group, NavLink } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  Disc,
  Filter,
  History,
  Home,
  Library,
  ListMusic,
  User,
} from "lucide-react";
import { ReactNode, useEffect } from "react";

import { HeaderUserMenu } from "./HeaderUserMenu";

interface AppShellLayoutProps {
  children: ReactNode;
}

export function AppShellLayout({ children }: AppShellLayoutProps) {
  const [opened, { close, toggle }] = useDisclosure();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", to: "/" },
    { icon: BarChart3, label: "Insights", to: "/insights" },
    { icon: Library, label: "My Library", to: "/tracks" },
    { icon: Disc, label: "Albums", to: "/albums" },
    { icon: User, label: "Artists", to: "/artists" },
    { icon: ListMusic, label: "Playlists", to: "/playlists" },
    { icon: Filter, label: "Smart Playlists", to: "/smart-playlists" },
    { icon: History, label: "Play History", to: "/play-history" },
  ];

  // Close drawer on navigation
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ breakpoint: "sm", collapsed: { mobile: !opened }, width: 300 }}
      padding="md"
    >
      <AppShell.Header className="border-b border-dark-5 bg-gradient-to-r from-dark-8 via-dark-7 to-dark-8">
        <Group className="h-full px-4" justify="space-between">
          <Group>
            <Burger
              color="var(--color-orange-5)"
              hiddenFrom="sm"
              onClick={toggle}
              opened={opened}
              size="sm"
            />
            <img alt="Codex.fm" className="h-8" src="/logo.png" />
          </Group>
          <HeaderUserMenu />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="p-4 border-r border-dark-5 bg-dark-8">
        {navItems.map((item) => {
          // Check both with and without trailing slash
          const isActive =
            location.pathname === item.to ||
            location.pathname === `${item.to}/` ||
            (item.to !== "/" && location.pathname.startsWith(`${item.to}/`));

          return (
            <NavLink
              active={isActive}
              className="mb-2 rounded-md hover:bg-dark-6 transition-colors"
              color="orange"
              component={Link}
              key={item.to}
              label={item.label}
              leftSection={<item.icon size={20} />}
              to={item.to}
              variant="subtle"
            />
          );
        })}
      </AppShell.Navbar>

      <AppShell.Main className="pb-[140px] md:pb-[180px] bg-gradient-to-br from-dark-9 via-dark-8 to-dark-9">
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
