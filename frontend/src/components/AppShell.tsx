import { AppShell, Burger, Group, NavLink, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useLocation } from "@tanstack/react-router";
import { Disc, History, Home, Library, ListMusic, User } from "lucide-react";
import { ReactNode } from "react";

interface AppShellLayoutProps {
  children: ReactNode;
}

export function AppShellLayout({ children }: AppShellLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", to: "/" },
    { icon: Library, label: "My Library", to: "/tracks" },
    { icon: Disc, label: "Albums", to: "/albums" },
    { icon: User, label: "Artists", to: "/artists" },
    { icon: ListMusic, label: "Smart Playlists", to: "/playlists" },
    { icon: History, label: "Play History", to: "/play-history" },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ breakpoint: "sm", collapsed: { mobile: !opened }, width: 300 }}
      padding="md"
    >
      <AppShell.Header className="border-b border-dark-5 bg-gradient-to-r from-dark-8 via-dark-7 to-dark-8">
        <Group className="h-full px-4">
          <Burger
            color="var(--color-orange-5)"
            hiddenFrom="sm"
            onClick={toggle}
            opened={opened}
            size="sm"
          />
          <Text
            className="font-bold bg-gradient-to-r from-orange-4 to-orange-6 bg-clip-text text-transparent"
            size="xl"
          >
            Spotlib
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="p-4 border-r border-dark-5 bg-dark-8">
        {navItems.map((item) => {
          // Check both with and without trailing slash
          const isActive =
            location.pathname === item.to ||
            location.pathname === `${item.to}/` ||
            (item.to !== "/" && location.pathname.startsWith(`${item.to}/`));

          // Temporary debug for playlists
          if (item.to === "/playlists") {
            // eslint-disable-next-line no-console
            console.log("Playlists nav check:", {
              isActive,
              locationPath: location.pathname,
              targetPath: item.to,
            });
          }

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

      <AppShell.Main className="pb-[200px] bg-gradient-to-br from-dark-9 via-dark-8 to-dark-9">
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
