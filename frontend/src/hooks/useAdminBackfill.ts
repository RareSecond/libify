import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { customInstance } from "@/data/custom-instance";

export interface BackfillStatus {
  completed: number;
  pending: number;
  percentComplete: number;
  total: number;
}

export interface CombinedBackfillStatus {
  audioFeatures: BackfillStatus;
  genres: BackfillStatus;
}

interface BackfillTriggerResponse {
  jobId?: string;
  message: string;
}

export function useAllBackfills() {
  return useBackfillMutation(triggerAllBackfills, "backfills");
}

export function useAudioFeaturesBackfill() {
  return useBackfillMutation(
    triggerAudioFeaturesBackfill,
    "audio features backfill",
  );
}

export function useBackfillStatus() {
  return useQuery({
    queryFn: getBackfillStatus,
    queryKey: ["admin", "backfill", "status"],
    refetchInterval: 10000,
  });
}

export function useGenreBackfill() {
  return useBackfillMutation(triggerGenreBackfill, "genre backfill");
}

function getBackfillStatus() {
  return customInstance<CombinedBackfillStatus>({
    method: "GET",
    url: "/admin/backfill/status",
  });
}

function triggerAllBackfills() {
  return customInstance<BackfillTriggerResponse>({
    method: "POST",
    url: "/admin/backfill/all",
  });
}

function triggerAudioFeaturesBackfill() {
  return customInstance<BackfillTriggerResponse>({
    method: "POST",
    url: "/admin/backfill/audio-features",
  });
}

function triggerGenreBackfill() {
  return customInstance<BackfillTriggerResponse>({
    method: "POST",
    url: "/admin/backfill/genres",
  });
}

function useBackfillMutation(
  mutationFn: () => Promise<BackfillTriggerResponse>,
  title: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onError: () => {
      notifications.show({
        color: "red",
        message: `Failed to start ${title}`,
        title: "Error",
      });
    },
    onSuccess: (data) => {
      notifications.show({
        color: "green",
        message: data.message,
        title: "Backfill Started",
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "backfill", "status"],
      });
    },
  });
}
