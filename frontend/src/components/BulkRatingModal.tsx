import { Button, Checkbox, Group, Modal, Stack, Text } from "@mantine/core";
import { useState } from "react";

import { BulkRatingSelectorDisplay } from "./BulkRatingSelectorDisplay";

interface BulkRatingModalProps {
  onClose: () => void;
  onConfirm: (rating: number, overwriteExisting: boolean) => Promise<void>;
  opened: boolean;
  selectionCount: number;
}

export function BulkRatingModal({
  onClose,
  onConfirm,
  opened,
  selectionCount,
}: BulkRatingModalProps) {
  const [rating, setRating] = useState<null | number>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (rating === null) return;
    setIsSubmitting(true);
    try {
      await onConfirm(rating, overwriteExisting);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(null);
    setOverwriteExisting(false);
    onClose();
  };

  return (
    <Modal
      onClose={handleClose}
      opened={opened}
      title={`Rate ${selectionCount} tracks`}
    >
      <Stack gap="md">
        <Text className="text-gray-500" size="sm">
          Set a rating for all selected tracks
        </Text>

        <Group justify="center">
          <BulkRatingSelectorDisplay
            onRatingChange={setRating}
            rating={rating}
            size="xl"
          />
        </Group>

        <Checkbox
          checked={overwriteExisting}
          description="If unchecked, only unrated tracks will be rated"
          label="Overwrite existing ratings"
          onChange={(e) => setOverwriteExisting(e.currentTarget.checked)}
        />

        <Group justify="flex-end">
          <Button onClick={handleClose} variant="subtle">
            Cancel
          </Button>
          <Button
            disabled={rating === null || isSubmitting}
            loading={isSubmitting}
            onClick={handleConfirm}
          >
            Apply Rating
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
