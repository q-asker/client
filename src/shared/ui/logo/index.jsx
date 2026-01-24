import React from "react";
import "./index.css";

const Logo = ({ className = "" }) => {
  const logoClassName = ["logo", className].filter(Boolean).join(" ");

  return (
    <span className={logoClassName}>
      <img src="/favicon-256x256.png" alt="Q-Asker" className="logo-icon" />
      <span className="logo-text">Q-Asker</span>
    </span>
  );
};

export default Logo;
