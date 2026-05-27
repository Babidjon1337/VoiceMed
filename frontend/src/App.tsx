/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import Landing from "./pages/Landing";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import PatientDetail from "./pages/PatientDetail";

export type ViewState = "landing" | "dashboard" | "patient";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>("landing");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  if (currentView === "landing") {
    return <Landing onStart={() => setCurrentView("dashboard")} />;
  }

  return (
    <AppLayout
      onViewChange={setCurrentView}
      currentView={currentView}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
    >
      {currentView === "dashboard" && (
        <Dashboard
          searchQuery={searchQuery}
          onSelectPatient={(id) => {
            setSelectedPatientId(id);
            setCurrentView("patient");
            setSearchQuery("");
          }}
        />
      )}
      {currentView === "patient" && (
        <PatientDetail
          patientId={selectedPatientId!}
          onBack={() => setCurrentView("dashboard")}
        />
      )}
    </AppLayout>
  );
}
