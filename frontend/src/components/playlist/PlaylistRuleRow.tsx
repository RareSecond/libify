import { ActionIcon, Box, Group, Select } from "@mantine/core";
import { Trash } from "lucide-react";

import { PlaylistRuleDto, PlaylistRuleDtoField } from "../../data/api";
import { fieldOptions, operatorsByField } from "../../utils/playlistConstants";
import { PlaylistRuleValueInput } from "./PlaylistRuleValueInput";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface PlaylistRuleRowProps {
  canRemove: boolean;
  index: number;
  onFieldChange: (index: number, value: PlaylistRuleDtoField) => void;
  onRemove: (index: number) => void;
  rule: PlaylistRuleDto;
  ruleInputProps: {
    daysValue: any;
    field: any;
    numberValue: any;
    operator: any;
    value: any;
  };
  tags?: Array<{ id: string; name: string }>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function PlaylistRuleRow({
  canRemove,
  index,
  onFieldChange,
  onRemove,
  rule,
  ruleInputProps,
  tags,
}: PlaylistRuleRowProps) {
  return (
    <Group align="flex-start">
      <Select
        className="w-[150px]"
        data={fieldOptions}
        placeholder="Field"
        {...ruleInputProps.field}
        onChange={(value) =>
          onFieldChange(index, value as PlaylistRuleDtoField)
        }
      />

      <Select
        className="w-[150px]"
        data={operatorsByField[rule.field] || []}
        placeholder="Operator"
        {...ruleInputProps.operator}
      />

      <Box className="flex-1">
        <PlaylistRuleValueInput
          inputProps={{
            daysValue: ruleInputProps.daysValue,
            numberValue: ruleInputProps.numberValue,
            value: ruleInputProps.value,
          }}
          rule={rule}
          tags={tags}
        />
      </Box>

      <ActionIcon
        color="red"
        disabled={!canRemove}
        onClick={() => onRemove(index)}
        variant="subtle"
      >
        <Trash size={16} />
      </ActionIcon>
    </Group>
  );
}
