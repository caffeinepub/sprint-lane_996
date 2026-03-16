import ReactDOM from "react-dom/client";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent refetch on window focus to avoid loading state flickering
      refetchOnWindowFocus: false,
      // Prevent refetch when component remounts
      refetchOnMount: false,
      // Keep data fresh for longer
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1A1A1A",
            color: "#FFFFFF",
            border: "1px solid #333",
          },
        }}
      />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
