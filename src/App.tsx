import { AppProvider, useApp } from "./context/AppContext";
import { AppShell } from "./components/layout/AppShell";
import { ProfileGate } from "./views/ProfileGate";
import { Dashboard } from "./views/Dashboard";
import { Finances } from "./views/Finances";
import { AnnualTable } from "./views/AnnualTable";
import { Calendar } from "./views/Calendar";
import { Goals } from "./views/Goals";
import { Reports } from "./views/Reports";
import { Settings } from "./views/Settings";

const ActiveView = () => {
  const { activeView } = useApp();

  switch (activeView) {
    case "finances":
      return <Finances />;
    case "annual":
      return <AnnualTable />;
    case "calendar":
      return <Calendar />;
    case "goals":
      return <Goals />;
    case "reports":
      return <Reports />;
    case "settings":
      return <Settings />;
    case "dashboard":
    default:
      return <Dashboard />;
  }
};

const AppContent = () => {
  const { currentProfile } = useApp();

  if (!currentProfile) return <ProfileGate />;

  return (
    <AppShell>
      <ActiveView />
    </AppShell>
  );
};

export const App = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);
