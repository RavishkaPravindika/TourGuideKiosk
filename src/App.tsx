import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { GuestLayout } from '@/components/layout/GuestLayout'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { BackupPage } from '@/pages/admin/BackupPage'
import { DestinationManagerPage } from '@/pages/admin/DestinationManagerPage'
import { DiagnosticsPage } from '@/pages/admin/DiagnosticsPage'
import { GuestContactsPage } from '@/pages/admin/GuestContactsPage'
import { JourneyManagerPage } from '@/pages/admin/JourneyManagerPage'
import { MediaManagerPage } from '@/pages/admin/MediaManagerPage'
import { TaxonomyManagerPage } from '@/pages/admin/TaxonomyManagerPage'
import { ContactPage } from '@/pages/guest/Contact/ContactPage'
import { DestinationDetailsPage } from '@/pages/guest/DestinationDetails/DestinationDetailsPage'
import { DiscoverPage } from '@/pages/guest/Discover/DiscoverPage'
import { ExplorePage } from '@/pages/guest/Explore/ExplorePage'
import { MyTripPage } from '@/pages/guest/MyTrip/MyTripPage'
import { NotFoundPage } from '@/pages/guest/NotFound/NotFoundPage'
import { WelcomePage } from '@/pages/guest/Welcome/WelcomePage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route element={<GuestLayout />}>
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/areas" element={<ExplorePage type="area" />} />
        <Route path="/categories" element={<ExplorePage type="category" />} />
        <Route path="/destination/:id" element={<DestinationDetailsPage />} />
        <Route path="/my-trip" element={<MyTripPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="destinations" element={<DestinationManagerPage />} />
        <Route path="areas" element={<TaxonomyManagerPage kind="area" />} />
        <Route path="categories" element={<TaxonomyManagerPage kind="category" />} />
        <Route path="journeys" element={<JourneyManagerPage />} />
        <Route path="guests" element={<GuestContactsPage />} />
        <Route path="media" element={<MediaManagerPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="diagnostics" element={<DiagnosticsPage />} />
        <Route path="backup" element={<BackupPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
