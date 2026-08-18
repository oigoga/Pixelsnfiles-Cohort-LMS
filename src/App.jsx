import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { Spinner } from './components/ui/Spinner'

import Login from './pages/auth/Login'
const StudentLayout = lazy(() => import('./components/layout/StudentLayout'))
const CoachLayout   = lazy(() => import('./components/layout/CoachLayout'))

// Student pages
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'))
const ModuleView       = lazy(() => import('./pages/student/ModuleView'))
const TaskView          = lazy(() => import('./pages/student/TaskView'))
const PeerReviewQueue  = lazy(() => import('./pages/student/PeerReviewQueue'))
const GroupHub          = lazy(() => import('./pages/student/GroupHub'))
const Announcements    = lazy(() => import('./pages/student/Announcements'))
const Leaderboard       = lazy(() => import('./pages/Leaderboard'))
const QandA              = lazy(() => import('./pages/QandA'))

// Coach pages
const OverviewBoard         = lazy(() => import('./pages/coach/OverviewBoard'))
const StudentsBoard         = lazy(() => import('./pages/coach/StudentsBoard'))
const RiskBoard              = lazy(() => import('./pages/coach/RiskBoard'))
const StudentDetail         = lazy(() => import('./pages/coach/StudentDetail'))
const VerificationQueue     = lazy(() => import('./pages/coach/VerificationQueue'))
const ModuleManager         = lazy(() => import('./pages/coach/ModuleManager'))
const AnnouncementsManager = lazy(() => import('./pages/coach/AnnouncementsManager'))
const CohortSetup           = lazy(() => import('./pages/coach/CohortSetup'))
const GroupsManager         = lazy(() => import('./pages/coach/GroupsManager'))

function PageFallback() {
  return (
    <div className="flex justify-center py-20">
      <Spinner className="w-8 h-8" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
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
              <Route path="students" element={<StudentsBoard />} />
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
