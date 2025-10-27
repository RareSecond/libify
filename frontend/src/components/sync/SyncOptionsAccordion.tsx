import { Accordion, Stack, Switch, Text } from "@mantine/core";
import { Settings } from "lucide-react";

interface SyncOptions {
  forceRefreshPlaylists: boolean;
  syncAlbums: boolean;
  syncLikedTracks: boolean;
  syncPlaylists: boolean;
}

interface SyncOptionsAccordionProps {
  onChange: (options: SyncOptions) => void;
  options: SyncOptions;
}

export function SyncOptionsAccordion({
  onChange,
  options,
}: SyncOptionsAccordionProps) {
  return (
    <Accordion variant="contained">
      <Accordion.Item value="options">
        <Accordion.Control icon={<Settings size={16} />}>
          Sync Options
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="md">
            <Text color="dimmed" size="sm">
              Choose what to include in the full sync
            </Text>

            <Switch
              checked={options.syncLikedTracks}
              description="Include your liked/saved songs"
              label="Sync Liked Tracks"
              onChange={(event) =>
                onChange({
                  ...options,
                  syncLikedTracks: event.currentTarget.checked,
                })
              }
            />

            <Switch
              checked={options.syncAlbums}
              description="Include your saved albums"
              label="Sync Albums"
              onChange={(event) =>
                onChange({
                  ...options,
                  syncAlbums: event.currentTarget.checked,
                })
              }
            />

            <Switch
              checked={options.syncPlaylists}
              description="Include all your playlists"
              label="Sync Playlists"
              onChange={(event) =>
                onChange({
                  ...options,
                  syncPlaylists: event.currentTarget.checked,
                })
              }
            />

            <Switch
              checked={options.forceRefreshPlaylists}
              description="Re-sync all playlists even if unchanged"
              disabled={!options.syncPlaylists}
              label="Force Refresh Playlists"
              onChange={(event) =>
                onChange({
                  ...options,
                  forceRefreshPlaylists: event.currentTarget.checked,
                })
              }
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
