import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import CabinetShell from "@/components/CabinetShell";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Home = lazy(() => import("./pages/Home"));
const AgroHelper = lazy(() => import("./pages/AgroHelper"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const FarmWorkspace = lazy(() => import("./pages/FarmWorkspace"));
const ProposalBuilder = lazy(() => import("./pages/ProposalBuilder"));

function RouteFallback() {
  return (
    <main className="min-h-screen bg-[#f4f7f1] px-4 py-16 text-center text-sm font-medium text-[#194f38]">
      Загружаем материалы Doctor Farmer…
    </main>
  );
}

function Router() {
  const cabinetPage = (Page: React.ComponentType) => () => <CabinetShell><Page /></CabinetShell>;
  const CabinetDashboard = cabinetPage(Dashboard);
  const CabinetHome = cabinetPage(Home);
  const CabinetAgroHelper = cabinetPage(AgroHelper);
  const CabinetKnowledgeBase = cabinetPage(KnowledgeBase);
  const CabinetFarmWorkspace = cabinetPage(FarmWorkspace);
  const CabinetProposalBuilder = cabinetPage(ProposalBuilder);

  return (
    <Switch>
      <Route path={"/"} component={CabinetDashboard} />
      <Route path={"/quiz"} component={CabinetHome} />
      <Route path={"/agro-helper"} component={CabinetAgroHelper} />
      <Route path={"/knowledge-base"} component={CabinetKnowledgeBase} />
      <Route path={"/farms"} component={CabinetFarmWorkspace} />
      <Route path={"/proposals/new"} component={CabinetProposalBuilder} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<RouteFallback />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
