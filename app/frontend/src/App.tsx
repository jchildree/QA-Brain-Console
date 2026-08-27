import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthGate } from './components/AuthGate';
import { ThemeProvider } from './context/ThemeContext';
import { Overview } from './pages/Overview';
import { SopDashboard } from './pages/SopDashboard';
import { SopEditor } from './pages/SopEditor';
import { SopIntake } from './pages/SopIntake';
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
import { MeetingDashboard } from './pages/MeetingDashboard';
import { MeetingEditor } from './pages/MeetingEditor';
import { MeetingIntake } from './pages/MeetingIntake';
import { SettingsPage } from './pages/SettingsPage';
import { EvidenceLibraryPage } from './pages/EvidenceLibraryPage';
import { TrashPage } from './pages/TrashPage';
import { NotesDashboard } from './pages/NotesDashboard';
import { NoteEditor } from './pages/NoteEditor';
import { NoteIntake } from './pages/NoteIntake';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { OnboardingProvider } from './context/OnboardingContext';
import { OnboardingModal } from './components/OnboardingModal';

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

function MeetingEditorRoute() {
  const { filename } = useParams<{ filename: string }>();
  if (!filename) return null;
  return <MeetingEditor filename={filename} />;
}

function NoteEditorRoute() {
  const { filename } = useParams<{ filename: string }>();
  if (!filename) return null;
  return <NoteEditor filename={filename} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthGate>
          <OnboardingProvider>
            <AppShell>
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/sop" element={<SopDashboard />} />
                <Route path="/sop/new" element={<SopIntake />} />
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
                <Route path="/meeting" element={<MeetingDashboard />} />
                <Route path="/meeting/new" element={<MeetingIntake />} />
                <Route path="/meeting/:filename" element={<MeetingEditorRoute />} />
                <Route path="/notes" element={<NotesDashboard />} />
                <Route path="/notes/new" element={<NoteIntake />} />
                <Route path="/notes/:filename" element={<NoteEditorRoute />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/evidence" element={<EvidenceLibraryPage />} />
                <Route path="/trash" element={<TrashPage />} />
              </Routes>
            </AppShell>
            <OnboardingModal />
          </OnboardingProvider>
        </AuthGate>
      </BrowserRouter>
    </ThemeProvider>
  );
}
