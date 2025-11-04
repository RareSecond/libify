import { Box, Button, Tooltip } from "@mantine/core";
import { X } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

interface OnboardingTooltipProps {
  autoAdvanceDelay?: number; // milliseconds, default 30000 (30 seconds)
  children: ReactNode;
  description: string;
  isOpen: boolean;
  onNext?: () => void;
  onSkip?: () => void;
  position?: "bottom" | "left" | "right" | "top";
  title: string;
}

export function OnboardingTooltip({
  autoAdvanceDelay = 30000,
  children,
  description,
  isOpen,
  onNext,
  onSkip,
  position = "bottom",
  title,
}: OnboardingTooltipProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(isOpen);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsTooltipOpen(isOpen);

    if (isOpen && autoAdvanceDelay > 0) {
      // Auto-dismiss after inactivity
      const timeout = setTimeout(() => {
        onSkip?.();
        setIsTooltipOpen(false);
      }, autoAdvanceDelay);

      timeoutRef.current = timeout;

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isOpen, autoAdvanceDelay, onSkip]);

  const handleNext = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsTooltipOpen(false);
    onNext?.();
  };

  const handleSkip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsTooltipOpen(false);
    onSkip?.();
  };

  const tooltipLabel = (
    <Box className="max-w-xs p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <button
          aria-label="Close tooltip"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          onClick={handleSkip}
        >
          <X size={14} />
        </button>
      </div>
      <p className="text-xs text-gray-600 mb-3">{description}</p>
      <div className="flex gap-2 justify-end">
        <Button onClick={handleSkip} size="xs" variant="subtle">
          Skip tutorial
        </Button>
        {onNext && (
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={handleNext}
            size="xs"
          >
            Got it!
          </Button>
        )}
      </div>
    </Box>
  );

  return (
    <Tooltip
      className="w-80"
      classNames={{
        tooltip: "!bg-white !text-gray-900 shadow-lg border border-gray-200",
      }}
      label={tooltipLabel}
      multiline
      opened={isTooltipOpen}
      position={position}
      withArrow
    >
      <div>{children}</div>
    </Tooltip>
  );
}
