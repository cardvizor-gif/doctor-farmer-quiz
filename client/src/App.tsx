import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Home = lazy(() => import("./pages/Home"));
const AgroHelper = lazy(() => import("./pages/AgroHelper"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));

function RouteFallback() {
  return (
    <main className="min-h-screen bg-[#f4f7f1] px-4 py-16 text-center text-sm font-medium text-[#194f38]">
      Загружаем материалы Doctor Farmer…
    </main>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/quiz"} component={Home} />
      <Route path={"/agro-helper"} component={AgroHelper} />
      <Route path={"/knowledge-base"} component={KnowledgeBase} />
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
