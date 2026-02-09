import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import AICopilot from "./pages/AICopilot";
import AICopilotConfig from "./pages/AICopilotConfig";
import AICentral from "./pages/AICentral";
import DentalinkSettings from "./pages/DentalinkSettings";
import DentalinkConversions from "@/pages/DentalinkConversions";
import ReportsPage from "@/pages/ReportsPage";
import AutoPilot from "@/pages/AutoPilot";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/ai-copilot"} component={AICopilot} />
      <Route path={"/ai-copilot/config"} component={AICopilotConfig} />
      <Route path={"/ai-central"} component={AICentral} />
      <Route path={"/dentalink-settings"} component={DentalinkSettings} />
      <Route path={"/dentalink-conversions"} component={DentalinkConversions} />
      <Route path={"/reports"} component={ReportsPage} />
      <Route path={"/auto-pilot"} component={AutoPilot} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
