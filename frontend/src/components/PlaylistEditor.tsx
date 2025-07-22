import {
  ActionIcon,
  Box,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { Plus, Trash } from "lucide-react";
import { useEffect } from "react";

import {
  PlaylistCriteriaDtoLogic,
  PlaylistCriteriaDtoOrderDirection,
  PlaylistRuleDto,
  PlaylistRuleDtoField,
  PlaylistRuleDtoOperator,
  SmartPlaylistWithTracksDto,
  useLibraryControllerGetTags,
  usePlaylistsControllerCreate,
  usePlaylistsControllerUpdate,
} from "../data/api";

interface PlaylistEditorProps {
  onCancel: () => void;
  onSave: () => void;
  playlist?: null | SmartPlaylistWithTracksDto;
}

const fieldOptions = [
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

const operatorsByField: Record<
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

const defaultRule: PlaylistRuleDto = {
  field: PlaylistRuleDtoField.title,
  operator: PlaylistRuleDtoOperator.contains,
  value: "",
};

interface FormValues {
  criteria: {
    limit?: number;
    logic: PlaylistCriteriaDtoLogic;
    orderBy: string;
    orderDirection: "asc" | "desc";
    rules: PlaylistRuleDto[];
  };
  description: string;
  isActive: boolean;
  name: string;
}

export function PlaylistEditor({
  onCancel,
  onSave,
  playlist,
}: PlaylistEditorProps) {
  const createMutation = usePlaylistsControllerCreate();
  const updateMutation = usePlaylistsControllerUpdate();
  const { data: tags } = useLibraryControllerGetTags();

  const form = useForm<FormValues>({
    initialValues: {
      criteria: {
        limit: undefined,
        logic: PlaylistCriteriaDtoLogic.and,
        orderBy: "addedAt",
        orderDirection: "desc",
        rules: [{ ...defaultRule }],
      },
      description: "",
      isActive: true,
      name: "",
    },
    validate: {
      name: (value) => (!value ? "Name is required" : null),
    },
  });

  useEffect(() => {
    if (playlist) {
      form.setValues({
        criteria: {
          limit: playlist.criteria.limit,
          logic: playlist.criteria.logic || PlaylistCriteriaDtoLogic.and,
          orderBy: playlist.criteria.orderBy || "addedAt",
          orderDirection: (playlist.criteria.orderDirection || "desc") as
            | "asc"
            | "desc",
          rules: playlist.criteria.rules || [{ ...defaultRule }],
        },
        description: playlist.description || "",
        isActive: playlist.isActive,
        name: playlist.name,
      });
    }
  }, [playlist]);

  const handleSubmit = async (values: FormValues) => {
    // Validate rules manually
    const errors: string[] = [];
    values.criteria.rules.forEach((rule, index) => {
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
      // Check if value is required based on operator
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

    if (errors.length > 0) {
      notifications.show({
        color: "red",
        message: errors.join("\n"),
        title: "Validation Error",
      });
      return;
    }

    try {
      const data = {
        criteria: {
          ...values.criteria,
          orderDirection: values.criteria
            .orderDirection as unknown as PlaylistCriteriaDtoOrderDirection,
        },
        description: values.description || undefined,
        isActive: values.isActive,
        name: values.name,
      };

      if (playlist) {
        await updateMutation.mutateAsync({
          data,
          id: playlist.id,
        });
        notifications.show({
          color: "green",
          message: "Playlist updated successfully",
        });
      } else {
        await createMutation.mutateAsync({ data });
        notifications.show({
          color: "green",
          message: "Playlist created successfully",
        });
      }
      onSave();
    } catch {
      notifications.show({
        color: "red",
        message: "Failed to save playlist",
      });
    }
  };

  const addRule = () => {
    form.insertListItem("criteria.rules", { ...defaultRule });
  };

  const removeRule = (index: number) => {
    form.removeListItem("criteria.rules", index);
  };

  const getValueInput = (rule: PlaylistRuleDto, index: number) => {
    const field = rule.field;
    const operator = rule.operator;

    // Check if operator doesn't require a value
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
          data={
            tags?.map((tag) => ({ label: tag.name, value: tag.name })) || []
          }
          placeholder="Select tag"
          searchable
          {...form.getInputProps(`criteria.rules.${index}.value`)}
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
          {...form.getInputProps(`criteria.rules.${index}.daysValue`)}
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
        ...form.getInputProps(`criteria.rules.${index}.numberValue`),
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

    return (
      <TextInput
        placeholder="Value"
        {...form.getInputProps(`criteria.rules.${index}.value`)}
      />
    );
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="My Smart Playlist"
          required
          {...form.getInputProps("name")}
        />

        <Textarea
          label="Description"
          placeholder="Optional description"
          {...form.getInputProps("description")}
        />

        <Box>
          <Text fw={500} mb="xs">
            Rules
          </Text>
          <Select
            data={[
              {
                label: "Match all of the following rules",
                value: PlaylistCriteriaDtoLogic.and,
              },
              {
                label: "Match any of the following rules",
                value: PlaylistCriteriaDtoLogic.or,
              },
            ]}
            mb="md"
            {...form.getInputProps("criteria.logic")}
          />

          <Stack gap="sm">
            {form.values.criteria.rules.map((rule, index) => (
              <Group align="flex-start" key={index}>
                <Select
                  data={fieldOptions}
                  placeholder="Field"
                  w={150}
                  {...form.getInputProps(`criteria.rules.${index}.field`)}
                  onChange={(value) => {
                    form.setFieldValue(
                      `criteria.rules.${index}.field`,
                      value as PlaylistRuleDtoField,
                    );
                    // Reset operator when field changes
                    const operators = operatorsByField[value as string] || [];
                    if (operators.length > 0) {
                      form.setFieldValue(
                        `criteria.rules.${index}.operator`,
                        operators[0].value as PlaylistRuleDtoOperator,
                      );
                    }
                  }}
                />

                <Select
                  data={operatorsByField[rule.field] || []}
                  placeholder="Operator"
                  w={150}
                  {...form.getInputProps(`criteria.rules.${index}.operator`)}
                />

                <Box style={{ flex: 1 }}>{getValueInput(rule, index)}</Box>

                <ActionIcon
                  color="red"
                  disabled={form.values.criteria.rules.length === 1}
                  onClick={() => removeRule(index)}
                  variant="subtle"
                >
                  <Trash size={16} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>

          <Button
            leftSection={<Plus size={16} />}
            mt="sm"
            onClick={addRule}
            variant="subtle"
          >
            Add Rule
          </Button>
        </Box>

        <Group>
          <NumberInput
            label="Limit tracks"
            min={1}
            placeholder="No limit"
            {...form.getInputProps("criteria.limit")}
          />

          <Select
            data={[
              { label: "Title", value: "title" },
              { label: "Artist", value: "artist" },
              { label: "Album", value: "album" },
              { label: "Date Added", value: "addedAt" },
              { label: "Last Played", value: "lastPlayed" },
              { label: "Play Count", value: "playCount" },
              { label: "Rating", value: "rating" },
            ]}
            label="Order by"
            {...form.getInputProps("criteria.orderBy")}
          />

          <Select
            data={[
              { label: "Ascending", value: "asc" },
              { label: "Descending", value: "desc" },
            ]}
            label="Order"
            {...form.getInputProps("criteria.orderDirection")}
          />
        </Group>

        <Group justify="flex-end">
          <Button onClick={onCancel} variant="subtle">
            Cancel
          </Button>
          <Button
            loading={createMutation.isPending || updateMutation.isPending}
            type="submit"
          >
            {playlist ? "Update" : "Create"} Playlist
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
