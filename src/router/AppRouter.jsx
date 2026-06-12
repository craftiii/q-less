import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase.js'
import { getProvider } from '../services/providerService.js'
import { useAuthStore } from '../store/authStore.js'
import { useProviderStore } from '../store/providerStore.js'
import { Spinner } from '../components/ui/Spinner.jsx'

import CheckInPage from '../pages/customer/CheckInPage.jsx'
import QueueStatusPage from '../pages/customer/QueueStatusPage.jsx'
import NotificationPage from '../pages/customer/NotificationPage.jsx'
import DashboardPage from '../pages/provider/DashboardPage.jsx'
import CatalogPage from '../pages/provider/CatalogPage.jsx'
import LibraryPage from '../pages/provider/LibraryPage.jsx'
import StaffPage from '../pages/provider/StaffPage.jsx'
import SettingsPage from '../pages/provider/SettingsPage.jsx'
import LoginPage from '../pages/auth/LoginPage.jsx'
import SignupPage from '../pages/auth/SignupPage.jsx'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx'
import OnboardingPage from '../pages/auth/OnboardingPage.jsx'
import AccountPage from '../pages/auth/AccountPage.jsx'
import StaffDashboardPage from '../pages/staff/StaffDashboardPage.jsx'
import StaffProfilePage from '../pages/staff/StaffProfilePage.jsx'
import AcceptInvitePage from '../pages/staff/AcceptInvitePage.jsx'

function AuthLoader({ children }) {
  const navigate = useNavigate()
  const { setUser, setRole, setStaffProfile, setLoading, loading } = useAuthStore()
  const { setProvider } = useProviderStore()

  useEffect(() => {
    async function init(session) {
      if (!session) { setLoading(false); return }

      setUser(session.user)

      // Check if admin (provider)
      try {
        const provider = await getProvider(session.user.id)
        setProvider(provider)
        setRole('admin')
        setLoading(false)
        return
      } catch { /* not an admin */ }

      // Check if staff
      const { data: staffRow } = await supabase.rpc('get_my_staff_profile')
      if (staffRow) {
        if (staffRow.is_suspended) {
          await supabase.auth.signOut()
          navigate('/login?error=suspended', { replace: true })
          setLoading(false)
          return
        }
        setStaffProfile(staffRow)
        setRole('staff')
        setLoading(false)
        return
      }

      // Neither — send to onboarding (new provider signup)
      navigate('/onboarding', { replace: true })
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => init(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      init(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return children
}

function RequireAdmin({ children }) {
  const { user, role, loading } = useAuthStore()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (role === 'staff') return <Navigate to="/staff" replace />
  return children
}

function RequireStaff({ children }) {
  const { user, role, loading } = useAuthStore()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (role === 'admin') return <Navigate to="/provider" replace />
  return children
}

function RootRedirect() {
  const { user, role, loading } = useAuthStore()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (role === 'staff') return <Navigate to="/staff" replace />
  return <Navigate to="/provider" replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthLoader>
        <Routes>
          {/* Customer — no auth */}
          <Route path="/check-in/:qrToken" element={<CheckInPage />} />
          <Route path="/status/:customerToken" element={<QueueStatusPage />} />
          <Route path="/notify/:customerToken" element={<NotificationPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/staff/accept-invite" element={<AcceptInvitePage />} />

          {/* Admin */}
          <Route path="/provider" element={<RequireAdmin><DashboardPage /></RequireAdmin>} />
          <Route path="/provider/catalog" element={<RequireAdmin><CatalogPage /></RequireAdmin>} />
          <Route path="/provider/library" element={<RequireAdmin><LibraryPage /></RequireAdmin>} />
          <Route path="/provider/staff" element={<RequireAdmin><StaffPage /></RequireAdmin>} />
          <Route path="/provider/settings" element={<RequireAdmin><SettingsPage /></RequireAdmin>} />
          <Route path="/account" element={<RequireAdmin><AccountPage /></RequireAdmin>} />

          {/* Staff */}
          <Route path="/staff" element={<RequireStaff><StaffDashboardPage /></RequireStaff>} />
          <Route path="/staff/profile" element={<RequireStaff><StaffProfilePage /></RequireStaff>} />

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthLoader>
    </BrowserRouter>
  )
}
