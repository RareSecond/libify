import { Avatar, Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Calendar, LogOut, User } from "lucide-react";

import {
  useAuthControllerGetProfile,
  useAuthControllerLogout,
} from "@/data/api";

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
  const logoutMutation = useAuthControllerLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onError: (error) => {
        // Show error notification without redirecting
        notifications.show({
          color: "red",
          message: error.message || "Please try again",
          title: "Failed to logout",
        });
      },
      onSuccess: () => {
        // Only redirect on successful logout
        window.location.href = "/";
      },
    });
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
            <Text className="font-medium" size="lg">
              {user.name || "Anonymous User"}
            </Text>
            <Text color="dimmed" size="sm">
              {user.email}
            </Text>
          </div>
        </Group>

        <Group>
          <Badge
            color={user.provider === "spotify" ? "green" : "blue"}
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
          disabled={logoutMutation.isPending}
          fullWidth
          leftSection={<LogOut size={16} />}
          loading={logoutMutation.isPending}
          onClick={handleLogout}
          variant="outline"
        >
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </Stack>
    </Card>
  );
}
