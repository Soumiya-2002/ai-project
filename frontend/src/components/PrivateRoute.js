import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ redirectTo = "/login" }) => {
    const token = localStorage.getItem('token');
    return token ? <Outlet /> : <Navigate to={redirectTo} />;
};

export default PrivateRoute;
