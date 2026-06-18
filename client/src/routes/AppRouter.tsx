import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"


import ProtectedRoute from "./ProtectedRoute"
import Layout from "../components/layout/Layout"
import RoleRoute from "./RoleRoute"

// Pages
import DashboardPage from '../components/pages/DashboardPage';
import LoginPage from '../components/pages/LoginPage';
import QuotesPage from '../components/pages/QuotesPage';
import QuoteDetailPage from '../components/pages/QuoteDetailPage';
import NewQuotePage from '../components/pages/NewQuotePage';
import EditQuotePage from '../components/pages/EditQuotePage';   // ← new
import ClientsPage from '../components/pages/ClientsPage';
import InventoryPage from '../components/pages/InventoryPage';
import InvoicesPage from '../components/pages/InvoicesPage';
import InvoiceDetailPage from '../components/pages/InvoiceDetailPage';
import SettingsPage from '../components/pages/SettingsPage';


// --------------------------------------------------------------------------------
// APP ROUTER
// All routes are defined here in one place
// Public routes:    accessible without a token (login only)
// Protected routes: wrapped in ProtectedRoute - redirect to / if no valid token
// Layout wraps all protected routes - renders sidebar + topbar around the page
// --------------------------------------------------------------------------------
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ---- Public ------------------------------------------------------ */}
        <Route path="/" element={<LoginPage />} />

        {/* --- Protected - all wrapped in Layout (sidebar + topbar) -------- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            {/* All roles */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/quotes" element={<QuotesPage />} />
            <Route path="/quotes/new" element={<NewQuotePage />} />
            <Route path="/quotes/:id" element={<QuoteDetailPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />

            {/* chief_admin only — edit draft quotes */}
            <Route element={<RoleRoute allowed={['chief_admin']} />}>
              <Route path="/quotes/:id/edit" element={<EditQuotePage />} />
            </Route>

            {/* admin + chief_admin only — finance pages */}
            <Route element={<RoleRoute allowed={['chief_admin', 'admin']} />}>
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Route>

        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
