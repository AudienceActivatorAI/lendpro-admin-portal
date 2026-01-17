import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./lib/trpc";
import { Route, Switch } from "wouter";
import Dashboard from "./pages/Dashboard";
import CreateClient from "./pages/CreateClient";
import "./index.css";

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/clients/create" component={CreateClient} />
            <Route>404 - Not Found</Route>
          </Switch>
        </div>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
