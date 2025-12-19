import { createFileRoute } from "@tanstack/react-router";

import { PageTitle } from "@/components/PageTitle";
import { ApiKeySection } from "@/components/settings/ApiKeySection";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto p-2 md:p-4">
      <PageTitle title="Settings" />
      <div className="mt-6">
        <ApiKeySection />
      </div>
    </div>
  );
}
