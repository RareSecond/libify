import { AppShell, Burger, Group, NavLink, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useLocation } from "@tanstack/react-router";
import { Disc, Home, Library, ListMusic, User } from "lucide-react";
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
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ breakpoint: "sm", collapsed: { mobile: !opened }, width: 300 }}
      padding="md"
    >
      <AppShell.Header>
        <Group className="h-full px-4">
          <Burger hiddenFrom="sm" onClick={toggle} opened={opened} size="sm" />
          <Text className="font-bold" size="xl">
            Spotlib
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="p-4">
        {navItems.map((item) => (
          <NavLink
            active={location.pathname === item.to}
            className="mb-2"
            component={Link}
            key={item.to}
            label={item.label}
            leftSection={<item.icon size={20} />}
            to={item.to}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main className="pb-[120px]">{children}</AppShell.Main>
    </AppShell>
  );
}
