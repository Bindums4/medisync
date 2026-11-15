import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';
import { resetSocket } from './socket';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('medisync_token')) return setLoading(false);
    api.get('/auth/me').then((r) => setUser(r.data)).catch(() => localStorage.removeItem('medisync_token')).finally(() => setLoading(false));
  }, []);

  const authenticate = async (path, body) => {
    const { data } = await api.post(`/auth/${path}`, body);
    localStorage.setItem('medisync_token', data.token);
    resetSocket();
    setUser(data.user);
    return data.user;
  };
  const logout = () => { localStorage.removeItem('medisync_token'); resetSocket(); setUser(null); };
  const refresh = async () => setUser((await api.get('/auth/me')).data);

  return <Ctx.Provider value={{ user, setUser, loading, refresh, login: (b) => authenticate('login', b), register: (b) => authenticate('register', b), logout }}>{children}</Ctx.Provider>;
}
