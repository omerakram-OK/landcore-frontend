import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import SuperManLayout from "./layouts/SuperManLayout";
import LoginPage from "./features/auth/LoginPage";
import RequireAuth from "./components/RequireAuth";
import ComingSoonPage from "./components/ComingSoonPage";
import PlatformDashboardPage from "./features/superman-dashboard/PlatformDashboardPage";
import AdminsListPage from "./features/admins/AdminsListPage";
import SubscriptionsListPage from "./features/subscriptions/SubscriptionsListPage";
import EmployeesListPage from "./features/employees/EmployeesListPage";
import DesignationsListPage from "./features/designations/DesignationsListPage";
import SocietiesListPage from "./features/societies/SocietiesListPage";
import BlocksListPage from "./features/blocks/BlocksListPage";
import AgentsListPage from "./features/agents/AgentsListPage";
import LeadsListPage from "./features/leads/LeadsListPage";
import ClientsListPage from "./features/clients/ClientsListPage";
import PlotsListPage from "./features/plots/PlotsListPage";
import BookingsListPage from "./features/bookings/BookingsListPage";
import PaymentsListPage from "./features/payments/PaymentsListPage";
import BankAccountsListPage from "./features/bankAccounts/BankAccountsListPage";
import ApprovalsListPage from "./features/approvals/ApprovalsListPage";
import DocumentsListPage from "./features/documents/DocumentsListPage";
import ReportsPage from "./features/reports/ReportsPage";
import PlatformReportsPage from "./features/superman-reports/PlatformReportsPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

const ADMIN_MODULE_ROUTES: Array<{ path: string; title: string }> = [];

const SUPERMAN_MODULE_ROUTES: Array<{ path: string; title: string }> = [];

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/superman"
                element={
                  <RequireAuth roles={["SuperMan"]}>
                    <SuperManLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<PlatformDashboardPage />} />
                <Route path="admins" element={<AdminsListPage />} />
                <Route path="subscriptions" element={<SubscriptionsListPage />} />
                <Route path="reports" element={<PlatformReportsPage />} />
                {SUPERMAN_MODULE_ROUTES.map(({ path, title }) => (
                  <Route key={path} path={path} element={<ComingSoonPage title={title} />} />
                ))}
              </Route>

              <Route
                path="/"
                element={
                  <RequireAuth roles={["Admin", "Employee"]}>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="employees" element={<EmployeesListPage />} />
                <Route path="designations" element={<DesignationsListPage />} />
                <Route path="societies" element={<SocietiesListPage />} />
                <Route path="blocks" element={<BlocksListPage />} />
                <Route path="agents" element={<AgentsListPage />} />
                <Route path="leads" element={<LeadsListPage />} />
                <Route path="clients" element={<ClientsListPage />} />
                <Route path="plots" element={<PlotsListPage />} />
                <Route path="bookings" element={<BookingsListPage />} />
                <Route path="payments" element={<PaymentsListPage />} />
                <Route path="bank-accounts" element={<BankAccountsListPage />} />
                <Route path="approvals" element={<ApprovalsListPage />} />
                <Route path="documents" element={<DocumentsListPage />} />
                <Route path="reports" element={<ReportsPage />} />
                {ADMIN_MODULE_ROUTES.map(({ path, title }) => (
                  <Route key={path} path={path} element={<ComingSoonPage title={title} />} />
                ))}
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
