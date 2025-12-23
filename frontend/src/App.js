import { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Tasks from "./components/Tasks";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const handleRegisterSuccess = () => {
    setShowRegister(false);
  };

  if (isAuthenticated) {
    return <Tasks onLogout={handleLogout} />;
  }

  if (showRegister) {
    return (
      <Register
        onSwitchToLogin={() => setShowRegister(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  return (
    <Login
      onLogin={handleLogin}
      onSwitchToRegister={() => setShowRegister(true)}
    />
  );
}

export default App;