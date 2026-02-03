import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import menuConfig from "./menuConfig";
import "./Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('🔍 Sidebar - User from localStorage:', user);
    console.log('🔍 Sidebar - User role (raw):', user.role);

    // Normalize role: remove underscores and spaces, lowercase (to match AdminLayout)
    const normalizedRole = user.role ? user.role.toLowerCase().replace(/[\s_]/g, '') : null;
    console.log('🔍 Sidebar - User role (normalized):', normalizedRole);
    setUserRole(normalizedRole);
  }, []);

  // Filter menu items based on role
  const getFilteredMenu = () => {
    console.log('🔍 getFilteredMenu called, userRole:', userRole);
    console.log('🔍 Full menuConfig:', menuConfig);

    if (!userRole) {
      console.log('⚠️ No user role found, showing all menu items');
      return menuConfig;
    }

    // Define role-based menu access (using normalized role names without underscores)
    const roleMenuAccess = {
      'superadmin': ['dashboard', 'users', 'teachers', 'schools', 'upload', 'reports'],
      'schooladmin': ['dashboard', 'users', 'teachers', 'schools', 'upload', 'reports'],
      'teacher': ['dashboard', 'upload', 'reports'] // Teachers see only Dashboard, Upload Lecture, and Reports
    };

    const allowedPaths = roleMenuAccess[userRole] || [];
    console.log('🔍 User role:', userRole);
    console.log('🔍 Allowed paths for role:', allowedPaths);
    console.log('🔍 roleMenuAccess object:', roleMenuAccess);

    const filtered = menuConfig.filter(item => {
      const pathKey = item.path.replace('/', '');
      const isAllowed = allowedPaths.includes(pathKey);
      console.log(`🔍 Menu item: ${item.title} (path: ${item.path}, pathKey: ${pathKey}) - Allowed: ${isAllowed}`);
      return isAllowed;
    });

    console.log('🔍 Final filtered menu items:', filtered);
    console.log('🔍 Number of filtered items:', filtered.length);
    return filtered;
  };

  const filteredMenu = getFilteredMenu();
  console.log('🔍 Rendering sidebar with', filteredMenu.length, 'items');

  return (
    <div className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? ">>" : "<<"}
      </button>

      <ul className="menu-list">
        {filteredMenu.map((item) => (
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
