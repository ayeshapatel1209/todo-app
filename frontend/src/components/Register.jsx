import { useState } from "react";
import API from "../api";
import AuthLayout from "./auth/AuthLayout";
import FormInput from "./auth/FormInput";
import ErrorAlert from "./auth/ErrorAlert";
import SuccessAlert from "./auth/SuccessAlert";
import SubmitButton from "./auth/SubmitButton";

function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Client-side validation
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await API.post("/register", { email, password });
      setSuccess(true);
      setError("");
      
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        onRegisterSuccess();
      }, 2000);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 400) {
          setError(err.response.data.detail || "Email already registered");
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
      title="Create Account" 
      subtitle="Sign up to start managing tasks"
      gradientFrom="from-green-50"
      gradientTo="to-emerald-100"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ErrorAlert message={error} />
        <SuccessAlert message={success ? "Registration successful! Redirecting to login..." : ""} />

        <FormInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={loading || success}
          testId="email-input"
          focusColor="green"
        />

        <FormInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={loading || success}
          testId="password-input"
          focusColor="green"
        />

        <FormInput
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          disabled={loading || success}
          testId="confirm-password-input"
          focusColor="green"
        />

        <SubmitButton
          loading={loading}
          loadingText="Creating account..."
          text="Create Account"
          color="green"
        />
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-green-600 font-semibold hover:text-green-700 transition"
            disabled={loading}
            data-testid="switch-to-login"
          >
            Sign In
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Register;
