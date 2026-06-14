import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './guards/AuthGuard.js';
import { AppShell } from '../components/layout/AppShell.js';
import { LandingPage } from '../pages/marketing/LandingPage.js';
import { LoginPage } from '../pages/auth/LoginPage.js';
import { SignupPage } from '../pages/auth/SignupPage.js';
import { DashboardPage } from '../pages/app/DashboardPage.js';
import { CampaignsPage } from '../pages/app/CampaignsPage.js';
import { CampaignDetailPage } from '../pages/app/CampaignDetailPage.js';
import { CampaignComposerPage } from '../pages/app/CampaignComposerPage.js';
import { ContactsPage } from '../pages/app/ContactsPage.js';
import { SettingsPage } from '../pages/app/SettingsPage.js';
import { UpgradePage } from '../pages/app/UpgradePage.js';
import { SegmentsPage } from '../pages/app/SegmentsPage.js';
import { SegmentDetailPage } from '../pages/app/SegmentDetailPage.js';
import { AnalyticsPage } from '../pages/app/AnalyticsPage.js';
import { EventStreamPage } from '../pages/app/EventStreamPage.js';

export function AppRoutes() {
  return (
    <Routes>
      {/* Marketing */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected app shell */}
      <Route element={<AuthGuard />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/new" element={<CampaignComposerPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/segments" element={<SegmentsPage />} />
          <Route path="/segments/:id" element={<SegmentDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/events" element={<EventStreamPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
