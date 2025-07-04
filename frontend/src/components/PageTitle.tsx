import { Text } from "@mantine/core";

export function PageTitle({ title }: { title: string }) {
  return <Text className="text-2xl font-bold mb-4">{title}</Text>;
}
