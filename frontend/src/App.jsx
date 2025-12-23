import { useState, useEffect } from "react";
import Register from "./components/Register";
import Login from "./components/Login";
import Tasks from "./components/Tasks";

function App() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUserLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setUserLoggedIn(true);
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserLoggedIn(false);
  };

  const switchToRegister = () => {
    setShowRegister(true);
  };

  const switchToLogin = () => {
    setShowRegister(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!userLoggedIn) {
    return showRegister ? (
      <Register onSwitchToLogin={switchToLogin} onRegisterSuccess={switchToLogin} />
    ) : (
      <Login onLogin={handleLogin} onSwitchToRegister={switchToRegister} />
    );
  }

  return <Tasks onLogout={handleLogout} />;
}

export default App;