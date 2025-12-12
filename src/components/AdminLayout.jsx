// src/components/AdminLayout.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabase";

export default function AdminLayout() {
    const { profile, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const notificationsRef = useRef(null);

    const menuItems = [
        {
            path: "/admin/dashboard",
            label: "Dashboard",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            path: "/admin/users",
            label: "Usuarios",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 0h-6" />
                </svg>
            )
        },
        {
            path: "/admin/products",
            label: "Productos",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            )
        },
        {
            path: "/admin/campaigns",
            label: "Campañas",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
            )
        },
        {
            path: "/admin/consultants",
            label: "Consultoras",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            path: "/admin/reservations",
            label: "Reservas",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            )
        },
        {
            path: "/admin/roles",
            label: "Roles",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
        {
            path: "/admin/profile",
            label: "Perfil",
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )

        }
    ];

    // Cargar notificaciones
    const loadNotifications = async () => {
        if (!profile?.id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_profile_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            setNotifications(data || []);

            // Calcular no leídas
            const unread = data?.filter(n => !n.is_read).length || 0;
            setUnreadCount(unread);

        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    // Suscripción en tiempo real
    useEffect(() => {
        if (!profile?.id) return;

        loadNotifications();

        // Suscribirse a cambios en tiempo real
        const channel = supabase
            .channel('notifications-changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_profile_id=eq.${profile.id}`
            }, () => {
                loadNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id]);

    // Cerrar menús al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cerrar menús al cambiar de ruta
    useEffect(() => {
        setShowNotifications(false);
        setShowUserMenu(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const getInitials = (name) => {
        if (!name) return "AD";
        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    // Marcar notificación como leída
    const markAsRead = async (notificationId) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;

            // Actualizar estado local
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId
                        ? { ...n, is_read: true }
                        : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
        }
    };

    // Marcar todas como leídas
    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_profile_id', profile.id)
                .eq('is_read', false);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);

        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
        }
    };

    // Formatear fecha relativa
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    // Obtener ícono según tipo
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return (
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
            case 'warning': return (
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
            );
            case 'error': return (
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
            );
            default: return (
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
        }
    };

    // Manejar clic en notificación - CORREGIDO
    const handleNotificationClick = async (notification) => {
        // 1. Marcar como leída inmediatamente
        if (!notification.is_read) {
            try {
                await markAsRead(notification.id);
            } catch (error) {
                console.error('Error marcando notificación como leída:', error);
            }
        }

        // 2. Cerrar el dropdown
        setShowNotifications(false);

        // 3. Redirigir a la página correspondiente
        if (notification.related_id) {
            // Si es una notificación de reserva, redirigir a reservas
            if (notification.type === 'reservation' ||
                notification.title?.toLowerCase().includes('reserva') ||
                notification.message?.toLowerCase().includes('reserva')) {
                navigate(`/admin/reservations`);
            }
            // Si es una notificación de producto, redirigir a productos
            else if (notification.type === 'product' ||
                notification.title?.toLowerCase().includes('producto') ||
                notification.message?.toLowerCase().includes('producto')) {
                navigate(`/admin/products`);
            }
            // Si es una notificación de usuario, redirigir a usuarios
            else if (notification.type === 'user' ||
                notification.title?.toLowerCase().includes('usuario') ||
                notification.message?.toLowerCase().includes('usuario')) {
                navigate(`/admin/users`);
            }
        } else {
            // Si no hay related_id, redirigir a reservas por defecto
            navigate(`/admin/reservations`);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`${sidebarCollapsed ? "w-20" : "w-64"
                    } bg-linear-to-br from-gray-900 to-gray-800 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl z-20`}
            >
                {/* Header del Sidebar */}
                <div className={`p-6 border-b border-gray-700 ${sidebarCollapsed ? "px-4" : ""}`}>
                    <div className="flex items-center justify-between">
                        {!sidebarCollapsed && (
                            <div>
                                <h1 className="text-xl font-bold bg-linear-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                                    Panel Admin
                                </h1>
                                <p className="text-xs text-gray-400 mt-1">Gestión completa</p>
                            </div>
                        )}
                        {sidebarCollapsed && (
                            <div className="w-8 h-8 rounded-lg bg-linear-to-r from-orange-500 to-orange-400 flex items-center justify-center mx-auto">
                                <span className="font-bold">A</span>
                            </div>
                        )}

                        {/* Botón para colapsar/expandir sidebar */}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {sidebarCollapsed ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Navegación */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? "bg-linear-to-r from-orange-500/20 to-orange-400/10 border-l-4 border-orange-500"
                                    : "hover:bg-gray-800/50 hover:border-l-4 hover:border-gray-600"
                                    } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                                title={sidebarCollapsed ? item.label : ""}
                            >
                                <div className={`${isActive ? "text-orange-400" : "text-gray-400 group-hover:text-white"}`}>
                                    {item.icon}
                                </div>

                                {!sidebarCollapsed && (
                                    <span className={`font-medium ${isActive ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                                        {item.label}
                                    </span>
                                )}

                                {isActive && !sidebarCollapsed && (
                                    <div className="ml-auto w-2 h-2 rounded-full bg-orange-500"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer del Sidebar */}
                <div className={`p-4 border-t border-gray-700 ${sidebarCollapsed ? "px-2" : ""}`}>
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className={`flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800 transition-colors ${sidebarCollapsed ? "justify-center" : ""
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-linear-to-r from-orange-500 to-orange-400 flex items-center justify-center font-bold text-white">
                                {getInitials(profile?.full_name || profile?.email)}
                            </div>

                            {!sidebarCollapsed && (
                                <div className="flex-1 text-left">
                                    <div className="font-medium text-white truncate">
                                        {profile?.full_name || profile?.email}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {profile?.role || "Administrador"}
                                    </div>
                                </div>
                            )}
                        </button>

                        {/* Menú desplegable del usuario */}
                        {showUserMenu && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-30">
                                <div className="p-4 border-b border-gray-700">
                                    <div className="font-medium text-white">{profile?.full_name}</div>
                                    <div className="text-sm text-gray-400">{profile?.email}</div>
                                </div>
                                <div className="p-2">
                                    <Link
                                        to="/admin/profile"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Mi perfil
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Cerrar sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Contenido principal */}
            <main className="flex-1 overflow-auto">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {menuItems.find(item =>
                                    location.pathname === item.path ||
                                    location.pathname.startsWith(item.path + "/")
                                )?.label || "Dashboard"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date().toLocaleDateString("es-ES", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                })}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* NOTIFICACIONES FUNCIONALES - ACTUALIZADO */}
                            <div className="relative" ref={notificationsRef}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                                    aria-label="Notificaciones"
                                >
                                    <div className="relative">
                                        <svg
                                            className={`w-6 h-6 transition-colors ${showNotifications ? 'text-orange-600' : 'text-gray-600 group-hover:text-orange-600'}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>

                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </div>

                                    {/* Tooltip */}
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 text-white text-sm rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                        {unreadCount > 0
                                            ? `${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} nueva${unreadCount > 1 ? 's' : ''}`
                                            : 'No hay notificaciones nuevas'
                                        }
                                    </div>
                                </button>

                                {/* Dropdown de notificaciones */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
                                        {/* Header */}
                                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                                                <p className="text-xs text-gray-500">
                                                    {unreadCount > 0
                                                        ? `${unreadCount} sin leer`
                                                        : 'Todas leídas'
                                                    }
                                                </p>
                                            </div>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                                                    disabled={loading}
                                                >
                                                    Marcar todas
                                                </button>
                                            )}
                                        </div>

                                        {/* Lista de notificaciones */}
                                        <div className="flex-1 overflow-y-auto">
                                            {loading ? (
                                                <div className="py-8 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                                                    <p className="text-gray-500 mt-2 text-sm">Cargando...</p>
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="py-8 text-center">
                                                    <div className="text-4xl mb-2">🔔</div>
                                                    <p className="text-gray-900 font-medium">Sin notificaciones</p>
                                                    <p className="text-gray-500 text-sm">No hay notificaciones nuevas</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-100">
                                                    {notifications.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/50' : ''
                                                                }`}
                                                            onClick={() => handleNotificationClick(notification)}
                                                        >
                                                            <div className="flex gap-3">
                                                                {/* Ícono */}
                                                                {getNotificationIcon(notification.type)}

                                                                {/* Contenido */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h4 className={`font-medium text-sm ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'
                                                                            }`}>
                                                                            {notification.title}
                                                                        </h4>
                                                                        <span className="text-xs text-gray-400 shrink-0">
                                                                            {formatTimeAgo(notification.created_at)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                                                        {notification.message}
                                                                    </p>

                                                                    {/* Indicador de no leído */}
                                                                    {!notification.is_read && (
                                                                        <div className="flex items-center gap-2 mt-2">
                                                                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                                            <span className="text-xs text-blue-600">Nueva</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="border-t border-gray-200 bg-gray-50 p-3">
                                            <button
                                                onClick={() => {
                                                    navigate('/admin/notifications');
                                                    setShowNotifications(false);
                                                }}
                                                className="w-full text-center text-sm text-gray-600 hover:text-orange-600 font-medium py-2 transition-colors"
                                            >
                                                Ver todas las notificaciones
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Botón para vista de tienda */}
                            <Link
                                to="/"
                                className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-orange-500 to-orange-400 text-white rounded-lg hover:from-orange-600 hover:to-orange-500 transition-all shadow-sm hover:shadow"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Ir a la tienda
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Contenido */}
                <div className="p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-white px-6 py-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <div>
                            © {new Date().getFullYear()} Panel Administrativo. Todos los derechos reservados.
                        </div>

                    </div>
                </footer>
            </main>

            {/* Overlay para menú móvil */}
            {showUserMenu && (
                <div
                    className="fixed inset-0 bg-black/20 z-10 md:hidden"
                    onClick={() => setShowUserMenu(false)}
                />
            )}

            {/* Overlay para notificaciones en móvil */}
            {showNotifications && (
                <div
                    className="fixed inset-0 bg-black/20 z-10 md:hidden"
                    onClick={() => setShowNotifications(false)}
                />
            )}
        </div>
    );
}