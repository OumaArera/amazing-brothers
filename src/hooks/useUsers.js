import { useState, useEffect, useCallback } from 'react';
import { getData, createData } from '../utils/api';

/**
 * useUsers — manages fetching the users list and creating new users.
 *
 * Returns:
 *   users        — array of user objects
 *   loading      — fetch in progress
 *   error        — fetch error string or null
 *   creating     — create request in progress
 *   createError  — create error string or null
 *   createUser   — async fn(payload) → { success, data } or { success: false, error }
 *   refetch      — manually re-fetch the list
 */
const useUsers = () => {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getData('users/');
    if (response?.error) {
      setError(response.error);
    } else {
      // API returns paginated { count, results: [...] }
      setUsers(response?.results ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = async (payload) => {
    setCreating(true);
    setCreateError(null);
    // createData(endpoint, data, isTokenRequired=true)
    const response = await createData('create/', payload, true);
    setCreating(false);
    if (response?.error) {
      const msg = typeof response.error === 'string'
        ? response.error
        : JSON.stringify(response.error);
      setCreateError(msg);
      return { success: false, error: msg };
    }
    // Refresh list after successful creation
    await fetchUsers();
    return { success: true, data: response };
  };

  return {
    users,
    loading,
    error,
    creating,
    createError,
    setCreateError,
    createUser,
    refetch: fetchUsers,
  };
};

export default useUsers;