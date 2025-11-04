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
      <Card
        className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
        padding="lg"
        radius="md"
        shadow="md"
        withBorder
      >
        <Text className="text-dark-1">Loading profile...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
        padding="lg"
        radius="md"
        shadow="md"
        withBorder
      >
        <Text className="text-red-500">Error loading profile</Text>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const user = data as UserData;

  return (
    <Card
      className="max-w-md bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      <Stack gap="md">
        <Group>
          <Avatar
            className="bg-gradient-to-br from-orange-6 to-orange-8"
            radius="xl"
            size="lg"
            variant="filled"
          >
            <User size={24} />
          </Avatar>
          <div>
            <Text className="font-medium text-dark-0" size="lg">
              {user.name || "Anonymous User"}
            </Text>
            <Text className="text-dark-1" size="sm">
              {user.email}
            </Text>
          </div>
        </Group>

        <Group>
          <Badge
            color="orange"
            leftSection={<Calendar size={12} />}
            variant="light"
          >
            {user.provider.toUpperCase()}
          </Badge>
          <Text className="text-dark-1" size="xs">
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
          variant="light"
        >
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </Stack>
    </Card>
  );
}
