import { Link } from 'wouter';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4">
      <div className="mb-6 bg-amber-100 text-amber-700 p-4 rounded-full">
        <AlertTriangle size={48} />
      </div>
      <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <a className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90">
          <Home className="h-4 w-4" />
          Go to Dashboard
        </a>
      </Link>
    </div>
  );
}