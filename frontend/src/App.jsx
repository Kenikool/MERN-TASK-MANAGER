

  // Loading fallback component

import { Suspense } from "react"
import LoadingScreen from "./components/Common/LoadingScreen"
import { useAuth } from "./context/AuthContext"
import { Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Auth/Login"
import { Helmet } from "react-helmet-async"
import ProtectedRoute from "./components/Auth/ProtectedRoute"
import Layout from "./components/Layout/Layout"
import Dashboard from "./pages/Dashboard/Dashboard"
import Register from "./pages/Auth/Register"

const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="loading loading-spinner loading-lg text-primary"></div>
  </div>
)
function App(){

const {user, loading} = useAuth()


  if (loading) {
  return <LoadingScreen/>
}
  return(
    <>
     <Helmet>
        <title>Task Management - Professional Project Management</title>
        <meta name="description" content="Streamline your workflow with our professional task management application featuring AI-powered insights and team collaboration tools." />
      </Helmet>
    
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={user ? <Navigate to={"/dashboard"} replace /> : <Login />} />
          
          <Route path="/register" element={user ? <Navigate to={"/dashboard"} replace /> : <Register />} />
          
          <Route path="/login" element={user ? <Navigate to={"/dashboard"} replace/> :<Login />} />

          {/* Private Routes */}

           <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
      </Routes>
      </Suspense>
    </>
  )
}

export default App