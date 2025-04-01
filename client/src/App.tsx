import { Route, Switch } from 'wouter';
import { Suspense, lazy } from 'react';
import { Dashboard } from '@/pages/Dashboard';
import { Layout } from '@/components/navigation/Layout';
import { LoadingScreen } from '@/components/ui/loading-screen';

// Lazy-loaded pages for better performance
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Categories = lazy(() => import('@/pages/Categories'));
const Regions = lazy(() => import('@/pages/Regions'));
const AgentControl = lazy(() => import('@/pages/AgentControl'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingScreen />}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/products/:id">
            {params => <ProductDetail id={Number(params.id)} />}
          </Route>
          <Route path="/categories" component={Categories} />
          <Route path="/regions" component={Regions} />
          <Route path="/agent" component={AgentControl} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}