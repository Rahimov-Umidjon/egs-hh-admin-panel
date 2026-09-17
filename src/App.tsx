import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { APIProvider } from "@vis.gl/react-google-maps"
import { AuthProvider } from "@/features/auth/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AdminLayout } from "@/layouts/AdminLayout"
import { ClientLayout } from "@/layouts/ClientLayout"
import LoginPage from "@/pages/LoginPage"

const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const DriversPage = lazy(() => import("@/pages/DriversPage"))
const LoadsPage = lazy(() => import("@/pages/LoadsPage"))
const VerificationPage = lazy(() => import("@/pages/VerificationPage"))
const VacanciesPage = lazy(() => import("@/pages/VacanciesPage"))
const ProfilePage = lazy(() => import("./pages/Profilepage"))
const ApplicationsPage = lazy(() => import("./pages/ApplicationsPage"))
const ApplicationShowPage = lazy(() => import("./pages/ApplicationResumePage"))
const VacancyDetailPage = lazy(() => import("./pages/Vacancydetailpage"))
const EmployeesPage = lazy(() => import("./pages/EmployeesPage"))
const VehiclesPage = lazy(() => import("./pages/VehiclesPage"))
const ChatPage = lazy(() => import("./pages/ChatPage"))
const ClientDashboardPage = lazy(() => import("./pages/ClientDashboardPage"))
const ClientProfilePage = lazy(() => import("./pages/ClientProfilePage"))
const CargoListPage = lazy(() => import("./pages/CargoListPage"))
const CargoFormPage = lazy(() => import("./pages/CargoFormPage"))
const CargoDetailPage = lazy(() => import("./pages/CargoDetailPage"))

function App() {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ""}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense
            fallback={
              <div className="flex h-screen items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute allow="carrier" />}>
                <Route element={<AdminLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/loads" element={<LoadsPage />} />
                  <Route path="/drivers" element={<DriversPage />} />
                  <Route path="/verification" element={<VerificationPage />} />
                  <Route path="/vacancies" element={<VacanciesPage />} />
                  <Route path="/vacancies/:id" element={<VacancyDetailPage />} />
                  <Route path="/aplications" element={<ApplicationsPage />} />
                  <Route path="/carrier/applications/:id" element={<ApplicationShowPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/vehicles" element={<VehiclesPage />} />
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute allow="client" />}>
                <Route element={<ClientLayout />}>
                  <Route path="/client" element={<ClientDashboardPage />} />
                  <Route path="/client/profile" element={<ClientProfilePage />} />
                  <Route path="/client/cargos" element={<CargoListPage />} />
                  <Route path="/client/cargos/new" element={<CargoFormPage />} />
                  <Route path="/client/cargos/:id" element={<CargoDetailPage />} />
                  <Route path="/client/cargos/:id/edit" element={<CargoFormPage />} />
                  <Route path="/client/chat" element={<ChatPage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </APIProvider>
  )
}

export default App