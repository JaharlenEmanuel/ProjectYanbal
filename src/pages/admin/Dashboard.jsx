// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        products: 0,
        categories: 0,
        campaigns: 0,
        consultants: 0,
        reservations: 0,
        roles: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentReservations, setRecentReservations] = useState([]);

    // Cargar estadísticas
    const loadStats = async () => {
        try {
            setLoading(true);

            // Cargar conteos paralelos
            const [
                usersCount,
                productsCount,
                categoriesCount,
                campaignsCount,
                consultantsCount,
                reservationsCount,
                rolesCount
            ] = await Promise.all([
                supabase.from('profiles').select('count', { count: 'exact', head: true }),
                supabase.from('products').select('count', { count: 'exact', head: true }),
                supabase.from('categories').select('count', { count: 'exact', head: true }),
                supabase.from('campaigns').select('count', { count: 'exact', head: true }),
                supabase.from('consultants').select('count', { count: 'exact', head: true }),
                supabase.from('reservations').select('count', { count: 'exact', head: true }),
                supabase.from('roles').select('count', { count: 'exact', head: true })
            ]);

            // Cargar reservas recientes
            const { data: recentReservationsData } = await supabase
                .from('reservations')
                .select(`
                    *,
                    user:user_profile_id (full_name)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                users: usersCount.count || 0,
                products: productsCount.count || 0,
                categories: categoriesCount.count || 0,
                campaigns: campaignsCount.count || 0,
                consultants: consultantsCount.count || 0,
                reservations: reservationsCount.count || 0,
                roles: rolesCount.count || 0
            });

            setRecentReservations(recentReservationsData || []);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    // Tarjetas de acceso rápido
    const quickLinks = [
        {
            title: 'Usuarios',
            count: stats.users,
            icon: '👥',
            color: 'blue',
            link: '/admin/users',
            description: 'Gestión de usuarios del sistema'
        },
        {
            title: 'Productos',
            count: stats.products,
            icon: '🛍️',
            color: 'green',
            link: '/admin/products',
            description: 'Catálogo de productos'
        },
        {
            title: 'Categorías',
            count: stats.categories,
            icon: '📂',
            color: 'purple',
            link: '/admin/categories',
            description: 'Categorías de productos'
        },
        {
            title: 'Campañas',
            count: stats.campaigns,
            icon: '🎯',
            color: 'orange',
            link: '/admin/campaigns',
            description: 'Campañas promocionales'
        },
        {
            title: 'Consultoras',
            count: stats.consultants,
            icon: '💼',
            color: 'pink',
            link: '/admin/consultants',
            description: 'Gestión de consultoras'
        },
        {
            title: 'Reservas',
            count: stats.reservations,
            icon: '📋',
            color: 'red',
            link: '/admin/reservations',
            description: 'Reservas de clientes'
        },
        {
            title: 'Roles',
            count: stats.roles,
            icon: '🛡️',
            color: 'yellow',
            link: '/admin/roles',
            description: 'Roles y permisos'
        }
    ];

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
                    <p className="text-gray-600 mt-2">
                        Bienvenido al sistema de gestión integral
                    </p>
                </div>
                <div className="mt-4 md:mt-0">
                    <div className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>
            </div>

            {/* Estadísticas generales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickLinks.map((item, index) => (
                    <div
                        key={index}
                        className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-300 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{item.count}</div>
                                <div className="text-sm text-gray-600">{item.title}</div>
                            </div>
                            <div className="text-2xl">{item.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Accesos rápidos */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Acceso Rápido</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickLinks.map((item, index) => (
                        <Link
                            key={index}
                            to={item.link}
                            className="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`text-3xl bg-${item.color}-100 text-${item.color}-600 p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {item.description}
                                    </p>
                                    <div className="mt-2 text-xs text-gray-400">
                                        {item.count} registros
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Reservas recientes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Reservas Recientes</h2>
                    <Link to="/admin/reservations" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                        Ver todas →
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando reservas...</p>
                    </div>
                ) : recentReservations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No hay reservas recientes
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Acción
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentReservations.map(reservation => (
                                    <tr key={reservation.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {reservation.user?.full_name || 'Cliente no encontrado'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    reservation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                        reservation.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>
                                                {reservation.status === 'pending' ? 'Pendiente' :
                                                    reservation.status === 'confirmed' ? 'Confirmada' :
                                                        reservation.status === 'completed' ? 'Completada' : 'Cancelada'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">
                                                ${Number(reservation.total_amount || 0).toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {new Date(reservation.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(reservation.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/admin/reservations`}
                                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                            >
                                                Gestionar
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}