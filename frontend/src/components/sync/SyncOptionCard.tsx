import { Card, Text } from "@mantine/core";
import { Clock, Library, LucideIcon, Zap } from "lucide-react";

interface SyncOptionCardProps {
  description: string;
  duration: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  onClick: () => void;
  recommended?: boolean;
  title: string;
}

export function FullSyncCard({ onClick }: { onClick: () => void }) {
  return (
    <SyncOptionCard
      description="Sync your entire Spotify library (all tracks, albums, and playlists)"
      duration="~2-5 minutes"
      icon={Library}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      onClick={onClick}
      title="Full Sync"
    />
  );
}

export function QuickSyncCard({ onClick }: { onClick: () => void }) {
  return (
    <SyncOptionCard
      description="Sync 50 tracks and 10 albums to try features instantly"
      duration="~30 seconds"
      icon={Zap}
      iconBgColor="bg-orange-100"
      iconColor="text-orange-600"
      onClick={onClick}
      recommended
      title="Quick Sync"
    />
  );
}

export function SyncOptionCard({
  description,
  duration,
  icon: Icon,
  iconBgColor,
  iconColor,
  onClick,
  recommended,
  title,
}: SyncOptionCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-orange-500"
      onClick={onClick}
      padding="lg"
      radius="md"
      shadow="sm"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 ${iconBgColor} rounded-lg`}>
          <Icon className={iconColor} size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Text className="text-lg font-semibold">{title}</Text>
            {recommended && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Recommended
              </span>
            )}
          </div>
          <Text className="text-sm text-gray-600 mb-2">{description}</Text>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>{duration}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
