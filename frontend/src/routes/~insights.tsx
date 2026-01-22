import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/insights")({
  component: InsightsLayout,
});

function InsightsLayout() {
  return <Outlet />;
}
