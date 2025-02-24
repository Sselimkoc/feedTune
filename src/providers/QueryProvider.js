import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import dynamic from 'next/dynamic';

export function QueryProvider({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

// Dynamic import for devtools only in development
let ReactQueryDevtools;
if (process.env.NODE_ENV === 'development') {
  ReactQueryDevtools = dynamic(() =>
    import('@tanstack/react-query-devtools').then(mod => mod.ReactQueryDevtools)
  );
} 