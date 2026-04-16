import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: '#0a0618' }}>
      <div className="text-8xl font-black mb-4 gradient-text">404</div>
      <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );
};

export default NotFound;