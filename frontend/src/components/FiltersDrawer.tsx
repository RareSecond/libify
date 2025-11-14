import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { Filter } from "lucide-react";
import { ReactNode, useState } from "react";

interface FiltersDrawerProps {
  children?: ReactNode;
  onPageSizeChange?: (pageSize: number) => void;
  pageSize?: number;
}

export function FiltersDrawer({
  children,
  onPageSizeChange,
  pageSize = 20,
}: FiltersDrawerProps) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      {/* Filter button with touch-friendly size */}
      <ActionIcon
        className="md:hidden"
        onClick={() => setOpened(true)}
        size="lg"
        variant="light"
      >
        <Filter size={20} />
      </ActionIcon>

      {/* Drawer for mobile */}
      <Drawer
        className="md:hidden"
        offset={8}
        onClose={() => setOpened(false)}
        opened={opened}
        padding="md"
        position="bottom"
        radius="md"
        size="auto"
        title={
          <Group gap="xs">
            <Filter size={20} />
            <Text className="font-semibold">Filters</Text>
          </Group>
        }
        transitionProps={{ duration: 200, transition: "slide-up" }}
      >
        <Stack gap="md">
          {/* Page Size Control */}
          <Select
            data={["10", "20", "50", "100"]}
            label="Items per page"
            onChange={(value) => onPageSizeChange?.(parseInt(value || "20"))}
            value={pageSize.toString()}
          />

          {/* Extra controls passed from parent */}
          {children}

          {/* Apply button */}
          <Button fullWidth onClick={() => setOpened(false)}>
            Apply Filters
          </Button>
        </Stack>
      </Drawer>

      {/* Desktop inline filters */}
      <Group className="hidden md:flex" gap="sm">
        {children}
        <Select
          className="w-[100px]"
          data={["10", "20", "50", "100"]}
          label="Page size"
          onChange={(value) => onPageSizeChange?.(parseInt(value || "20"))}
          value={pageSize.toString()}
        />
      </Group>
    </>
  );
}
