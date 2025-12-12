// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
    const { profile, loading } = useAuth();

    if (loading) {
        return <div>Cargando...</div>; // O un spinner
    }

    if (!profile) {
        return <Navigate to="/login" />;
    }

    if (role && profile.role !== role) {
        // Si requiere un rol específico y no lo tiene
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;