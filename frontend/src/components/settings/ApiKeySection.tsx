import {
  ActionIcon,
  Alert,
  Button,
  Card,
  CopyButton,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { Check, Copy, Eye, EyeOff, Key, Monitor } from "lucide-react";
import { useState } from "react";

import { useApiKey } from "@/hooks/useApiKey";

export function ApiKeySection() {
  const { data, error, isLoading } = useApiKey();
  const [isVisible, setIsVisible] = useState(false);

  const maskedKey = data?.apiKey
    ? `${data.apiKey.slice(0, 6)}${"•".repeat(20)}${data.apiKey.slice(-6)}`
    : "";

  return (
    <Card
      className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      <Stack gap="md">
        <Group gap="xs">
          <Key className="text-orange-5" size={20} />
          <Text className="text-dark-0 font-semibold" size="lg">
            API Key
          </Text>
        </Group>

        <Text className="text-dark-2" size="sm">
          Use this key to connect external apps like the Spotlib Desktop
          Companion. Your API key is unique to your account and should be kept
          private.
        </Text>

        {error && (
          <Alert color="red" variant="light">
            Failed to load API key. Please try again.
          </Alert>
        )}

        {isLoading ? (
          <Skeleton height={36} radius="md" />
        ) : (
          data?.apiKey && (
            <Group gap="xs">
              <TextInput
                className="flex-1 font-mono"
                readOnly
                styles={{
                  input: {
                    backgroundColor: "var(--mantine-color-dark-6)",
                    fontFamily: "monospace",
                  },
                }}
                value={isVisible ? data.apiKey : maskedKey}
              />
              <Tooltip label={isVisible ? "Hide" : "Show"}>
                <ActionIcon
                  color="gray"
                  onClick={() => setIsVisible(!isVisible)}
                  size="lg"
                  variant="subtle"
                >
                  {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </ActionIcon>
              </Tooltip>
              <CopyButton timeout={2000} value={data.apiKey}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? "Copied!" : "Copy"}>
                    <ActionIcon
                      color={copied ? "teal" : "orange"}
                      onClick={copy}
                      size="lg"
                      variant={copied ? "filled" : "subtle"}
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          )
        )}

        <Alert
          className="mt-2"
          color="blue"
          icon={<Monitor size={18} />}
          variant="light"
        >
          <Text size="sm">
            <strong>Desktop Companion App</strong>
            <br />
            Rate tracks with global hotkeys without leaving your current app.
            Copy your API key above and paste it into the companion app to get
            started.
          </Text>
          <Button
            className="mt-3"
            color="blue"
            component="a"
            disabled
            size="xs"
            variant="light"
          >
            Coming Soon
          </Button>
        </Alert>
      </Stack>
    </Card>
  );
}
