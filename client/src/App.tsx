import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import AppRouter from "./routes/AppRouter"

// Create a single QueryClient instance for the whole app
// staleTime: 5 min — data is considered fresh for 5 minutes before refetching
// retry: 1 — retry failed requests once before showing an error
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  )
}

export default App
