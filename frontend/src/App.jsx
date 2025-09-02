import { Suspense, lazy, useState } from "react"
import LoadingScreen from "./components/Common/LoadingScreen"
import { useAuth } from "./context/AuthContext"
import { Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Auth/Login"
import Register from "./pages/Auth/Register"
import { Helmet } from "react-helmet-async"
import ProtectedRoute from "./components/Auth/ProtectedRoute"
import Layout from "./components/Layout/Layout"
import Dashboard from "./pages/Dashboard/Dashboard"

// Lazy load pages for better performance
const Tasks = lazy(() => import('./pages/Tasks/Tasks'))
const CreateTask = lazy(() => import('./pages/Tasks/CreateTask'))
const Projects = lazy(() => import('./pages/Project/Projects'))
const CreateProject = lazy(() => import('./pages/Project/CreateProject'))
const Team = lazy(() => import('./pages/Team/Team'))
const Reports = lazy(() => import('./pages/Reports/Reports'))
const TimeTracking = lazy(() => import('./pages/TimeTracking/TimeTracking'))
const Calendar = lazy(() => import('./pages/Calendar/Calendar'))
const Profile = lazy(() => import('./pages/Profile/Profile'))
const Plans = lazy(() => import('./pages/Subscription/Plans'))
const FeatureShowcase = lazy(() => import('./components/Subscription/FeatureShowcase'))
const Settings = lazy(() => import('./pages/Settings/Settings'))
const NotFound = lazy(() => import('./pages/NotFound/NotFound'))

// Import AI Assistant
import AIAssistant from './components/AI/AIAssistant'

const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="loading loading-spinner loading-lg text-primary"></div>
  </div>
)
function App(){
  const {user, loading} = useAuth()
  const [showAI, setShowAI] = useState(false)
  const [aiMinimized, setAiMinimized] = useState(false)

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
            
            {/* Tasks */}
            <Route path="tasks" element={<Tasks />} />
            <Route path="tasks/new" element={<CreateTask />} />
            <Route path="tasks/:id" element={<div>Task Details (TODO)</div>} />
            <Route path="tasks/:id/edit" element={<div>Edit Task (TODO)</div>} />
            
            {/* Projects */}
            <Route path="projects" element={<Projects />} />
            <Route path="projects/new" element={<CreateProject />} />
            <Route path="projects/:id" element={<div>Project Details (TODO)</div>} />
            <Route path="projects/:id/edit" element={<div>Edit Project (TODO)</div>} />
            
            {/* Team - Admin/Manager only */}
            <Route 
              path="team" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'manager']}>
                  <Team />
                </ProtectedRoute>
              } 
            />
            
            {/* Reports - Admin/Manager only */}
            <Route 
              path="reports" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'manager']}>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            
            {/* Time Tracking */}
            <Route path="time" element={<TimeTracking />} />
            
            {/* Calendar */}
            <Route path="calendar" element={<Calendar />} />
            
            {/* Profile */}
            <Route path="profile" element={<Profile />} />
            
            {/* Subscription */}
            <Route path="subscription/plans" element={<Plans />} />
            <Route path="subscription/features" element={<FeatureShowcase />} />
            <Route path="subscription" element={<Navigate to="/subscription/plans" replace />} />
            
            {/* Settings */}
            <Route path="settings" element={<Settings />} />
            
            {/* Search */}
            <Route path="search" element={<div>Search (TODO)</div>} />
          </Route>
          
          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      
      {/* AI Assistant - only show for authenticated users */}
      {user && (
        <>
          {/* AI Assistant Toggle Button */}
          {!showAI && (
            <button
              onClick={() => setShowAI(true)}
              className="fixed bottom-4 right-4 z-40 btn btn-primary btn-circle shadow-lg"
              title="Open AI Assistant"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </button>
          )}
          
          <AIAssistant
            isOpen={showAI}
            onClose={() => setShowAI(false)}
            onMinimize={() => setAiMinimized(!aiMinimized)}
            isMinimized={aiMinimized}
          />
        </>
      )}
    </>
  )
}

export default App