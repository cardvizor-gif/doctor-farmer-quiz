import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import CabinetShell from "@/components/CabinetShell";
import PrivateWorkspaceGate from "./components/PrivateWorkspaceGate";
import type { PermissionCode } from "@shared/permissions";

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
  const privateCabinetPage = (Page: React.ComponentType, requiredPermission?: PermissionCode) => () => (
    <CabinetShell>
      <PrivateWorkspaceGate requiredPermission={requiredPermission}><Page /></PrivateWorkspaceGate>
    </CabinetShell>
  );
  const CabinetDashboard = cabinetPage(Dashboard);
  const CabinetAgroHelper = privateCabinetPage(AgroHelper, "agro.use");
  const CabinetKnowledgeBase = privateCabinetPage(KnowledgeBase, "knowledge.read");
  const CabinetHome = privateCabinetPage(Home, "quiz.use");
  const CabinetFarmWorkspace = privateCabinetPage(FarmWorkspace, "farms.read");
  const CabinetProposalBuilder = privateCabinetPage(ProposalBuilder, "proposals.read");
  const CabinetOrderRequests = privateCabinetPage(OrderRequests, "orders.read");
  const CabinetAccessRequests = cabinetPage(AccessRequests);
  const CabinetAdminPanel = privateCabinetPage(AdminPanel, "team.read");
  const CabinetSupportTickets = privateCabinetPage(SupportTickets, "support.create");

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
