import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/features/auth/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AdminLayout } from "@/layouts/AdminLayout"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import DriversPage from "@/pages/DriversPage"
import LoadsPage from "@/pages/LoadsPage"
import VerificationPage from "@/pages/VerificationPage" 
import VacanciesPage from "@/pages/VacanciesPage"
import ProfilePage from "./pages/Profilepage"

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
              <Route path="/vacancies" element={<VacanciesPage />} />
              <Route path="/profile" element={<ProfilePage  />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
