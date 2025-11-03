import { Text } from "@mantine/core";

export function PageTitle({ title }: { title: string }) {
  return (
    <Text className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-4 to-orange-6 bg-clip-text text-transparent">
      {title}
    </Text>
  );
}
