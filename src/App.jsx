import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Public pages
import LandingPage    from './pages/LandingPage';
import LoginPage      from './pages/LoginPage';
import NotFound       from './pages/NotFound';

// Manager pages — implemented
import ManagerDashboard from './pages/manager/ManagerDashboard';
import Users            from './pages/manager/Users';
import Facilities       from './pages/manager/Facilities';
import Branches         from './pages/manager/Branches';
import Residents        from './pages/manager/Residents';
import Assessments      from './pages/manager/Assessments';
import Appointments     from './pages/manager/Appointments';
import ManagerVitals    from './pages/manager/Vitals';
import ManagerSleep     from './pages/manager/Sleep';
import ManagerCare      from './pages/manager/Care';

// Caregiver pages — implemented
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard';
import CaregiverCare      from './pages/caregiver/Care';
import CaregiverVitals    from './pages/caregiver/Vitals';
import CaregiverSleep     from './pages/caregiver/Sleep';

// Placeholders (still used for other features)
import ManagerPlaceholder   from './pages/manager/Placeholder';
import CaregiverPlaceholder from './pages/caregiver/Placeholder';

import ManagerUpdates   from './pages/manager/Updates';
import CaregiverUpdates from './pages/caregiver/Updates';


// Leave pages
import ManagerLeave   from './pages/manager/Leave';
import CaregiverLeave from './pages/caregiver/Leave';

// Late Submission pages
import ManagerLateSubmissions  from './pages/manager/LateSubmissions';
import CaregiverLateSubmission from './pages/caregiver/LateSubmissions';

// Utilities pages
import ManagerUtilities   from './pages/manager/Utilities';
import CaregiverUtilities from './pages/caregiver/Utilities';



// ── Role-aware smart redirect ─────────────────────────────────────────────────
const RoleRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const isManager = user?.role === 'admin' || user?.role === 'manager';
  return <Navigate to={isManager ? '/manager' : '/caregiver'} replace />;
};

const M = (props) => (
  <ProtectedRoute allowedRoles={['admin', 'manager']}>
    {props.children}
  </ProtectedRoute>
);

const C = (props) => (
  <ProtectedRoute allowedRoles={['caregiver', 'care_giver', 'staff']}>
    {props.children}
  </ProtectedRoute>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleRedirect />
            </ProtectedRoute>
          }
        />

        {/* ── Manager ── */}
        <Route path="/manager" element={<M><ManagerDashboard /></M>} />
        <Route path="/manager/facilities" element={<M><Facilities /></M>} />
        <Route path="/manager/branches" element={<M><Branches /></M>} />
        <Route path="/manager/users" element={<M><Users /></M>} />
        <Route path="/manager/residents" element={<M><Residents /></M>} />
        <Route path="/manager/assessments" element={<M><Assessments /></M>} />
        <Route path="/manager/appointments" element={<M><Appointments /></M>} />

        {/* Care hub */}
        <Route path="/manager/care" element={<M><ManagerCare /></M>} />
        <Route path="/manager/care-categories" element={<Navigate to="/manager/care" replace />} />
        <Route path="/manager/care-items" element={<Navigate to="/manager/care" replace />} />
        <Route path="/manager/care-charts" element={<Navigate to="/manager/care" replace />} />

        {/* ✅ Sleep now uses real component */}
        <Route path="/manager/sleep" element={<M><ManagerSleep /></M>} />
        <Route path="/manager/updates"          element={<M><ManagerUpdates /></M>} />
        <Route path="/caregiver/updates"         element={<C><CaregiverUpdates /></C>} />
        <Route path="/manager/leave"            element={<M><ManagerLeave /></M>} />
        <Route path="/caregiver/leave"           element={<C><CaregiverLeave /></C>} />

        {/* Other manager placeholders */}
        <Route path="/manager/vitals" element={<M><ManagerVitals /></M>} />
        <Route path="/manager/updates" element={<M><ManagerPlaceholder title="Resident Updates" icon="📝" /></M>} />
        <Route path="/manager/leave" element={<M><ManagerPlaceholder title="Leave Requests" icon="🏖️" /></M>} />
        <Route path="/manager/groceries" element={<M><ManagerPlaceholder title="Groceries" icon="🛒" /></M>} />
        
        <Route path="/manager/late-submissions" element={<M><ManagerLateSubmissions /></M>} />
        <Route path="/caregiver/late-submission" element={<C><CaregiverLateSubmission /></C>} />
        <Route path="/caregiver/utilities"       element={<C><CaregiverUtilities /></C>} />


        {/* ── Caregiver ── */}
        <Route path="/caregiver" element={<C><CaregiverDashboard /></C>} />

        {/* Care hub */}
        <Route path="/caregiver/care" element={<C><CaregiverCare /></C>} />
        <Route path="/caregiver/care-charts" element={<Navigate to="/caregiver/care" replace />} />

        {/* ✅ Sleep now uses real component */}
        <Route path="/caregiver/sleep" element={<C><CaregiverSleep /></C>} />

        {/* Other caregiver features */}
        <Route path="/caregiver/vitals" element={<C><CaregiverVitals /></C>} />
        <Route path="/caregiver/updates" element={<C><CaregiverPlaceholder title="Resident Updates" icon="📝" /></C>} />
        <Route path="/caregiver/appointments" element={<C><CaregiverPlaceholder title="Appointments" icon="📅" /></C>} />
        <Route path="/caregiver/assessments" element={<C><CaregiverPlaceholder title="Assessments" icon="📋" /></C>} />
        <Route path="/caregiver/leave" element={<C><CaregiverPlaceholder title="Request Leave" icon="🏖️" /></C>} />
        <Route path="/manager/utilities"        element={<M><ManagerUtilities /></M>} />
        <Route path="/caregiver/groceries" element={<C><CaregiverPlaceholder title="Groceries" icon="🛒" /></C>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;