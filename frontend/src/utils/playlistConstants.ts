import {
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
];

export const operatorsByField: Record<
  string,
  Array<{ label: string; value: string }>
> = {
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
  [PlaylistRuleDtoField.lastPlayed]: [
    { label: "in the last", value: PlaylistRuleDtoOperator.inLast },
    { label: "not in the last", value: PlaylistRuleDtoOperator.notInLast },
  ],
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
  [PlaylistRuleDtoField.tag]: [
    { label: "has tag", value: PlaylistRuleDtoOperator.hasTag },
    { label: "does not have tag", value: PlaylistRuleDtoOperator.notHasTag },
    { label: "has any tag", value: PlaylistRuleDtoOperator.hasAnyTag },
    { label: "has no tags", value: PlaylistRuleDtoOperator.hasNoTags },
  ],
  [PlaylistRuleDtoField.title]: [
    { label: "contains", value: PlaylistRuleDtoOperator.contains },
    { label: "does not contain", value: PlaylistRuleDtoOperator.notContains },
    { label: "equals", value: PlaylistRuleDtoOperator.equals },
    { label: "does not equal", value: PlaylistRuleDtoOperator.notEquals },
    { label: "starts with", value: PlaylistRuleDtoOperator.startsWith },
    { label: "ends with", value: PlaylistRuleDtoOperator.endsWith },
  ],
};

export const defaultRule: PlaylistRuleDto = {
  field: PlaylistRuleDtoField.title,
  operator: PlaylistRuleDtoOperator.contains,
  value: "",
};
