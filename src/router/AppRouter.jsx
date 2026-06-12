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

function AuthLoader({ children }) {
  const navigate = useNavigate()
  const { setUser, setLoading, loading } = useAuthStore()
  const { setProvider } = useProviderStore()

  useEffect(() => {
    async function init(session) {
      if (!session) { setLoading(false); return }
      setUser(session.user)
      try {
        const provider = await getProvider(session.user.id)
        setProvider(provider)
      } catch {
        // No provider record yet — send to onboarding
        navigate('/onboarding', { replace: true })
      }
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

function RequireAuth({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
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

          {/* Provider — auth required */}
          <Route path="/provider" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/provider/catalog" element={<RequireAuth><CatalogPage /></RequireAuth>} />
          <Route path="/provider/library" element={<RequireAuth><LibraryPage /></RequireAuth>} />
          <Route path="/provider/staff" element={<RequireAuth><StaffPage /></RequireAuth>} />
          <Route path="/provider/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />

          <Route path="/" element={<Navigate to="/provider" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthLoader>
    </BrowserRouter>
  )
}
