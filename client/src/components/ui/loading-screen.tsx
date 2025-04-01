import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-medium">Loading...</h2>
        <p className="text-muted-foreground">Please wait while we prepare your data</p>
      </div>
    </div>
  );
}