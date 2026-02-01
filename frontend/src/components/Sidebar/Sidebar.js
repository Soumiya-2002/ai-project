import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import menuConfig from "./menuConfig";
import "./Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? ">>" : "<<"}
      </button>

      <ul className="menu-list">
        {menuConfig.map((item) => (
          <li key={item.path} className={pathname === item.path ? "active" : ""}>
            <Link to={item.path}>
              <i className={item.icon}></i>
              {!collapsed && <span>{item.title}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
