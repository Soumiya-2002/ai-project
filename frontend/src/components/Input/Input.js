import React from "react";
import "./Input.css";

const Input = ({ label, type, value, onChange, placeholder }) => {
  return (
    <div className="modern-input-container">
      <input
        type={type}
        value={value}
        onChange={onChange}
        required
      />
      <label>{label}</label>
    </div>
  );
};

export default Input;
