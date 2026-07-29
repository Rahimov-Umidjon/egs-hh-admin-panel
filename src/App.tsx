import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/features/auth/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AdminLayout } from "@/layouts/AdminLayout"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import DriversPage from "@/pages/DriversPage"
import LoadsPage from "@/pages/LoadsPage"
import VerificationPage from "@/pages/VerificationPage"
import StatisticsPage from "@/pages/StatisticsPage"
import VacanciesPage from "@/pages/VacanciesPage"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/loads" element={<LoadsPage />} />
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/verification" element={<VerificationPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/vacancies" element={<VacanciesPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
