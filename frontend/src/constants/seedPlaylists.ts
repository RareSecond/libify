import {
  CreateSmartPlaylistDto,
  PlaylistCriteriaDtoLogic,
  PlaylistRuleDtoField,
  PlaylistRuleDtoOperator,
} from "@/data/api";

// Seed playlists created during onboarding
export const SEED_PLAYLISTS: CreateSmartPlaylistDto[] = [
  {
    criteria: {
      logic: PlaylistCriteriaDtoLogic.and,
      orderBy: "ratedAt",
      orderDirection:
        "desc" as unknown as CreateSmartPlaylistDto["criteria"]["orderDirection"],
      rules: [
        {
          field: PlaylistRuleDtoField.rating,
          numberValue: 5,
          operator: PlaylistRuleDtoOperator.equals,
        },
      ],
    },
    description: "Tracks you've rated 5 stars",
    name: "My Favorites",
  },
  {
    criteria: {
      logic: PlaylistCriteriaDtoLogic.and,
      orderBy: "rating",
      orderDirection:
        "desc" as unknown as CreateSmartPlaylistDto["criteria"]["orderDirection"],
      rules: [
        {
          field: PlaylistRuleDtoField.rating,
          numberValue: 3.5,
          operator: PlaylistRuleDtoOperator.greaterThan,
        },
      ],
    },
    description: "All tracks rated 4 stars or higher",
    name: "Highly Rated",
  },
  {
    criteria: {
      logic: PlaylistCriteriaDtoLogic.and,
      orderBy: "rating",
      orderDirection:
        "desc" as unknown as CreateSmartPlaylistDto["criteria"]["orderDirection"],
      rules: [
        {
          field: PlaylistRuleDtoField.rating,
          operator: PlaylistRuleDtoOperator.isNotNull,
        },
      ],
    },
    description: "Every track you've rated, sorted by rating",
    name: "All Rated Tracks",
  },
];
