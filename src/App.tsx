
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Datenimport from "./pages/Datenimport";
import Einstellungen from "./pages/Einstellungen";
import Home1 from "./pages/Home1";
import Home2 from "./pages/Home2";
import PrioAuswaehlen from "./pages/PrioAuswaehlen";
import AbteilungAuswaehlen from "./pages/AbteilungAuswaehlen";
import ZusatzinfoAuswaehlen from "./pages/ZusatzinfoAuswaehlen";
import PrioFinalAuswaehlen from "./pages/PrioFinalAuswaehlen";
import Monitor from "./pages/Monitor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home1 />} />
          <Route path="/index" element={<Index />} />
          <Route path="/datenimport" element={<Datenimport />} />
          <Route path="/einstellungen" element={<Einstellungen />} />
          <Route path="/home1" element={<Home1 />} />
          <Route path="/home2" element={<Home2 />} />
          <Route path="/scanauftrag" element={<Home1 />} />
          <Route path="/prio-auswaehlen" element={<PrioAuswaehlen />} />
          <Route path="/abteilung-auswaehlen" element={<AbteilungAuswaehlen />} />
          <Route path="/zusatzinfo-auswaehlen" element={<ZusatzinfoAuswaehlen />} />
          <Route path="/prio-final-auswaehlen" element={<PrioFinalAuswaehlen />} />
          <Route path="/monitor" element={<Monitor />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
