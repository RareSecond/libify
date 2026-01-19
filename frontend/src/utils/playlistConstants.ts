import {
  PlaylistCriteriaDtoLogic,
  PlaylistRuleDto,
  PlaylistRuleDtoField,
  PlaylistRuleDtoOperator,
} from "../data/api";

export const fieldOptions = [
  { label: "Title", value: PlaylistRuleDtoField.title },
  { label: "Artist", value: PlaylistRuleDtoField.artist },
  { label: "Album", value: PlaylistRuleDtoField.album },
  { label: "Rating", value: PlaylistRuleDtoField.rating },
  { label: "Play Count", value: PlaylistRuleDtoField.playCount },
  { label: "Last Played", value: PlaylistRuleDtoField.lastPlayed },
  { label: "Date Added", value: PlaylistRuleDtoField.dateAdded },
  { label: "Tag", value: PlaylistRuleDtoField.tag },
  { label: "Duration (ms)", value: PlaylistRuleDtoField.duration },
  // Audio features
  { label: "Tempo (BPM)", value: PlaylistRuleDtoField.tempo },
  { label: "Energy", value: PlaylistRuleDtoField.energy },
  { label: "Danceability", value: PlaylistRuleDtoField.danceability },
  { label: "Valence (Happiness)", value: PlaylistRuleDtoField.valence },
  { label: "Acousticness", value: PlaylistRuleDtoField.acousticness },
  { label: "Instrumentalness", value: PlaylistRuleDtoField.instrumentalness },
  { label: "Speechiness", value: PlaylistRuleDtoField.speechiness },
  { label: "Liveness", value: PlaylistRuleDtoField.liveness },
];

// Common operators for numeric audio features (0-1 scale)
const audioFeatureOperators = [
  { label: "greater than", value: PlaylistRuleDtoOperator.greaterThan },
  { label: "less than", value: PlaylistRuleDtoOperator.lessThan },
  { label: "equals", value: PlaylistRuleDtoOperator.equals },
  { label: "does not equal", value: PlaylistRuleDtoOperator.notEquals },
  { label: "has value", value: PlaylistRuleDtoOperator.isNotNull },
  { label: "has no value", value: PlaylistRuleDtoOperator.isNull },
];

export const operatorsByField: Record<
  string,
  Array<{ label: string; value: string }>
