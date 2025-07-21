import { Avatar, Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { Calendar, LogOut, User } from "lucide-react";

import { useAuthControllerGetProfile } from "@/data/api";

interface UserData {
  createdAt: string;
  email: string;
  id: number;
  name?: string;
  provider: string;
  updatedAt: string;
}

export function UserProfile() {
  const { data, error, isLoading } = useAuthControllerGetProfile();

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        credentials: 'include',
        method: 'POST',
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <Card padding="lg" radius="md" shadow="sm" withBorder>
        <Text>Loading profile...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="lg" radius="md" shadow="sm" withBorder>
        <Text color="red">Error loading profile</Text>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const user = data as UserData;

  return (
    <Card className="max-w-md" padding="lg" radius="md" shadow="sm" withBorder>
      <Stack gap="md">
        <Group>
          <Avatar color="blue" radius="xl" size="lg">
            <User size={24} />
          </Avatar>
          <div>
            <Text fw={500} size="lg">
              {user.name || "Anonymous User"}
            </Text>
            <Text color="dimmed" size="sm">
              {user.email}
            </Text>
          </div>
        </Group>

        <Group>
          <Badge
            color={user.provider === 'spotify' ? 'green' : 'blue'}
            leftSection={<Calendar size={12} />}
            variant="light"
          >
            {user.provider.toUpperCase()}
          </Badge>
          <Text color="dimmed" size="xs">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </Group>

        <Button
          color="red"
          fullWidth
          leftSection={<LogOut size={16} />}
          onClick={handleLogout}
          variant="outline"
        >
          Logout
        </Button>
      </Stack>
    </Card>
  );
}