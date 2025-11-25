import {
  Accordion,
  ActionIcon,
  Button,
  Collapse,
  Group,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  Settings,
} from "lucide-react";

interface SyncIdleBarProps {
  isInitialized: boolean;
  isStarting: boolean;
  lastSyncedAt?: Date;
  onFullSync: () => void;
  onQuickSync: () => void;
  onSyncOptionsChange: (options: SyncOptions) => void;
  syncOptions: SyncOptions;
  totalAlbums: number;
  totalTracks: number;
}

interface SyncOptions {
  forceRefreshPlaylists: boolean;
  syncAlbums: boolean;
  syncLikedTracks: boolean;
  syncPlaylists: boolean;
}

export function SyncIdleBar({
  isInitialized,
  isStarting,
  lastSyncedAt,
  onFullSync,
  onQuickSync,
  onSyncOptionsChange,
  syncOptions,
  totalAlbums,
  totalTracks,
}: SyncIdleBarProps) {
  const [expanded, { toggle: toggleExpanded }] = useDisclosure(false);

  return (
    <div className="bg-dark-7 border border-dark-5 rounded-md">
      {/* Collapsed bar */}
      <div
        className="px-4 py-3 cursor-pointer hover:bg-dark-6 transition-colors rounded-md"
        onClick={toggleExpanded}
      >
        <Group justify="space-between">
          <Group gap="sm">
            <Clock className="text-dark-3" size={16} />
            <div>
              <Text className="text-dark-1" size="sm">
                {lastSyncedAt
                  ? `Last synced ${formatRelativeTime(lastSyncedAt)}`
                  : "Not synced yet"}
              </Text>
              <Text className="text-dark-3" size="xs">
                {totalTracks.toLocaleString()} tracks ·{" "}
                {totalAlbums.toLocaleString()} albums
              </Text>
            </div>
          </Group>
          <Group gap="xs">
            <ActionIcon
              color="orange"
              disabled={!isInitialized || isStarting}
              loading={isStarting}
              onClick={(e) => {
                e.stopPropagation();
                onQuickSync();
              }}
              size="sm"
              variant="subtle"
            >
              <RefreshCw size={14} />
            </ActionIcon>
            {expanded ? (
              <ChevronUp className="text-dark-2" size={18} />
            ) : (
              <ChevronDown className="text-dark-2" size={18} />
            )}
          </Group>
        </Group>
      </div>

      {/* Expanded options */}
      <Collapse in={expanded}>
        <div className="px-4 pb-4 border-t border-dark-6">
          <Stack className="pt-4" gap="md">
            {/* Sync Options */}
            <Accordion variant="contained">
              <Accordion.Item value="options">
                <Accordion.Control icon={<Settings size={16} />}>
                  Sync Options
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    <Text className="text-dark-2" size="sm">
                      Choose what to include in the full sync
                    </Text>

                    <Switch
                      checked={syncOptions.syncLikedTracks}
                      description="Include your liked/saved songs"
                      label="Sync Liked Tracks"
                      onChange={(event) =>
                        onSyncOptionsChange({
                          ...syncOptions,
                          syncLikedTracks: event.currentTarget.checked,
                        })
                      }
                    />

                    <Switch
                      checked={syncOptions.syncAlbums}
                      description="Include your saved albums"
                      label="Sync Albums"
                      onChange={(event) =>
                        onSyncOptionsChange({
                          ...syncOptions,
                          syncAlbums: event.currentTarget.checked,
                        })
                      }
                    />

                    <Switch
                      checked={syncOptions.syncPlaylists}
                      description="Include all your playlists"
                      label="Sync Playlists"
                      onChange={(event) =>
                        onSyncOptionsChange({
                          ...syncOptions,
                          syncPlaylists: event.currentTarget.checked,
                        })
                      }
                    />

                    <Switch
                      checked={syncOptions.forceRefreshPlaylists}
                      description="Re-sync all playlists even if unchanged"
                      disabled={!syncOptions.syncPlaylists}
                      label="Force Refresh Playlists"
                      onChange={(event) =>
                        onSyncOptionsChange({
                          ...syncOptions,
                          forceRefreshPlaylists: event.currentTarget.checked,
                        })
                      }
                    />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            {/* Sync Buttons */}
            <Group grow>
              <Button
                color="orange"
                disabled={!isInitialized || isStarting}
                gradient={{ deg: 135, from: "orange.6", to: "orange.8" }}
                leftSection={<RefreshCw size={16} />}
                loading={!isInitialized}
                onClick={onFullSync}
                variant="gradient"
              >
                Full Sync
              </Button>
              <Button
                color="orange"
                disabled={!isInitialized || isStarting}
                leftSection={<RefreshCw size={16} />}
                loading={isStarting}
                onClick={onQuickSync}
                variant="light"
              >
                Quick Sync
              </Button>
            </Group>

            <Text className="text-dark-3" size="xs">
              <strong>Full Sync:</strong> Sync entire library (tracks, albums,
              playlists) · <strong>Quick Sync:</strong> Sync recently played
              tracks only
            </Text>
          </Stack>
        </div>
      </Collapse>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
