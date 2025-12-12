// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { profile, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [cartCount, setCartCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const userMenuRef = useRef(null);

    // Efecto para detectar scroll
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Actualizar contador del carrito
    useEffect(() => {
        if (profile) {
            updateCartCount();
        }
        const handleStorageChange = () => {
            if (profile) {
                updateCartCount();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [profile, location]);

    // Cerrar menús al cambiar de página
    useEffect(() => {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
    }, [location.pathname]);

    // Cerrar menús al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateCartCount = () => {
        const savedCart = localStorage.getItem('user_cart');
        if (savedCart) {
            try {
                const cart = JSON.parse(savedCart);
                const count = cart.reduce((total, item) => total + item.quantity, 0);
                setCartCount(count);
            } catch (error) {
                console.error('Error loading cart count:', error);
            }
        } else {
            setCartCount(0);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setIsUserMenuOpen(false);
    };

    const handleCartClick = () => {
        if (!profile) {
            navigate('/login');
        } else {
            navigate('/cart');
        }
    };

    const menuItems = [
        { path: '/', label: 'Inicio', icon: '🏠' },
        { path: '/products', label: 'Productos', icon: '🛍️' },
        { path: '/contact', label: 'Contacto', icon: '📞' },
    ];

    // Obtener iniciales para el avatar
    const getInitials = () => {
        if (profile?.full_name) {
            return profile.full_name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
        }
        return profile?.email?.[0]?.toUpperCase() || 'U';
    };

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
            ? 'bg-linear-to-r from-orange-500 to-orange-600 backdrop-blur-lg shadow-lg'
            : 'bg-linear-to-r from-orange-500 to-orange-600'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo y menú móvil */}
                    <div className="flex items-center">
                        {/* Botón menú móvil */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                            aria-label="Abrir menú"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>

                        {/* Logo */}
                        <Link to="/" className="ml-2 lg:ml-0 flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-2xl font-bold bg-linear-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                                    T
                                </span>
                            </div>
                            <div className="hidden sm:block">
                                <span className={`text-xl font-bold ${scrolled ? 'text-gray-900' : 'text-white'
                                    }`}>
                                    TuTienda
                                </span>
                                <p className={`text-xs ${scrolled ? 'text-gray-600' : 'text-white/80'}`}>
                                    Compras inteligentes
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Menú de navegación - Desktop */}
                    <div className="hidden lg:flex items-center space-x-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${location.pathname === item.path
                                    ? scrolled
                                        ? 'bg-orange-100 text-orange-600'
                                        : 'bg-white/20 text-white'
                                    : scrolled
                                        ? 'text-gray-700 hover:bg-gray-100 hover:text-orange-600'
                                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Iconos de acción */}
                    <div className="flex items-center space-x-3">
                        {/* Carrito */}
                        <button
                            onClick={handleCartClick}
                            className="relative p-2 rounded-lg transition-colors group"
                            aria-label="Carrito de compras"
                        >
                            <div className={`p-2 rounded-full transition-colors ${scrolled
                                ? 'hover:bg-gray-100'
                                : 'hover:bg-white/10'
                                }`}>
                                <svg className={`w-6 h-6 transition-colors ${scrolled ? 'text-gray-700' : 'text-white'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>

                                {/* Badge del carrito */}
                                {profile && cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}

                                {/* Indicador para usuarios no logueados */}
                                {!profile && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                )}
                            </div>

                            {/* Tooltip */}
                            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 text-white text-sm rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                {!profile
                                    ? 'Inicia sesión para usar el carrito'
                                    : cartCount > 0
                                        ? `${cartCount} producto(s) en el carrito`
                                        : 'Tu carrito está vacío'
                                }
                            </div>
                        </button>

                        {/* Menú de usuario o botones de login/register */}
                        {profile ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${scrolled
                                        ? 'hover:bg-gray-100'
                                        : 'hover:bg-white/10'
                                        }`}
                                    aria-label="Menú de usuario"
                                >
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-md ${scrolled
                                        ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white'
                                        : 'bg-white text-orange-600'
                                        }`}>
                                        {getInitials()}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className={`font-medium text-sm ${scrolled ? 'text-gray-900' : 'text-white'
                                            }`}>
                                            {profile.full_name || profile.email.split('@')[0]}
                                        </p>
                                        <p className={`text-xs ${scrolled ? 'text-gray-500' : 'text-white/80'
                                            }`}>
                                            {isAdmin ? 'Administrador' : 'Cliente'}
                                        </p>
                                    </div>
                                    <svg className={`w-4 h-4 hidden md:block transition-transform ${isUserMenuOpen ? 'rotate-180' : ''
                                        } ${scrolled ? 'text-gray-600' : 'text-white'}`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Menú desplegable */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-fadeIn">
                                        {/* Header del menú */}
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 rounded-full bg-linear-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {getInitials()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {profile.full_name || 'Usuario'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 truncate">{profile.email}</p>
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                                                        {isAdmin ? 'Administrador' : 'Cliente'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Opciones del menú */}
                                        <div className="py-2">
                                            <Link
                                                to="/profile"
                                                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors group"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-orange-100 transition-colors">
                                                    <svg className="w-4 h-4 text-gray-600 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Mi perfil</p>
                                                    <p className="text-xs text-gray-500">Ver y editar mi información</p>
                                                </div>
                                            </Link>

                                            <Link
                                                to="/my-reservations"
                                                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors group"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-orange-100 transition-colors">
                                                    <svg className="w-4 h-4 text-gray-600 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Mis reservas</p>
                                                    <p className="text-xs text-gray-500">Historial y seguimiento</p>
                                                </div>
                                            </Link>

                                            <Link
                                                to="/cart"
                                                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors group md:hidden"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-orange-100 transition-colors">
                                                    <svg className="w-4 h-4 text-gray-600 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Mi carrito</p>
                                                    <p className="text-xs text-gray-500">
                                                        {cartCount > 0 ? `${cartCount} producto(s)` : 'Carrito vacío'}
                                                    </p>
                                                </div>
                                            </Link>

                                            {isAdmin && (
                                                <Link
                                                    to="/admin/dashboard"
                                                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors group border-t border-gray-100"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-blue-700">Panel de administración</p>
                                                        <p className="text-xs text-gray-500">Gestión completa del sistema</p>
                                                    </div>
                                                </Link>
                                            )}

                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors group border-t border-gray-100"
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                                                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Cerrar sesión</p>
                                                    <p className="text-xs text-red-500">Salir de tu cuenta</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Usuario no logueado
                            <div className="flex items-center space-x-3">
                                <Link
                                    to="/login"
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${scrolled
                                        ? 'text-gray-700 hover:text-orange-600'
                                        : 'text-white hover:text-white/80'
                                        }`}
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to="/register"
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-lg ${scrolled
                                        ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                                        : 'bg-white text-orange-600 hover:bg-white/90'
                                        }`}
                                >
                                    Registrarse
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Menú móvil */}
            {isMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-200 shadow-xl animate-slideDown">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        {/* Menú principal */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${location.pathname === item.path
                                        ? 'bg-orange-100 text-orange-600'
                                        : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Sección de usuario */}
                        {profile ? (
                            <>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="space-y-2">
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-linear-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
                                                {getInitials()}
                                            </div>
                                            <div>
                                                <p className="font-medium">{profile.full_name || 'Usuario'}</p>
                                                <p className="text-sm text-gray-500">{profile.email}</p>
                                            </div>
                                        </Link>

                                        <Link
                                            to="/my-reservations"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                📋
                                            </div>
                                            <div>
                                                <p className="font-medium">Mis reservas</p>
                                                <p className="text-sm text-gray-500">Ver historial</p>
                                            </div>
                                        </Link>

                                        <Link
                                            to="/cart"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700"
                                        >
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    🛒
                                                </div>
                                                {cartCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                        {cartCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">Mi carrito</p>
                                                <p className="text-sm text-gray-500">
                                                    {cartCount > 0 ? `${cartCount} producto(s)` : 'Carrito vacío'}
                                                </p>
                                            </div>
                                        </Link>

                                        {isAdmin && (
                                            <Link
                                                to="/admin/dashboard"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 border-t border-gray-200"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    ⚙️
                                                </div>
                                                <div>
                                                    <p className="font-medium text-blue-700">Panel Admin</p>
                                                    <p className="text-sm text-gray-500">Gestión del sistema</p>
                                                </div>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-gray-500 text-sm mb-3 px-2">Inicia sesión para más opciones</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="bg-linear-to-r from-orange-500 to-orange-600 text-white text-center py-3 rounded-lg font-medium"
                                    >
                                        Iniciar sesión
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="bg-white border border-orange-500 text-orange-600 text-center py-3 rounded-lg font-medium"
                                    >
                                        Registrarse
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}