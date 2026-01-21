import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Music, PlusSquare } from "lucide-react";

import { PlayHistoryItemDto } from "../data/api";
import { InlineTagEditor } from "./InlineTagEditor";
import { formatDate } from "./PlayHistoryTable.helpers";
import { RatingSelector } from "./RatingSelector";

interface PlayHistoryTableRowProps {
  isAddingToLibrary: boolean;
  item: PlayHistoryItemDto;
  onAddToLibrary: (trackId: string, trackTitle: string) => void;
  onPlay: (trackTitle: string, spotifyId: string, trackId: string) => void;
  onRefresh: () => void;
}

export function PlayHistoryTableRow({
  isAddingToLibrary,
  item,
  onAddToLibrary,
  onPlay,
  onRefresh,
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
          <Box className="min-w-0">
            <Group gap="xs" wrap="nowrap">
              <Text className="font-medium text-dark-0" lineClamp={1} size="sm">
                {item.trackTitle}
              </Text>
              {!item.trackAddedToLibrary && (
                <Badge
                  className="shrink-0"
                  color="gray"
                  size="xs"
                  variant="dot"
                >
                  Not in library
                </Badge>
              )}
            </Group>
            <Text className="text-dark-2" lineClamp={1} size="xs">
              <Text
                className="cursor-pointer hover:underline hover:text-orange-5"
                component="span"
                inherit
                onClick={(e) => {
                  e.stopPropagation();
                  navigate({
                    params: { artist: item.trackArtist },
                    to: "/artists/$artist",
                  });
                }}
              >
                {item.trackArtist}
              </Text>
              {item.trackAlbum && (
                <>
                  {" — "}
                  <Text
                    className="cursor-pointer hover:underline hover:text-orange-5"
                    component="span"
                    inherit
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate({
                        params: {
                          album: item.trackAlbum!,
                          artist: item.trackArtist,
                        },
                        to: "/albums/$artist/$album",
                      });
                    }}
                  >
                    {item.trackAlbum}
                  </Text>
                </>
              )}
            </Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        {item.trackAddedToLibrary ? (
          <RatingSelector
            onRatingChange={onRefresh}
            rating={item.rating ?? null}
            size="sm"
            trackId={item.trackId}
          />
        ) : (
          <Text className="text-dark-3" size="xs">
            —
          </Text>
        )}
      </Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        {item.trackAddedToLibrary ? (
          <InlineTagEditor
            onTagsChange={onRefresh}
            trackId={item.trackId}
            trackTags={item.tags ?? []}
          />
        ) : (
          <Text className="text-dark-3" size="xs">
            —
          </Text>
        )}
      </Table.Td>
      <Table.Td className="whitespace-nowrap">
        <Text className="text-dark-2" size="xs">
          {formatDate(item.playedAt)}
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
