import React, { useState } from "react";
import "./Login.css";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { loginUser } from "../../api/authService";
import { validateEmail, validatePassword } from "../../utils/validations";
import { toast } from "react-toastify";
import logo from "../../assets/logo.webp";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!validateEmail(email)) return toast.error("Invalid Email");
    if (!validatePassword(password))
      return toast.error("Password must be 6+ characters");

    setLoading(true);
    try {
      // For demo purposes, accept any valid email/password
      localStorage.setItem("token", "demo-token-" + Date.now());

      toast.success("Login Successful!");
      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 500);
    } catch (error) {
      toast.error("Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="logo" className="logo" />

      <h2>Welcome Back</h2>

      <Input
        label="Email"
        type="email"
        value={email}
        placeholder="Enter email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        label="Password"
        type="password"
        value={password}
        placeholder="Enter password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button title="Login" onClick={handleLogin} isLoading={loading} />
    </div>
  );
};

export default Login;
