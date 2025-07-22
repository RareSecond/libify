import { ActionIcon, Box, Button, Group, NumberInput, Select, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Plus, Trash } from 'lucide-react';
import { useEffect } from 'react';

import {
  PlaylistCriteriaDtoLogic,
  PlaylistRuleDto,
  PlaylistRuleDtoField,
  PlaylistRuleDtoOperator,
  SmartPlaylistWithTracksDto,
  useLibraryControllerGetTags,
  usePlaylistsControllerCreate,
  usePlaylistsControllerUpdate,
} from '../data/api';

interface PlaylistEditorProps {
  playlist?: SmartPlaylistWithTracksDto | null;
  onSave: () => void;
  onCancel: () => void;
}

const fieldOptions = [
  { value: PlaylistRuleDtoField.title, label: 'Title' },
  { value: PlaylistRuleDtoField.artist, label: 'Artist' },
  { value: PlaylistRuleDtoField.album, label: 'Album' },
  { value: PlaylistRuleDtoField.rating, label: 'Rating' },
  { value: PlaylistRuleDtoField.playCount, label: 'Play Count' },
  { value: PlaylistRuleDtoField.lastPlayed, label: 'Last Played' },
  { value: PlaylistRuleDtoField.dateAdded, label: 'Date Added' },
  { value: PlaylistRuleDtoField.tag, label: 'Tag' },
  { value: PlaylistRuleDtoField.duration, label: 'Duration (ms)' },
];

const operatorsByField: Record<string, Array<{ value: string; label: string }>> = {
  [PlaylistRuleDtoField.title]: [
    { value: PlaylistRuleDtoOperator.contains, label: 'contains' },
    { value: PlaylistRuleDtoOperator.notContains, label: 'does not contain' },
    { value: PlaylistRuleDtoOperator.equals, label: 'equals' },
    { value: PlaylistRuleDtoOperator.notEquals, label: 'does not equal' },
    { value: PlaylistRuleDtoOperator.startsWith, label: 'starts with' },
    { value: PlaylistRuleDtoOperator.endsWith, label: 'ends with' },
  ],
  [PlaylistRuleDtoField.artist]: [
    { value: PlaylistRuleDtoOperator.contains, label: 'contains' },
    { value: PlaylistRuleDtoOperator.notContains, label: 'does not contain' },
    { value: PlaylistRuleDtoOperator.equals, label: 'equals' },
    { value: PlaylistRuleDtoOperator.notEquals, label: 'does not equal' },
    { value: PlaylistRuleDtoOperator.startsWith, label: 'starts with' },
    { value: PlaylistRuleDtoOperator.endsWith, label: 'ends with' },
  ],
  [PlaylistRuleDtoField.album]: [
    { value: PlaylistRuleDtoOperator.contains, label: 'contains' },
    { value: PlaylistRuleDtoOperator.notContains, label: 'does not contain' },
    { value: PlaylistRuleDtoOperator.equals, label: 'equals' },
    { value: PlaylistRuleDtoOperator.notEquals, label: 'does not equal' },
    { value: PlaylistRuleDtoOperator.startsWith, label: 'starts with' },
    { value: PlaylistRuleDtoOperator.endsWith, label: 'ends with' },
  ],
  [PlaylistRuleDtoField.rating]: [
    { value: PlaylistRuleDtoOperator.equals, label: 'equals' },
    { value: PlaylistRuleDtoOperator.notEquals, label: 'does not equal' },
    { value: PlaylistRuleDtoOperator.greaterThan, label: 'greater than' },
    { value: PlaylistRuleDtoOperator.lessThan, label: 'less than' },
  ],
  [PlaylistRuleDtoField.playCount]: [
    { value: PlaylistRuleDtoOperator.equals, label: 'equals' },
    { value: PlaylistRuleDtoOperator.notEquals, label: 'does not equal' },
    { value: PlaylistRuleDtoOperator.greaterThan, label: 'greater than' },
    { value: PlaylistRuleDtoOperator.lessThan, label: 'less than' },
  ],
  [PlaylistRuleDtoField.duration]: [
    { value: PlaylistRuleDtoOperator.equals, label: 'equals' },
    { value: PlaylistRuleDtoOperator.notEquals, label: 'does not equal' },
    { value: PlaylistRuleDtoOperator.greaterThan, label: 'greater than' },
    { value: PlaylistRuleDtoOperator.lessThan, label: 'less than' },
  ],
  [PlaylistRuleDtoField.lastPlayed]: [
    { value: PlaylistRuleDtoOperator.inLast, label: 'in the last' },
    { value: PlaylistRuleDtoOperator.notInLast, label: 'not in the last' },
  ],
  [PlaylistRuleDtoField.dateAdded]: [
    { value: PlaylistRuleDtoOperator.inLast, label: 'in the last' },
    { value: PlaylistRuleDtoOperator.notInLast, label: 'not in the last' },
  ],
  [PlaylistRuleDtoField.tag]: [
    { value: PlaylistRuleDtoOperator.hasTag, label: 'has tag' },
    { value: PlaylistRuleDtoOperator.notHasTag, label: 'does not have tag' },
  ],
};

