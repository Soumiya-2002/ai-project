import api from "../../api/axios";

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
      <div className="login-card glass-panel animate-scaleIn">
        <div className="login-header">
          <div className="logo-circle">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {/* Role selection removed - Backend handles role */}

          <div className="form-group animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <label>Email Address</label>
            <div className="input-with-icon">
              <i className="fa-solid fa-envelope input-icon"></i>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.com"
                className="custom-input"
              />
            </div>
          </div>

          <div className="form-group animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <label>Password</label>
            <div className="input-with-icon">
              <i className="fa-solid fa-lock input-icon"></i>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="custom-input"
              />
            </div>
          </div>

          <div className="form-options animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <span className="forgot-password">Forgot Password?</span>
          </div>

          <button type="submit" className="btn-login animate-fadeInUp" style={{ animationDelay: '0.5s' }} disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <span>Login <i className="fa-solid fa-arrow-right"></i></span>}
          </button>
        </form>

        <div className="login-footer animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
          <p>Don't have an account? <span onClick={() => toast.info("Contact Super Admin for access")}>Request Access</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
