import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 text-center">
      <h1 className="text-9xl font-bold text-primary/20">404</h1>
      
      <div className="max-w-md mx-auto mb-8">
        <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <Button className="min-w-[150px]">
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </Link>
        
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
      
      <div className="mt-12 relative w-full max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search for products or categories..."
          className="w-full bg-background pl-10 pr-4 py-2 border rounded-md"
        />
      </div>
    </div>
  );
}