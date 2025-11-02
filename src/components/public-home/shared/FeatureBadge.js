"use client";

export function FeatureBadge({ icon, label }) {
  return (
    <div className="flex items-center gap-1 md:gap-2 justify-center p-2 md:p-4 rounded-lg bg-card/50 backdrop-blur-sm">
      <span className="text-primary">{icon}</span>
      <span className="text-[10px] md:text-sm font-medium">{label}</span>
    </div>
  );
}
