export function generateParticles() {
  return Array.from({ length: 12 }).map((_, i) => {
    const sizeClasses = ["w-4 h-4", "w-6 h-6", "w-8 h-8"];
    const sizeIndex = i % 3;
    const colorClass = i % 2 === 0 ? "bg-blue-500/50" : "bg-emerald-500/50";

    return {
      id: i,
      sizeClass: sizeClasses[sizeIndex],
      colorClass,
      isEven: i % 2 === 0,
      index: i,
    };
  });
}
