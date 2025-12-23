
// Login.jsx
import { useState } from "react";
import API from "../api";
import AuthLayout from "./auth/AuthLayout";
import FormInput from "./auth/FormInput";
import ErrorAlert from "./auth/ErrorAlert";
import SubmitButton from "./auth/SubmitButton";

function Login({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const response = await API.post("/login", { email, password });
      
      if (response.data && response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        onLogin();
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError("Incorrect email or password");
        } else if (err.response.status === 422) {
          setError("Invalid input. Please check your data.");
        } else {
          setError("Server error. Please try again later.");
        }
      } else if (err.request) {
        setError("Cannot connect to server. Please check your connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to manage your tasks"
      gradientFrom="from-blue-50"
      gradientTo="to-indigo-100"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ErrorAlert message={error} />

        <FormInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={loading}
          testId="email-input"
        />

        <FormInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={loading}
          testId="password-input"
        />

        <SubmitButton
          loading={loading}
          loadingText="Signing in..."
          text="Sign In"
        />
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 font-semibold hover:text-blue-700 transition"
            disabled={loading}
            data-testid="switch-to-register"
          >
            Create Account
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Login;