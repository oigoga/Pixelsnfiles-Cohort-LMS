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
import Announcements from './pages/student/Announcements'
import Leaderboard from './pages/Leaderboard'
import QandA from './pages/QandA'

// Coach pages
import OverviewBoard from './pages/coach/OverviewBoard'
import RiskBoard from './pages/coach/RiskBoard'
import StudentDetail from './pages/coach/StudentDetail'
import VerificationQueue from './pages/coach/VerificationQueue'
import ModuleManager from './pages/coach/ModuleManager'
import AnnouncementsManager from './pages/coach/AnnouncementsManager'
import CohortSetup from './pages/coach/CohortSetup'
import GroupsManager from './pages/coach/GroupsManager'

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
            <Route path="announcements" element={<Announcements />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="review" element={<PeerReviewQueue />} />
            <Route path="group" element={<GroupHub />} />
            <Route path="qa" element={<QandA />} />
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
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="cohort" element={<CohortSetup />} />
            <Route path="groups" element={<GroupsManager />} />
            <Route path="qa" element={<QandA />} />
          </Route>

          {/* Catch-all: redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
