import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import CabinetShell from "@/components/CabinetShell";
import PrivateWorkspaceGate from "@/components/PrivateWorkspaceGate";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Home = lazy(() => import("./pages/Home"));
const AgroHelper = lazy(() => import("./pages/AgroHelper"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const FarmWorkspace = lazy(() => import("./pages/FarmWorkspace"));
const ProposalBuilder = lazy(() => import("./pages/ProposalBuilder"));
const OrderRequests = lazy(() => import("./pages/OrderRequests"));
const AccessRequests = lazy(() => import("./pages/AccessRequests"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const SupportTickets = lazy(() => import("./pages/SupportTickets"));
const ReferenceVariant = lazy(() => import("./pages/ReferenceVariant"));

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
  const privateCabinetPage = (Page: React.ComponentType) => () => (
    <CabinetShell>
      <PrivateWorkspaceGate><Page /></PrivateWorkspaceGate>
    </CabinetShell>
  );
  const CabinetFarmWorkspace = privateCabinetPage(FarmWorkspace);
  const CabinetProposalBuilder = privateCabinetPage(ProposalBuilder);
  const CabinetOrderRequests = privateCabinetPage(OrderRequests);
  const CabinetAccessRequests = cabinetPage(AccessRequests);
  const CabinetAdminPanel = cabinetPage(AdminPanel);
  const CabinetSupportTickets = privateCabinetPage(SupportTickets);

  return (
    <Switch>
      <Route path={"/"} component={CabinetDashboard} />
      <Route path={"/quiz"} component={CabinetHome} />
      <Route path={"/agro-helper"} component={CabinetAgroHelper} />
      <Route path={"/knowledge-base"} component={CabinetKnowledgeBase} />
      <Route path={"/farms"} component={CabinetFarmWorkspace} />
      <Route path={"/proposals/new"} component={CabinetProposalBuilder} />
      <Route path={"/order-requests"} component={CabinetOrderRequests} />
      <Route path={"/access-requests"} component={CabinetAccessRequests} />
      <Route path={"/admin"} component={CabinetAdminPanel} />
      <Route path={"/support"} component={CabinetSupportTickets} />
      <Route path={"/visual-variant"} component={ReferenceVariant} />
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
