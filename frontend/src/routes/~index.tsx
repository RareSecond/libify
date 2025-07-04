import { useAppControllerGetHello } from "@/data/api";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading } = useAppControllerGetHello();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div className="text-2xl font-bold">{data}</div>;
}
