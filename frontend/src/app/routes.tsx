import { createBrowserRouter, Navigate } from 'react-router';
import { SignIn } from './pages/SignIn';
import { AdminDashboard } from './pages/AdminDashboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SignUp } from './pages/SignUp';
import { JobBrowser } from './pages/JobBrowser';
export const router = createBrowserRouter([
  {
    path:'/signup',
    element:<SignUp/>
  },
  {
    path: '/signin',
    element: <SignIn />
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/recruiter',
    element: (
      <ProtectedRoute allowedRoles={['recruiter']}>
        <RecruiterDashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/candidate',
    element: (
      <ProtectedRoute allowedRoles={['candidate']}>
        <CandidateDashboard />
      </ProtectedRoute>
    )
  },
  {
  path: '/candidate/jobs',
  element: (
    <ProtectedRoute allowedRoles={['candidate']}>
      <JobBrowser />
    </ProtectedRoute>
  )
},
  {
    path: '/',
    element: <Navigate to="/signin" replace />
  },
  {
    path: '*',
    element: <Navigate to="/signin" replace />
  }
]);
