import { MultiSelect } from "@mantine/core";
import { Tags } from "lucide-react";

interface GenreFilterProps {
  className?: string;
  genres: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  value: string[];
}

export function GenreFilter({
  className,
  genres,
  onChange,
  placeholder = "Filter by genres",
  value,
}: GenreFilterProps) {
  const data = genres.map((genre) => ({ label: genre, value: genre }));

  return (
    <MultiSelect
      className={className}
      clearable
      data={data}
      leftSection={<Tags size={16} />}
      maxDropdownHeight={300}
      onChange={onChange}
      placeholder={placeholder}
      searchable
      styles={{ input: { minWidth: 200 } }}
      value={value}
    />
  );
}
