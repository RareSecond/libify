import {
  ActionIcon,
  Avatar,
  Badge,
  Group,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Music, PlusSquare } from "lucide-react";

import { PlayHistoryItemDto } from "../data/api";
import { formatDate, formatDuration } from "./PlayHistoryTable.helpers";

interface PlayHistoryTableRowProps {
  isAddingToLibrary: boolean;
  item: PlayHistoryItemDto;
  onAddToLibrary: (trackId: string, trackTitle: string) => void;
  onPlay: (trackTitle: string, spotifyId: string, trackId: string) => void;
}

export function PlayHistoryTableRow({
  isAddingToLibrary,
  item,
  onAddToLibrary,
  onPlay,
}: PlayHistoryTableRowProps) {
  const navigate = useNavigate();

  return (
    <Table.Tr
      className="cursor-pointer hover:bg-dark-6 transition-colors"
      key={item.id}
      onClick={() => onPlay(item.trackTitle, item.trackSpotifyId, item.trackId)}
    >
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          {item.trackAlbumArt ? (
            <Avatar radius="sm" size="md" src={item.trackAlbumArt} />
          ) : (
            <Avatar
              className="bg-gradient-to-br from-orange-6 to-orange-8"
              radius="sm"
              size="md"
              variant="filled"
            >
              <Music size={20} />
            </Avatar>
          )}
          <Stack gap={2}>
            <Text className="font-medium text-dark-0" lineClamp={1} size="sm">
              {item.trackTitle}
            </Text>
            {!item.trackAddedToLibrary && (
              <Badge color="gray" size="xs" variant="dot">
                Not in library
              </Badge>
            )}
          </Stack>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text
          className="text-dark-1 cursor-pointer hover:underline hover:text-orange-5"
          lineClamp={1}
          onClick={(e) => {
            e.stopPropagation();
            navigate({
              params: { artist: item.trackArtist },
              to: "/artists/$artist",
            });
          }}
          size="sm"
        >
          {item.trackArtist}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text
          className="text-dark-1 cursor-pointer hover:underline hover:text-orange-5"
          lineClamp={1}
          onClick={(e) => {
            e.stopPropagation();
            if (item.trackAlbum) {
              navigate({
                params: { album: item.trackAlbum, artist: item.trackArtist },
                to: "/albums/$artist/$album",
              });
            }
          }}
          size="sm"
        >
          {item.trackAlbum || "-"}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge color="orange" size="sm" variant="dot">
          {formatDate(item.playedAt)}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text className="text-dark-1" size="sm">
          {formatDuration(item.trackDuration)}
        </Text>
      </Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        {!item.trackAddedToLibrary && (
          <Tooltip label="Add to library">
            <ActionIcon
              color="orange"
              loading={isAddingToLibrary}
              onClick={() => onAddToLibrary(item.trackId, item.trackTitle)}
              size="sm"
              variant="subtle"
            >
              <PlusSquare size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
