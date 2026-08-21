import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import CorporateAuthGate from "./components/CorporateAuthGate";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import AgroHelper from "./pages/AgroHelper";
import KnowledgeBase from "./pages/KnowledgeBase";
import { Toaster } from "@/components/ui/sonner";
function Router() {
  // make sure to consider if you need authentication for certain routes
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
          <CorporateAuthGate>
            <Router />
          </CorporateAuthGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
