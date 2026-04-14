import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createData } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    setError(null);

    const response = await createData('login/', { email, password });

    if (response?.error) {
      setError(
        typeof response.error === 'string'
          ? response.error
          : 'Invalid credentials. Please try again.'
      );
      setLoading(false);
      return;
    }

    if (response?.user && response?.tokens) {
      login(response.user, response.tokens, response.permissions ?? null);
      navigate('/dashboard');
    } else {
      setError('Unexpected response from server. Please try again.');
    }

    setLoading(false);
  };

  return { handleLogin, loading, error, clearError: () => setError(null) };
};