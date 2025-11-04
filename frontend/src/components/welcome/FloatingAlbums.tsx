import { Star } from "lucide-react";

export function FloatingAlbums() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {[...Array(12)].map((_, i) => {
        const size = 60 + Math.random() * 80;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = i * 0.5;
        const duration = 8 + Math.random() * 4;

        return (
          <div
            className="absolute rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-700/20 border border-orange-500/30 backdrop-blur-sm"
            key={i}
            /* eslint-disable-next-line react/forbid-dom-props */
            style={{
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              animationIterationCount: "infinite",
              animationName: "float",
              animationTimingFunction: "ease-in-out",
              height: `${size}px`,
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
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
