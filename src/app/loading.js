import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-6" />
      <span className="text-lg font-semibold text-blue-200 mb-2">FeedTune</span>
      <span className="text-sm text-muted-foreground">
        Loading, please wait...
      </span>
    </div>
  );
}
