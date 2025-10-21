import {
  PlaylistRuleDto,
  PlaylistRuleDtoField,
  PlaylistRuleDtoOperator,
} from "../data/api";

export function validatePlaylistRules(rules: PlaylistRuleDto[]): string[] {
  const errors: string[] = [];

  rules.forEach((rule, index) => {
    if (
      rule.field === PlaylistRuleDtoField.tag &&
      !rule.value &&
      rule.operator !== PlaylistRuleDtoOperator.hasAnyTag &&
      rule.operator !== PlaylistRuleDtoOperator.hasNoTags
    ) {
      errors.push(`Rule ${index + 1}: Tag name is required`);
    }

    if (
      [
        PlaylistRuleDtoField.dateAdded as string,
        PlaylistRuleDtoField.lastPlayed as string,
      ].includes(rule.field as string) &&
      !rule.daysValue
    ) {
      errors.push(`Rule ${index + 1}: Days value is required`);
    }

    const valueNotRequired =
      rule.operator === PlaylistRuleDtoOperator.hasAnyTag ||
      rule.operator === PlaylistRuleDtoOperator.hasNoTags ||
      rule.operator === PlaylistRuleDtoOperator.isNotNull ||
      rule.operator === PlaylistRuleDtoOperator.isNull;

    if (
      !valueNotRequired &&
      [
        PlaylistRuleDtoField.duration as string,
        PlaylistRuleDtoField.playCount as string,
        PlaylistRuleDtoField.rating as string,
      ].includes(rule.field as string) &&
      rule.numberValue === undefined
    ) {
      errors.push(`Rule ${index + 1}: Number value is required`);
    }

    if (
      !valueNotRequired &&
      [
        PlaylistRuleDtoField.album as string,
        PlaylistRuleDtoField.artist as string,
        PlaylistRuleDtoField.title as string,
      ].includes(rule.field as string) &&
      !rule.value
    ) {
      errors.push(`Rule ${index + 1}: Value is required`);
    }
  });

  return errors;
}
