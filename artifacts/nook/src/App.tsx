import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Switch, Route, Router as WouterRouter } from 'wouter';
import { ToastProvider } from '@/components/Toast';
import LandingPage from '@/pages/LandingPage';
import MapPage from '@/pages/MapPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import LibrarianPage from '@/pages/LibrarianPage';
import CheckinPage from '@/pages/CheckinPage';
import QRCodesPage from '@/pages/QRCodesPage';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 0 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/librarian" component={LibrarianPage} />
      <Route path="/checkin/:deskId" component={CheckinPage} />
      <Route path="/qrcodes" component={QRCodesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
