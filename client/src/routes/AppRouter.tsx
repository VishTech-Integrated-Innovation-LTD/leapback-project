import { BrowserRouter, Route, Routes } from "react-router-dom"


import ProtectedRoute from "./ProtectedRoute"
import Layout from "../components/layout/Layout"

// Pages
import DashboardPage from "../components/pages/DashboardPage"
import LoginPage from "../components/pages/LoginPage"
import QuotesPage from "../components/pages/QuotesPage"
import QuoteDetailPage from "../components/pages/QuoteDetailPage"
import NewQuotePage from "../components/pages/NewQuotePage"


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
          <Route element={<Layout />} >
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/quotes" element={<QuotesPage />} />
            <Route path="/quotes/:id" element={<QuoteDetailPage />} />
            <Route path="/quotes/new" element={<NewQuotePage />} />

          </Route>

        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