> = {
  [PlaylistRuleDtoField.acousticness]: audioFeatureOperators,
  [PlaylistRuleDtoField.album]: [
    { label: "contains", value: PlaylistRuleDtoOperator.contains },
    { label: "does not contain", value: PlaylistRuleDtoOperator.notContains },
    { label: "equals", value: PlaylistRuleDtoOperator.equals },
    { label: "does not equal", value: PlaylistRuleDtoOperator.notEquals },
    { label: "starts with", value: PlaylistRuleDtoOperator.startsWith },
    { label: "ends with", value: PlaylistRuleDtoOperator.endsWith },
  ],
  [PlaylistRuleDtoField.artist]: [
    { label: "contains", value: PlaylistRuleDtoOperator.contains },
    { label: "does not contain", value: PlaylistRuleDtoOperator.notContains },
    { label: "equals", value: PlaylistRuleDtoOperator.equals },
    { label: "does not equal", value: PlaylistRuleDtoOperator.notEquals },
    { label: "starts with", value: PlaylistRuleDtoOperator.startsWith },
    { label: "ends with", value: PlaylistRuleDtoOperator.endsWith },
  ],
  [PlaylistRuleDtoField.danceability]: audioFeatureOperators,
  [PlaylistRuleDtoField.dateAdded]: [
    { label: "in the last", value: PlaylistRuleDtoOperator.inLast },
    { label: "not in the last", value: PlaylistRuleDtoOperator.notInLast },
  ],
  [PlaylistRuleDtoField.duration]: [
    { label: "equals", value: PlaylistRuleDtoOperator.equals },
    { label: "does not equal", value: PlaylistRuleDtoOperator.notEquals },
    { label: "greater than", value: PlaylistRuleDtoOperator.greaterThan },
    { label: "less than", value: PlaylistRuleDtoOperator.lessThan },
  ],
  [PlaylistRuleDtoField.energy]: audioFeatureOperators,
  [PlaylistRuleDtoField.instrumentalness]: audioFeatureOperators,
  [PlaylistRuleDtoField.lastPlayed]: [
    { label: "in the last", value: PlaylistRuleDtoOperator.inLast },
    { label: "not in the last", value: PlaylistRuleDtoOperator.notInLast },
  ],
  [PlaylistRuleDtoField.liveness]: audioFeatureOperators,
  [PlaylistRuleDtoField.playCount]: [
    { label: "equals", value: PlaylistRuleDtoOperator.equals },
    { label: "does not equal", value: PlaylistRuleDtoOperator.notEquals },
    { label: "greater than", value: PlaylistRuleDtoOperator.greaterThan },
    { label: "less than", value: PlaylistRuleDtoOperator.lessThan },
  ],
  [PlaylistRuleDtoField.rating]: [
    { label: "equals", value: PlaylistRuleDtoOperator.equals },
    { label: "does not equal", value: PlaylistRuleDtoOperator.notEquals },
    { label: "greater than", value: PlaylistRuleDtoOperator.greaterThan },
    { label: "less than", value: PlaylistRuleDtoOperator.lessThan },
    { label: "has no rating", value: PlaylistRuleDtoOperator.isNull },
    { label: "has rating", value: PlaylistRuleDtoOperator.isNotNull },
  ],
  [PlaylistRuleDtoField.speechiness]: audioFeatureOperators,
  [PlaylistRuleDtoField.tag]: [
    { label: "has tag", value: PlaylistRuleDtoOperator.hasTag },
    { label: "does not have tag", value: PlaylistRuleDtoOperator.notHasTag },
    { label: "has any tag", value: PlaylistRuleDtoOperator.hasAnyTag },
    { label: "has no tags", value: PlaylistRuleDtoOperator.hasNoTags },
  ],
  [PlaylistRuleDtoField.tempo]: audioFeatureOperators,
  [PlaylistRuleDtoField.title]: [
    { label: "contains", value: PlaylistRuleDtoOperator.contains },
    { label: "does not contain", value: PlaylistRuleDtoOperator.notContains },
    { label: "equals", value: PlaylistRuleDtoOperator.equals },
    { label: "does not equal", value: PlaylistRuleDtoOperator.notEquals },
    { label: "starts with", value: PlaylistRuleDtoOperator.startsWith },
    { label: "ends with", value: PlaylistRuleDtoOperator.endsWith },
  ],
  [PlaylistRuleDtoField.valence]: audioFeatureOperators,
};

export const defaultRule: PlaylistRuleDto = {
  field: PlaylistRuleDtoField.title,
  operator: PlaylistRuleDtoOperator.contains,
  value: "",
};

export const logicOptions = [
  {
    label: "Match all of the following rules",
    value: PlaylistCriteriaDtoLogic.and,
  },
  {
    label: "Match any of the following rules",
    value: PlaylistCriteriaDtoLogic.or,
  },
];

export const orderByOptions = [
  { label: "Title", value: "title" },
  { label: "Artist", value: "artist" },
  { label: "Album", value: "album" },
  { label: "Date Added", value: "addedAt" },
  { label: "Last Played", value: "lastPlayed" },
  { label: "Play Count", value: "playCount" },
  { label: "Rating", value: "rating" },
  { label: "Tempo", value: "tempo" },
  { label: "Energy", value: "energy" },
  { label: "Danceability", value: "danceability" },
  { label: "Valence (Happiness)", value: "valence" },
  { label: "Acousticness", value: "acousticness" },
  { label: "Instrumentalness", value: "instrumentalness" },
  { label: "Speechiness", value: "speechiness" },
  { label: "Liveness", value: "liveness" },
];
