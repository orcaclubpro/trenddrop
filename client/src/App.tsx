import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import TrendingProducts from "@/pages/trending-products";
import GeographicTrends from "@/pages/geographic-trends";
import MarketingVideos from "@/pages/marketing-videos";
import Settings from "@/pages/settings";
import Sidebar from "@/components/sidebar";
import { ReactNode } from "react";

// Layout component to wrap all pages with sidebar
function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <Layout>
          <Dashboard />
        </Layout>
      )} />
      <Route path="/trendtracker" component={() => (
        <Layout>
          <Dashboard />
        </Layout>
      )} />
      <Route path="/trending-products" component={() => (
        <Layout>
          <TrendingProducts />
        </Layout>
      )} />
      <Route path="/geographic-trends" component={() => (
        <Layout>
          <GeographicTrends />
        </Layout>
      )} />
      <Route path="/marketing-videos" component={() => (
        <Layout>
          <MarketingVideos />
        </Layout>
      )} />
      <Route path="/settings" component={() => (
        <Layout>
          <Settings />
        </Layout>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
