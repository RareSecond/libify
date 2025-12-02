import {
  Avatar,
  Group,
  Menu,
  Skeleton,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Calendar, ChevronDown, LogOut, User } from "lucide-react";

import {
  useAuthControllerGetProfile,
  useAuthControllerLogout,
} from "@/data/api";
import { resetUser } from "@/lib/posthog";

export function HeaderUserMenu() {
  const { data, isLoading } = useAuthControllerGetProfile();
  const logoutMutation = useAuthControllerLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onError: (error) => {
        notifications.show({
          color: "red",
          message: error.message || "Please try again",
          title: "Failed to logout",
        });
      },
      onSuccess: () => {
        resetUser();
        window.location.href = "/";
      },
    });
  };

  if (isLoading) {
    return (
      <Group gap="xs">
        <Skeleton circle height={32} />
        <Skeleton height={12} width={80} />
      </Group>
    );
  }

  if (!data) {
    return null;
  }

  const user = data as {
    createdAt: string;
    email: string;
    name?: string;
    provider: string;
  };

  return (
    <Menu position="bottom-end" shadow="md" width={220}>
      <Menu.Target>
        <UnstyledButton className="rounded-full hover:bg-dark-6 transition-colors px-2 py-1">
          <Group gap="xs">
            <Avatar
              className="bg-gradient-to-br from-orange-6 to-orange-8"
              radius="xl"
              size="sm"
            >
              <User size={16} />
            </Avatar>
            <Text className="text-dark-0 hidden sm:block" size="sm">
              {user.name || "User"}
            </Text>
            <ChevronDown className="text-dark-2" size={14} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown className="bg-dark-7 border-dark-5">
        <Menu.Label className="text-dark-2">Account</Menu.Label>
        <div className="px-3 py-2">
          <Text className="text-dark-0 font-medium" size="sm">
            {user.name || "Anonymous User"}
          </Text>
          <Text className="text-dark-2" size="xs">
            {user.email}
          </Text>
        </div>

        <Menu.Divider className="border-dark-5" />

        <Menu.Item
          className="text-dark-1"
          disabled
          leftSection={<Calendar size={14} />}
        >
          <Text size="xs">
            {user.provider.toUpperCase()} · Joined{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </Menu.Item>

        <Menu.Divider className="border-dark-5" />

        <Menu.Item
          className="text-red-400 hover:bg-red-900/20"
          leftSection={<LogOut size={14} />}
          onClick={handleLogout}
        >
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
