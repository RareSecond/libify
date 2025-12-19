import { useQuery } from "@tanstack/react-query";

import { AXIOS_INSTANCE } from "@/data/custom-instance";

interface ApiKeyResponse {
  apiKey: string;
}

export function useApiKey() {
  return useQuery({
    queryFn: fetchApiKey,
    queryKey: ["api-key"],
    // Don't refetch automatically - user explicitly requests this
    staleTime: Infinity,
  });
}

async function fetchApiKey(): Promise<ApiKeyResponse> {
  const { data } = await AXIOS_INSTANCE.get<ApiKeyResponse>("/auth/api-key");
  return data;
}
