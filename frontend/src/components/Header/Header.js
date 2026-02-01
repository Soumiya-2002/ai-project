import React from "react";
import "./Header.css";

const Header = () => {
  return (
    <header className="header">
      <h3>Admin Panel</h3>

      <button
        className="logout-btn"
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/";
        }}
      >
        Logout
      </button>
    </header>
  );
};

export default Header;
