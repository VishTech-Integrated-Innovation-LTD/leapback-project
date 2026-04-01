import { BrowserRouter, Route, Routes } from "react-router-dom"


import ProtectedRoute from "./ProtectedRoute"
import Layout from "../components/layout/Layout"
import DashboardPage from "../components/pages/DashboardPage"

const AppRouter = () => {
  return (
    <BrowserRouter>
    <Routes>

        {/* <Route element={<ProtectedRoute />}> */}
        <Route element={<Layout />} >
                    <Route path="/dashboard"              element={<DashboardPage />} />
        

        </Route>

        {/* </Route> */}

    </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
