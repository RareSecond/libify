import { ActionIcon, Checkbox, Menu, Stack, Text } from "@mantine/core";
import { VisibilityState } from "@tanstack/react-table";
import { Columns3 } from "lucide-react";

import { COLUMN_LABELS, REQUIRED_COLUMNS } from "../constants/trackColumns";

interface ColumnVisibilityMenuProps {
  columnVisibility: VisibilityState;
  onToggle: (columnId: string) => void;
}

export function ColumnVisibilityMenu({
  columnVisibility,
  onToggle,
}: ColumnVisibilityMenuProps) {
  const toggleableColumns = Object.keys(COLUMN_LABELS).filter(
    (col) => !REQUIRED_COLUMNS.includes(col),
  );

  return (
    <Menu position="bottom-end" shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon color="gray" size="lg" variant="subtle">
          <Columns3 size={20} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Visible columns</Menu.Label>
        <Stack className="px-3 py-2" gap="xs">
          {toggleableColumns.map((columnId) => (
            <Checkbox
              checked={columnVisibility[columnId] !== false}
              color="orange"
              key={columnId}
              label={
                <Text size="sm">{COLUMN_LABELS[columnId] || columnId}</Text>
              }
              onChange={() => onToggle(columnId)}
              size="sm"
            />
          ))}
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
}
