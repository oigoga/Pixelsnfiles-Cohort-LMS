import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/shared/ProtectedRoute'

import Login from './pages/auth/Login'
import StudentLayout from './components/layout/StudentLayout'
import CoachLayout from './components/layout/CoachLayout'

// Student pages
import StudentDashboard from './pages/student/Dashboard'
import ModuleView from './pages/student/ModuleView'
import TaskView from './pages/student/TaskView'
import PeerReviewQueue from './pages/student/PeerReviewQueue'
import GroupHub from './pages/student/GroupHub'

// Coach pages
import OverviewBoard from './pages/coach/OverviewBoard'
import RiskBoard from './pages/coach/RiskBoard'
import StudentDetail from './pages/coach/StudentDetail'
import VerificationQueue from './pages/coach/VerificationQueue'
import ModuleManager from './pages/coach/ModuleManager'
import AnnouncementsManager from './pages/coach/AnnouncementsManager'
import CohortSetup from './pages/coach/CohortSetup'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Student routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="module/:moduleId" element={<ModuleView />} />
            <Route path="task/:taskId" element={<TaskView />} />
            <Route path="review" element={<PeerReviewQueue />} />
            <Route path="group" element={<GroupHub />} />
          </Route>

          {/* Coach routes */}
          <Route
            path="/coach"
            element={
              <ProtectedRoute role="coach">
                <CoachLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewBoard />} />
            <Route path="risk" element={<RiskBoard />} />
            <Route path="student/:studentId" element={<StudentDetail />} />
            <Route path="verify" element={<VerificationQueue />} />
            <Route path="modules" element={<ModuleManager />} />
            <Route path="announcements" element={<AnnouncementsManager />} />
            <Route path="cohort" element={<CohortSetup />} />
          </Route>

          {/* Catch-all: redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
