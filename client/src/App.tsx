import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import AppRouter from "./routes/AppRouter"
import { Analytics } from "@vercel/analytics/react";

// Create a single QueryClient instance for the whole app
// staleTime: 5 min — data is considered fresh for 5 minutes before refetching
// retry: 1 — retry failed requests once before showing an error
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: 5 * 60 * 1000,
      staleTime: 30 * 1000,  // 30s - data refreshes more frequently
      retry: 1,
      refetchOnWindowFocus: true
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Analytics />
    </QueryClientProvider>
  )
}

export default App
