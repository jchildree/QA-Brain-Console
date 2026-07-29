import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthGate } from './components/AuthGate';
import { ThemeProvider } from './context/ThemeContext';
import { Overview } from './pages/Overview';
import { Dashboard } from './pages/Dashboard';
import { SopEditor } from './pages/SopEditor';
import { Intake } from './pages/Intake';
import { CapDashboard } from './pages/CapDashboard';
import { CapEditor } from './pages/CapEditor';
import { CapIntake } from './pages/CapIntake';
import { IncidentDashboard } from './pages/IncidentDashboard';
import { IncidentEditor } from './pages/IncidentEditor';
import { IncidentIntake } from './pages/IncidentIntake';
import { ChangeDashboard } from './pages/ChangeDashboard';
import { ChangeEditor } from './pages/ChangeEditor';
import { ChangeIntake } from './pages/ChangeIntake';
import { AuditDashboard } from './pages/AuditDashboard';
import { AuditEditor } from './pages/AuditEditor';
import { AuditIntake } from './pages/AuditIntake';
import { TrainingDashboard } from './pages/TrainingDashboard';
import { TrainingEditor } from './pages/TrainingEditor';
import { TrainingIntake } from './pages/TrainingIntake';
import { SettingsPage } from './pages/SettingsPage';
import { EvidenceLibraryPage } from './pages/EvidenceLibraryPage';

function SopEditorRoute() {
  const { filename } = useParams<{ filename: string }>();
  if (!filename) return null;
  return <SopEditor filename={filename} />;
}

function CapEditorRoute() {
  const { filename } = useParams<{ filename: string }>();
  if (!filename) return null;
  return <CapEditor filename={filename} />;
}

function IncidentEditorRoute() {
  const { filename } = useParams<{ filename: string }>();
  if (!filename) return null;
  return <IncidentEditor filename={filename} />;
}

function ChangeEditorRoute() {
  const { filename } = useParams<{ filename: string }>();
  if (!filename) return null;
  return <ChangeEditor filename={filename} />;
}

function AuditEditorRoute() {
  const { filename } = useParams<{ filename: string }>();
  if (!filename) return null;
  return <AuditEditor filename={filename} />;
}

function TrainingEditorRoute() {
  const { filename } = useParams<{ filename: string }>();
  if (!filename) return null;
  return <TrainingEditor filename={filename} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthGate>
          <AppShell>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/sop" element={<Dashboard />} />
              <Route path="/sop/new" element={<Intake />} />
              <Route path="/sop/:filename" element={<SopEditorRoute />} />
              <Route path="/cap" element={<CapDashboard />} />
              <Route path="/cap/new" element={<CapIntake />} />
              <Route path="/cap/:filename" element={<CapEditorRoute />} />
              <Route path="/incident" element={<IncidentDashboard />} />
              <Route path="/incident/new" element={<IncidentIntake />} />
              <Route path="/incident/:filename" element={<IncidentEditorRoute />} />
              <Route path="/change" element={<ChangeDashboard />} />
              <Route path="/change/new" element={<ChangeIntake />} />
              <Route path="/change/:filename" element={<ChangeEditorRoute />} />
              <Route path="/audit" element={<AuditDashboard />} />
              <Route path="/audit/new" element={<AuditIntake />} />
              <Route path="/audit/:filename" element={<AuditEditorRoute />} />
              <Route path="/training" element={<TrainingDashboard />} />
              <Route path="/training/new" element={<TrainingIntake />} />
              <Route path="/training/:filename" element={<TrainingEditorRoute />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/evidence" element={<EvidenceLibraryPage />} />
            </Routes>
          </AppShell>
        </AuthGate>
      </BrowserRouter>
    </ThemeProvider>
  );
}
