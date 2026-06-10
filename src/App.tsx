import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import FormPage from './pages/FormPage';
import SuccessPage from './pages/SuccessPage';
import ChecklistPage from './pages/ChecklistPage';
import FeedbackPage from './pages/FeedbackPage';
import DocumentsPage from './pages/DocumentsPage';
import EditRegistrationPage from './pages/EditRegistrationPage';
import HealthSafetyLandingPage from './pages/HealthSafetyLandingPage';
import HSFormPage from './pages/HSFormPage';
import HSPlanPage from './pages/HSPlanPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/form" element={<FormPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/edit-registration" element={<EditRegistrationPage />} />
          <Route path="/health-safety" element={<HealthSafetyLandingPage />} />
          <Route path="/health-safety/form" element={<HSFormPage />} />
          <Route path="/health-safety/plan" element={<HSPlanPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