const defaultRule: PlaylistRuleDto = {
  field: PlaylistRuleDtoField.title,
  operator: PlaylistRuleDtoOperator.contains,
  value: '',
};

interface FormValues {
  name: string;
  description: string;
  criteria: {
    rules: PlaylistRuleDto[];
    logic: PlaylistCriteriaDtoLogic;
    limit?: number;
    orderBy: string;
    orderDirection: 'asc' | 'desc';
  };
  isActive: boolean;
}

export function PlaylistEditor({ playlist, onSave, onCancel }: PlaylistEditorProps) {
  const createMutation = usePlaylistsControllerCreate();
  const updateMutation = usePlaylistsControllerUpdate();
  const { data: tags } = useLibraryControllerGetTags();

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      criteria: {
        rules: [{ ...defaultRule }],
        logic: PlaylistCriteriaDtoLogic.and,
        limit: undefined,
        orderBy: 'addedAt',
        orderDirection: 'desc',
      },
      isActive: true,
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
    },
  });

  useEffect(() => {
    if (playlist) {
      form.setValues({
        name: playlist.name,
        description: playlist.description || '',
        criteria: {
          rules: playlist.criteria.rules || [{ ...defaultRule }],
          logic: playlist.criteria.logic || PlaylistCriteriaDtoLogic.and,
          limit: playlist.criteria.limit,
          orderBy: playlist.criteria.orderBy || 'addedAt',
          orderDirection: (playlist.criteria.orderDirection || 'desc') as any,
        },
        isActive: playlist.isActive,
      });
    }
  }, [playlist]);

  const handleSubmit = async (values: FormValues) => {
    // Validate rules manually
    const errors: string[] = [];
    values.criteria.rules.forEach((rule, index) => {
      if (rule.field === PlaylistRuleDtoField.tag && !rule.value) {
        errors.push(`Rule ${index + 1}: Tag name is required`);
      }
      if ([PlaylistRuleDtoField.lastPlayed as string, PlaylistRuleDtoField.dateAdded as string].includes(rule.field as string) && !rule.daysValue) {
        errors.push(`Rule ${index + 1}: Days value is required`);
      }
      if ([PlaylistRuleDtoField.rating as string, PlaylistRuleDtoField.playCount as string, PlaylistRuleDtoField.duration as string].includes(rule.field as string) && rule.numberValue === undefined) {
        errors.push(`Rule ${index + 1}: Number value is required`);
      }
      if ([PlaylistRuleDtoField.title as string, PlaylistRuleDtoField.artist as string, PlaylistRuleDtoField.album as string].includes(rule.field as string) && !rule.value) {
        errors.push(`Rule ${index + 1}: Value is required`);
      }
    });

    if (errors.length > 0) {
      notifications.show({
        color: 'red',
        message: errors.join('\n'),
        title: 'Validation Error',
      });
      return;
    }

    try {
      const data = {
        name: values.name,
        description: values.description || undefined,
        criteria: {
          ...values.criteria,
          orderDirection: values.criteria.orderDirection as any,
        },
        isActive: values.isActive,
      };

      if (playlist) {
        await updateMutation.mutateAsync({
          id: playlist.id,
          data,
        });
        notifications.show({
          color: 'green',
          message: 'Playlist updated successfully',
        });
      } else {
        await createMutation.mutateAsync({ data });
        notifications.show({
          color: 'green',
          message: 'Playlist created successfully',
        });
      }
      onSave();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: 'Failed to save playlist',
      });
    }
  };

  const addRule = () => {
    form.insertListItem('criteria.rules', { ...defaultRule });
  };

  const removeRule = (index: number) => {
    form.removeListItem('criteria.rules', index);
  };

  const getValueInput = (rule: PlaylistRuleDto, index: number) => {
    const field = rule.field;

    if (field === PlaylistRuleDtoField.tag) {
      return (
        <Select
          data={tags?.map(tag => ({ value: tag.name, label: tag.name })) || []}
          placeholder="Select tag"
          searchable
          {...form.getInputProps(`criteria.rules.${index}.value`)}
        />
      );
    }

    if ([PlaylistRuleDtoField.lastPlayed as string, PlaylistRuleDtoField.dateAdded as string].includes(field as string)) {
      return (
        <NumberInput
          min={1}
          placeholder="Days"
          suffix=" days"
          {...form.getInputProps(`criteria.rules.${index}.daysValue`)}
        />
      );
    }

    if ([PlaylistRuleDtoField.rating as string, PlaylistRuleDtoField.playCount as string, PlaylistRuleDtoField.duration as string].includes(field as string)) {
      const props: any = {
        placeholder: 'Number',
        ...form.getInputProps(`criteria.rules.${index}.numberValue`),
      };

      if (field === PlaylistRuleDtoField.rating) {
        props.min = 1;
        props.max = 5;
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
          {...form.getInputProps('name')}
        />

        <Textarea
          label="Description"
          placeholder="Optional description"
          {...form.getInputProps('description')}
        />

        <Box>
          <Text fw={500} mb="xs">Rules</Text>
          <Select
            data={[
              { value: PlaylistCriteriaDtoLogic.and, label: 'Match all of the following rules' },
              { value: PlaylistCriteriaDtoLogic.or, label: 'Match any of the following rules' },
            ]}
            mb="md"
            {...form.getInputProps('criteria.logic')}
          />

          <Stack gap="sm">
            {form.values.criteria.rules.map((rule, index) => (
              <Group key={index} align="flex-start">
                <Select
                  data={fieldOptions}
                  placeholder="Field"
                  w={150}
                  {...form.getInputProps(`criteria.rules.${index}.field`)}
                  onChange={(value) => {
                    form.setFieldValue(`criteria.rules.${index}.field`, value as PlaylistRuleDtoField);
                    // Reset operator when field changes
                    const operators = operatorsByField[value as string] || [];
                    if (operators.length > 0) {
                      form.setFieldValue(`criteria.rules.${index}.operator`, operators[0].value as PlaylistRuleDtoOperator);
                    }
                  }}
                />

                <Select
                  data={operatorsByField[rule.field] || []}
                  placeholder="Operator"
                  w={150}
                  {...form.getInputProps(`criteria.rules.${index}.operator`)}
                />

                <Box style={{ flex: 1 }}>
                  {getValueInput(rule, index)}
                </Box>

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
            {...form.getInputProps('criteria.limit')}
          />

          <Select
            data={[
              { value: 'title', label: 'Title' },
              { value: 'artist', label: 'Artist' },
              { value: 'album', label: 'Album' },
              { value: 'addedAt', label: 'Date Added' },
              { value: 'lastPlayed', label: 'Last Played' },
              { value: 'playCount', label: 'Play Count' },
              { value: 'rating', label: 'Rating' },
            ]}
            label="Order by"
            {...form.getInputProps('criteria.orderBy')}
          />

          <Select
            data={[
              { value: 'asc', label: 'Ascending' },
              { value: 'desc', label: 'Descending' },
            ]}
            label="Order"
            {...form.getInputProps('criteria.orderDirection')}
          />
        </Group>

        <Group justify="flex-end">
          <Button onClick={onCancel} variant="subtle">
            Cancel
          </Button>
          <Button loading={createMutation.isPending || updateMutation.isPending} type="submit">
            {playlist ? 'Update' : 'Create'} Playlist
          </Button>
        </Group>
      </Stack>
    </form>
  );
}