import { Badge } from "@mantine/core";
import {
  Calendar,
  Clock,
  Disc,
  Filter,
  Hash,
  Mic2,
  Music,
  Play,
  Star,
  Tag,
} from "lucide-react";

import { PlaylistRuleDto } from "../../data/api";

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

export function PlaylistRuleBadge({ rule }: { rule: PlaylistRuleDto }) {
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
