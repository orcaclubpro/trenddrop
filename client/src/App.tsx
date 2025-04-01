import { Route, Switch } from 'wouter';
import { Suspense, lazy } from 'react';
import Layout from '@/components/navigation/Layout';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { Toaster } from '@/components/ui/toaster';

// Lazy-loaded pages for better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Categories = lazy(() => import('@/pages/Categories'));
const Regions = lazy(() => import('@/pages/Regions'));
const AgentControl = lazy(() => import('@/pages/AgentControl'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <WebSocketProvider>
      <Layout>
        <Suspense fallback={<LoadingScreen />}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/products/:id">
              {params => <ProductDetail id={Number(params.id)} />}
            </Route>
            <Route path="/categories" component={Categories} />
            <Route path="/regions" component={Regions} />
            <Route path="/agent-control" component={AgentControl} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </Layout>
      <Toaster />
    </WebSocketProvider>
  );
}