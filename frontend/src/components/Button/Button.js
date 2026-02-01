import React from "react";
import "./Button.css";

const Button = ({ title, onClick, isLoading }) => {
  return (
    <button
      disabled={isLoading}
      onClick={onClick}
      className="modern-btn"
    >
      {isLoading ? (
        <span className="loader"></span>
      ) : (
        title
      )}
    </button>
  );
};

export default Button;
