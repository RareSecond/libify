import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  Disc,
  Edit,
  ExternalLink,
  Filter,
  Hash,
  ListMusic,
  Mic2,
  Music,
  Play,
  Star,
  Tag,
  Trash,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { PlaylistRuleDto, SmartPlaylistWithTracksDto } from "../../data/api";

const FIELD_CONFIG: Record<
  string,
  { color: string; icon: typeof Music; label: string }
> = {
  album: { color: "violet", icon: Disc, label: "Album" },
  artist: { color: "cyan", icon: Mic2, label: "Artist" },
  dateAdded: { color: "teal", icon: Calendar, label: "Date Added" },
  duration: { color: "indigo", icon: Clock, label: "Duration" },
  lastPlayed: { color: "grape", icon: Play, label: "Last Played" },
  playCount: { color: "pink", icon: Hash, label: "Play Count" },
  rating: { color: "yellow", icon: Star, label: "Rating" },
  tag: { color: "lime", icon: Tag, label: "Tag" },
  title: { color: "blue", icon: Music, label: "Title" },
};

const OPERATOR_LABELS: Record<string, string> = {
  contains: "contains",
  endsWith: "ends with",
  equals: "is",
  greaterThan: ">",
  hasAnyTag: "has any tag",
  hasNoTags: "has no tags",
  hasTag: "has tag",
  inLast: "in last",
  isNotNull: "exists",
  isNull: "is empty",
  lessThan: "<",
  notContains: "doesn't contain",
  notEquals: "is not",
  notHasTag: "doesn't have tag",
  notInLast: "not in last",
  startsWith: "starts with",
};

interface SmartPlaylistCardProps {
  onDelete: () => void;
  onEdit: () => void;
  playlist: SmartPlaylistWithTracksDto;
}

export function SmartPlaylistCard({
  onDelete,
  onEdit,
  playlist,
}: SmartPlaylistCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isSynced = Boolean(playlist.spotifyPlaylistId);

  return (
    <Card
      className="h-full cursor-pointer bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5 hover:border-orange-5/50 hover:shadow-xl hover:shadow-orange-9/20 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-10">
        <Zap size={140} />
      </div>

      <Stack className="relative z-10" gap="md">
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-6 to-orange-8">
              <ListMusic className="text-white" size={20} />
            </div>
            <div className="min-w-0">
              <Text
                className="font-bold text-dark-0 group-hover:text-orange-5 transition-colors truncate"
                size="lg"
              >
                {playlist.name}
              </Text>
              {playlist.description && (
                <Text className="text-dark-2 truncate" lineClamp={1} size="xs">
                  {playlist.description}
                </Text>
              )}
            </div>
          </Group>
          <Group
            className={`transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}
            gap={4}
          >
            <Tooltip label="Edit playlist">
              <ActionIcon
                className="hover:bg-dark-5"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                size="sm"
                variant="subtle"
              >
                <Edit size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete playlist">
              <ActionIcon
                className="hover:bg-red-9/30"
                color="red"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                size="sm"
                variant="subtle"
              >
                <Trash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Rules Preview */}
        <Box>
          <Group className="mb-2" gap="xs">
            <Filter className="text-dark-2" size={12} />
            <Text className="text-dark-2 text-xs uppercase font-medium tracking-wide">
              {playlist.criteria.logic === "or" ? "Match any" : "Match all"}
            </Text>
          </Group>
          <Group gap="xs">
            {playlist.criteria.rules.slice(0, 2).map((rule, index) => (
              <RuleBadge key={index} rule={rule} />
            ))}
            {playlist.criteria.rules.length > 2 && (
              <Badge color="dark" size="md" variant="light">
                +{playlist.criteria.rules.length - 2} more
              </Badge>
            )}
          </Group>
        </Box>

        {/* Footer Stats */}
        <Group
          className="mt-auto pt-2 border-t border-dark-5"
          justify="space-between"
        >
          <Group gap="md">
            <Tooltip label="Tracks in playlist">
              <Group gap={6}>
                <Music className="text-orange-5" size={14} />
                <Text className="text-dark-0 font-semibold" size="sm">
                  {playlist.trackCount.toLocaleString()}
                </Text>
              </Group>
            </Tooltip>
            {isSynced && (
              <Tooltip label="Synced to Spotify">
                <Badge
                  color="green"
                  leftSection={<ExternalLink size={10} />}
                  size="sm"
                  variant="light"
                >
                  Synced
                </Badge>
              </Tooltip>
            )}
          </Group>
          <Link
            onClick={(e) => e.stopPropagation()}
            params={{ id: playlist.id }}
            to="/smart-playlists/$id"
          >
            <Button
              className="group-hover:bg-orange-6 transition-colors"
              color="orange"
              rightSection={<Play size={14} />}
              size="xs"
              variant="light"
            >
              View
            </Button>
          </Link>
        </Group>
      </Stack>
    </Card>
  );
}

function formatRuleValue(rule: PlaylistRuleDto): string {
  const operatorsWithNoValue = [
    "isNull",
    "isNotNull",
    "hasAnyTag",
    "hasNoTags",
  ];
  if (operatorsWithNoValue.includes(rule.operator)) return "";
  if (rule.daysValue !== undefined && rule.daysValue !== null)
    return `${rule.daysValue} days`;
  if (rule.numberValue !== undefined) return String(rule.numberValue);
  return rule.value || "";
}

function RuleBadge({ rule }: { rule: PlaylistRuleDto }) {
  const config = FIELD_CONFIG[rule.field] || {
    color: "gray",
    icon: Filter,
    label: rule.field,
  };
  const Icon = config.icon;
  const operatorLabel = OPERATOR_LABELS[rule.operator] || rule.operator;
  const value = formatRuleValue(rule);

  return (
    <Badge
      className="font-normal"
      color={config.color}
      leftSection={<Icon size={12} />}
      size="md"
      variant="light"
    >
      {config.label} {operatorLabel} {value}
    </Badge>
  );
}
