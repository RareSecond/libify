/* eslint-disable max-lines */
import {
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
import { Plus } from "lucide-react";
import { useEffect } from "react";

import {
  PlaylistCriteriaDtoLogic,
  PlaylistCriteriaDtoOrderDirection,
  type PlaylistRuleDto,
  PlaylistRuleDtoField,
  PlaylistRuleDtoOperator,
  SmartPlaylistWithTracksDto,
  useLibraryControllerGetTags,
  usePlaylistsControllerCreate,
  usePlaylistsControllerUpdate,
} from "../data/api";
import { defaultRule, operatorsByField } from "../utils/playlistConstants";
import { validatePlaylistRules } from "../utils/playlistValidation";
import { PlaylistRuleRow } from "./playlist/PlaylistRuleRow";

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

interface PlaylistEditorProps {
  onCancel: () => void;
  onSave: () => void;
  playlist?: null | SmartPlaylistWithTracksDto;
}
const logicOptions = [
  {
    label: "Match all of the following rules",
    value: PlaylistCriteriaDtoLogic.and,
  },
  {
    label: "Match any of the following rules",
    value: PlaylistCriteriaDtoLogic.or,
  },
];
const orderByOptions = [
  { label: "Title", value: "title" },
  { label: "Artist", value: "artist" },
  { label: "Album", value: "album" },
  { label: "Date Added", value: "addedAt" },
  { label: "Last Played", value: "lastPlayed" },
  { label: "Play Count", value: "playCount" },
  { label: "Rating", value: "rating" },
];
const orderDirectionOptions = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];
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
    validate: { name: (value) => (!value ? "Name is required" : null) },
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
    const errors = validatePlaylistRules(values.criteria.rules);
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
        await updateMutation.mutateAsync({ data, id: playlist.id });
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
      notifications.show({ color: "red", message: "Failed to save playlist" });
    }
  };
  const addRule = () => {
    form.insertListItem("criteria.rules", { ...defaultRule });
  };
  const removeRule = (index: number) => {
    form.removeListItem("criteria.rules", index);
  };
  const handleFieldChange = (index: number, value: PlaylistRuleDtoField) => {
    form.setFieldValue(`criteria.rules.${index}.field`, value);
    const operators = operatorsByField[value as string] || [];
    if (operators.length > 0) {
      form.setFieldValue(
        `criteria.rules.${index}.operator`,
        operators[0].value as PlaylistRuleDtoOperator,
      );
    }
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
          <Text className="mb-2 font-medium">Rules</Text>
          <Select
            className="mb-4"
            data={logicOptions}
            {...form.getInputProps("criteria.logic")}
          />
          <Stack gap="sm">
            {form.values.criteria.rules.map((rule, index) => (
              <PlaylistRuleRow
                canRemove={form.values.criteria.rules.length > 1}
                index={index}
                key={index}
                onFieldChange={handleFieldChange}
                onRemove={removeRule}
                rule={rule}
                ruleInputProps={{
                  daysValue: form.getInputProps(
                    `criteria.rules.${index}.daysValue`,
                  ),
                  field: form.getInputProps(`criteria.rules.${index}.field`),
                  numberValue: form.getInputProps(
                    `criteria.rules.${index}.numberValue`,
                  ),
                  operator: form.getInputProps(
                    `criteria.rules.${index}.operator`,
                  ),
                  value: form.getInputProps(`criteria.rules.${index}.value`),
                }}
                tags={tags}
              />
            ))}
          </Stack>
          <Button
            className="mt-4"
            leftSection={<Plus size={16} />}
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
            data={orderByOptions}
            label="Order by"
            {...form.getInputProps("criteria.orderBy")}
          />
          <Select
            data={orderDirectionOptions}
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
