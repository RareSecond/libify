import { NumberInput, Select, TextInput } from "@mantine/core";

import {
  PlaylistRuleDto,
  PlaylistRuleDtoField,
  PlaylistRuleDtoOperator,
} from "../../data/api";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface PlaylistRuleValueInputProps {
  inputProps: { daysValue: any; numberValue: any; value: any };
  rule: PlaylistRuleDto;
  tags?: Array<{ id: string; name: string }>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function PlaylistRuleValueInput({
  inputProps,
  rule,
  tags,
}: PlaylistRuleValueInputProps) {
  const field = rule.field;
  const operator = rule.operator;

  if (
    operator === PlaylistRuleDtoOperator.hasAnyTag ||
    operator === PlaylistRuleDtoOperator.hasNoTags ||
    operator === PlaylistRuleDtoOperator.isNotNull ||
    operator === PlaylistRuleDtoOperator.isNull
  ) {
    return null;
  }

  if (field === PlaylistRuleDtoField.tag) {
    return (
      <Select
        data={tags?.map((tag) => ({ label: tag.name, value: tag.name })) || []}
        placeholder="Select tag"
        searchable
        {...inputProps.value}
      />
    );
  }

  if (
    [
      PlaylistRuleDtoField.dateAdded as string,
      PlaylistRuleDtoField.lastPlayed as string,
    ].includes(field as string)
  ) {
    return (
      <NumberInput
        min={1}
        placeholder="Days"
        suffix=" days"
        {...inputProps.daysValue}
      />
    );
  }

  // Audio feature fields (0-1 scale)
  const audioFeatureFields = [
    PlaylistRuleDtoField.energy,
    PlaylistRuleDtoField.danceability,
    PlaylistRuleDtoField.valence,
    PlaylistRuleDtoField.acousticness,
    PlaylistRuleDtoField.instrumentalness,
    PlaylistRuleDtoField.speechiness,
    PlaylistRuleDtoField.liveness,
  ] as string[];

  if (audioFeatureFields.includes(field as string)) {
    return (
      <NumberInput
        decimalScale={2}
        max={1}
        min={0}
        placeholder="0.0 - 1.0"
        step={0.1}
        {...inputProps.numberValue}
      />
    );
  }

  // Tempo (BPM)
  if (field === PlaylistRuleDtoField.tempo) {
    return (
      <NumberInput
        decimalScale={0}
        max={300}
        min={0}
        placeholder="BPM (e.g. 120)"
        step={5}
        {...inputProps.numberValue}
      />
    );
  }

  if (
    [
      PlaylistRuleDtoField.duration as string,
      PlaylistRuleDtoField.playCount as string,
      PlaylistRuleDtoField.rating as string,
    ].includes(field as string)
  ) {
    const props = {
      placeholder: "Number",
      ...inputProps.numberValue,
      decimalScale: undefined as number | undefined,
      max: undefined as number | undefined,
      min: 0,
      step: undefined as number | undefined,
    };

    if (field === PlaylistRuleDtoField.rating) {
      props.min = 0.5;
      props.max = 5;
      props.step = 0.5;
      props.decimalScale = 1;
    } else {
      props.min = 0;
    }

    return <NumberInput {...props} />;
  }

  return <TextInput placeholder="Value" {...inputProps.value} />;
}
