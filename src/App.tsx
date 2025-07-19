import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Calendar from "./pages/Calendar";
import Data from "./pages/Data";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { EntriesProvider } from "./context/EntriesContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <EntriesProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Calendar />} />
              <Route path="data" element={<Data />} />
              <Route path="dashboard" element={<Dashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </EntriesProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;