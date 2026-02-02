import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from "../../api/axios";
import logo from '../../assets/logo.png';
import './Login.css';

// Validation helpers
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => password.length >= 6;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) return toast.error("Invalid Email");
    if (!validatePassword(password))
      return toast.error("Password must be 6+ characters");

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Legacy session format for Dashboard compatibility
      const sessionData = {
        token: data.token,
        role: data.user.role,
        user: data.user
      };
      localStorage.setItem("session", JSON.stringify(sessionData));

      toast.success(`Welcome back, ${data.user.name}!`);

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Login Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container" style={{ marginBottom: '1.5rem' }}>
            <img src={logo} alt="NITI Solutions" style={{ height: '70px', objectFit: 'contain' }} />
          </div>
          <h1>Welcome Back</h1>
          <p className="subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              {/* <i className="fa-solid fa-envelope"></i> */}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              {/* <i className="fa-solid fa-lock"></i> */}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Signing in...
              </>
            ) : (
              <>
                <span>Sign In</span>
                <i className="fa-solid fa-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?
            <span onClick={() => toast.info("Contact Super Admin for access")}> Request Access</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
