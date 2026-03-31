import { BrowserRouter, Route, Routes } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"

const AppRouter = () => {
  return (
    <BrowserRouter>
    <Routes>

        <Route element={<ProtectedRoute />}>

        </Route>

    </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
