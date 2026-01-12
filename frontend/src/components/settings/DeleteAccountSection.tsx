import { Button, Card, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertTriangle, Trash2 } from "lucide-react";

import { customInstance } from "@/data/custom-instance";
import { resetUser } from "@/lib/posthog";

export function DeleteAccountSection() {
  const [opened, { close, open }] = useDisclosure(false);
  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onError: (error: AxiosError) => {
      notifications.show({
        color: "red",
        message: error.message || "Please try again",
        title: "Failed to delete account",
      });
      close();
    },
    onSuccess: () => {
      resetUser();
      window.location.href = "/";
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <>
      <Card
        className="bg-gradient-to-br from-red-950/30 to-dark-8 border-red-900/50"
        padding="lg"
        radius="md"
        shadow="md"
        withBorder
      >
        <Stack gap="md">
          <Group gap="xs">
            <Trash2 className="text-red-5" size={20} />
            <Text className="text-dark-0 font-semibold" size="lg">
              Delete Account
            </Text>
          </Group>

          <Text className="text-dark-2" size="sm">
            Permanently delete your account and all associated data. This action
            cannot be undone. All your library data, playlists, tags, and play
            history will be permanently removed.
          </Text>

          <Button color="red" leftSection={<Trash2 size={16} />} onClick={open}>
            Delete Account
          </Button>
        </Stack>
      </Card>

      <Modal
        centered
        onClose={close}
        opened={opened}
        title={
          <Group gap="xs">
            <AlertTriangle className="text-red-5" size={20} />
            <Text className="font-semibold">Confirm Account Deletion</Text>
          </Group>
        }
      >
        <Stack gap="md">
          <Text className="text-dark-2" size="sm">
            Are you sure you want to delete your account? This will permanently
            remove:
          </Text>

          <ul className="text-dark-2 text-sm list-disc list-inside space-y-1">
            <li>Your entire music library</li>
            <li>All smart playlists and tags</li>
            <li>Your complete play history</li>
            <li>All ratings and preferences</li>
          </ul>

          <Text className="text-red-4 font-medium" size="sm">
            This action cannot be undone.
          </Text>

          <Group className="mt-4" justify="flex-end">
            <Button onClick={close} variant="subtle">
              Cancel
            </Button>
            <Button
              color="red"
              loading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

function deleteAccount() {
  return customInstance<void>({ method: "DELETE", url: "/auth/account" });
}
