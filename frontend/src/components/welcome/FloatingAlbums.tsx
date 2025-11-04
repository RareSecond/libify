import { Star } from "lucide-react";

// Deterministic positions based on index to avoid hydration issues
const albumPositions = [
  { duration: 10, left: 10, size: 80, top: 20 },
  { duration: 12, left: 85, size: 120, top: 15 },
  { duration: 9, left: 20, size: 90, top: 70 },
  { duration: 11, left: 75, size: 100, top: 60 },
  { duration: 10, left: 50, size: 70, top: 10 },
  { duration: 12, left: 30, size: 110, top: 45 },
  { duration: 9, left: 90, size: 85, top: 80 },
  { duration: 11, left: 15, size: 95, top: 50 },
  { duration: 10, left: 60, size: 75, top: 85 },
  { duration: 12, left: 40, size: 105, top: 25 },
  { duration: 9, left: 70, size: 80, top: 40 },
  { duration: 11, left: 25, size: 90, top: 90 },
];

export function FloatingAlbums() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {albumPositions.map((position, i) => {
        const delay = i * 0.5;

        return (
          <div
            className="absolute rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-700/20 border border-orange-500/30 backdrop-blur-sm"
            key={i}
            /* eslint-disable-next-line react/forbid-dom-props */
            style={{
              animationDelay: `${delay}s`,
              animationDuration: `${position.duration}s`,
              animationIterationCount: "infinite",
              animationName: "float",
              animationTimingFunction: "ease-in-out",
              height: `${position.size}px`,
              left: `${position.left}%`,
              top: `${position.top}%`,
              width: `${position.size}px`,
              zIndex: 0,
            }}
          >
            {/* Star rating overlay on some */}
            {i % 3 === 0 && (
              <div className="absolute -bottom-2 -right-2 flex gap-0.5 bg-dark-8 rounded-full px-2 py-1 border border-orange-500/50">
                {[...Array(5)].map((_, idx) => (
                  <Star
                    className="text-orange-400"
                    fill="currentColor"
                    key={idx}
                    size={8}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
