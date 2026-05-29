import { createContext, useContext, useState } from "react";
import { getToken, setToken, clearToken } from "../../api/admin.js";
import { login as apiLogin } from "../../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setLocalToken] = useState(() => getToken());

  async function login(username, password) {
    const data = await apiLogin(username, password);
    setToken(data.access_token);
    setLocalToken(data.access_token);
  }

  function logout() {
    clearToken();
    setLocalToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
