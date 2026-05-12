"use client";

export function AnimatedPageBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <div
        className="absolute top-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: "10s" }}
      />
      <div
        className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: "12s" }}
      />
      <div
        className="absolute top-1/2 left-2/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: "14s" }}
      />
      <div
        className="absolute top-1/3 left-1/4 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: "16s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: "18s" }}
      />
    </div>
  );
}
