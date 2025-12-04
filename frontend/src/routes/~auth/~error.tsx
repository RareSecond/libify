import { Button } from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Mail } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  reason: z.enum(["not_whitelisted", "auth_failed"]).optional(),
});

export const Route = createFileRoute("/auth/error")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { reason } = Route.useSearch();

  const isNotWhitelisted = reason === "not_whitelisted";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 bg-[#1A1B1E]">
      <div className="flex items-center gap-3 text-orange-500">
        <AlertCircle className="w-12 h-12" />
      </div>

      {isNotWhitelisted ? (
        <>
          <div className="text-2xl font-bold text-gray-100 text-center">
            Beta Access Required
          </div>
          <p className="text-gray-400 text-center max-w-md">
            This application is currently in private beta. Your account is not
            yet whitelisted for access.
          </p>
          <div className="flex flex-col items-center gap-4 mt-4 p-6 bg-[#25262b] rounded-lg max-w-md border border-[#373A40]">
            <Mail className="w-8 h-8 text-gray-500" />
            <p className="text-gray-400 text-center text-sm">
              If you believe you should have access or would like to request
              beta access, please contact the administrator.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="text-2xl font-bold text-gray-100 text-center">
            Authentication Failed
          </div>
          <p className="text-gray-400 text-center max-w-md">
            We were unable to complete the authentication process. Please try
            again.
          </p>
        </>
      )}

      <div className="flex gap-4 mt-4">
        <Button
          color="gray"
          onClick={() => navigate({ to: "/" })}
          variant="outline"
        >
          Go to Home
        </Button>
        {!isNotWhitelisted && (
          <Button
            color="orange"
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_API_URL || ""}/auth/spotify`;
            }}
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
