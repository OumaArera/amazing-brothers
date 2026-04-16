/**
 * Generic placeholder for unimplemented manager pages.
 */
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const ManagerPlaceholder = ({ title, icon, description }) => {
  const navigate = useNavigate();
  return (
    <DashboardLayout pageTitle={title}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="text-6xl mb-6">{icon}</div>
        <h2 className="text-2xl font-black text-white mb-3">{title}</h2>
        <p className="text-sm max-w-md mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {description || 'This feature is coming soon. You will be able to manage this section here.'}
        </p>
        <div className="px-5 py-3 rounded-2xl mb-6"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}>
          <p className="text-sm font-semibold">🚧 Feature in development</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/manager')}>← Back to Dashboard</Button>
      </div>
    </DashboardLayout>
  );
};

export default ManagerPlaceholder;