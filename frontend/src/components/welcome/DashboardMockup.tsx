import { Card, Text } from "@mantine/core";
import { Disc3, Music, Star } from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="w-full max-w-6xl pt-8 sm:pt-16 animate-in fade-in duration-700 delay-300 px-4">
      <Text className="text-center text-dark-1 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 uppercase tracking-wider">
        See Your Library Come to Life
      </Text>
      <Card className="bg-dark-7 bg-opacity-50 backdrop-blur-sm border border-dark-4 p-2 sm:p-4">
        <div className="aspect-video bg-gradient-to-br from-dark-8 to-dark-9 rounded-lg flex items-center justify-center relative overflow-hidden border border-dark-5">
          {/* Mockup Grid Visualization - Hidden on mobile, simplified view */}
          <div className="hidden md:block absolute inset-0 p-4 lg:p-8">
            <div className="grid grid-cols-3 gap-2 lg:gap-4 h-full">
              {/* Left Column - Stats */}
              <div className="space-y-2 lg:space-y-4">
                <div className="h-20 lg:h-24 bg-dark-6 rounded-lg border border-dark-5 p-2 lg:p-4 flex flex-col justify-center">
                  <Music className="text-orange-500 mb-1 lg:mb-2" size={20} />
                  <div className="h-1 lg:h-2 bg-dark-5 rounded w-3/4 mb-1" />
                  <div className="h-2 lg:h-4 bg-orange-500 bg-opacity-30 rounded w-1/2" />
                </div>
                <div className="h-20 lg:h-24 bg-dark-6 rounded-lg border border-dark-5 p-2 lg:p-4 flex flex-col justify-center">
                  <Disc3 className="text-orange-500 mb-1 lg:mb-2" size={20} />
                  <div className="h-1 lg:h-2 bg-dark-5 rounded w-3/4 mb-1" />
                  <div className="h-2 lg:h-4 bg-orange-500 bg-opacity-30 rounded w-1/2" />
                </div>
              </div>

              {/* Middle Column - Tracks */}
              <div className="col-span-2 space-y-1 lg:space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    className="h-12 lg:h-16 bg-dark-6 rounded-lg border border-dark-5 p-2 lg:p-3 flex items-center gap-2 lg:gap-3"
                    key={i}
                  >
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-500 bg-opacity-20 rounded flex items-center justify-center flex-shrink-0">
                      <Music className="text-orange-400" size={14} />
                    </div>
                    <div className="flex-1 space-y-1 lg:space-y-2 min-w-0">
                      <div className="h-1 lg:h-2 bg-dark-5 rounded w-3/4" />
                      <div className="h-1 lg:h-2 bg-dark-5 rounded w-1/2" />
                    </div>
                    <div className="flex gap-0.5 lg:gap-1 flex-shrink-0">
                      {[...Array(i)].map((_, idx) => (
                        <Star
                          className="text-orange-500"
                          fill="currentColor"
                          key={idx}
                          size={10}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile simplified view */}
          <div className="md:hidden absolute inset-0 p-4 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Music className="text-orange-500 mx-auto" size={48} />
              <Text className="text-dark-1 text-sm">
                Beautiful dashboard visualization
              </Text>
            </div>
          </div>

          {/* Overlay Label */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-9 via-transparent to-transparent flex items-end justify-center pb-4 sm:pb-8">
            <div className="bg-dark-6 bg-opacity-80 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-orange-500 border-opacity-30">
              <Text className="text-orange-300 text-xs sm:text-sm font-medium">
                Your personalized music dashboard
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
