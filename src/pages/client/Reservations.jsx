// src/pages/client/Reservations.jsx - Versión corregida
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';

export default function ClientReservations() {
    const { profile } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (profile) {
            loadReservations();
        }
    }, [profile]);

    const loadReservations = async () => {
        try {
            setLoading(true);

            // Verificar que tengamos el ID del perfil
            const userId = profile?.id;

            if (!userId) {
                console.error('No hay ID de usuario disponible');
                setReservations([]);
                return;
            }

            console.log('Cargando reservas para usuario ID:', userId);

            // Primero, obtenemos las reservas básicas
            const { data: reservationsData, error: reservationsError } = await supabase
                .from('reservations')
                .select(`
                    id,
                    created_at,
                    updated_at,
                    status,
                    total_amount,
                    notes,
                    contact_method,
                    consultant_id,
                    user_profile_id
                `)
                .eq('user_profile_id', userId)
                .order('created_at', { ascending: false });

            if (reservationsError) throw reservationsError;

            // Si no hay reservas, terminamos aquí
            if (!reservationsData || reservationsData.length === 0) {
                setReservations([]);
                return;
            }

            // Ahora obtenemos los datos de las consultoras para las reservas que las tengan
            const reservationsWithDetails = await Promise.all(
                reservationsData.map(async (reservation) => {
                    let consultantData = null;
                    let itemsData = [];

                    // Obtener datos de la consultora si existe consultant_id
                    if (reservation.consultant_id) {
                        const { data: consultant, error: consultantError } = await supabase
                            .from('consultants')
                            .select('id, full_name, email, phone') // Solo las columnas que existen
                            .eq('id', reservation.consultant_id)
                            .single();

                        if (!consultantError) {
                            consultantData = consultant;
                        }
                    }

                    // Obtener items de la reserva
                    const { data: items, error: itemsError } = await supabase
                        .from('reservation_items')
                        .select(`
                            id,
                            quantity,
                            unit_price,
                            subtotal,
                            product_id
                        `)
                        .eq('reservation_id', reservation.id);

                    if (!itemsError && items) {
                        // Obtener detalles de cada producto
                        const itemsWithProducts = await Promise.all(
                            items.map(async (item) => {
                                let productData = null;

                                if (item.product_id) {
                                    // Solo obtenemos información básica del producto, NO el precio
                                    const { data: product, error: productError } = await supabase
                                        .from('products')
                                        .select('id, name, description, image_url') // ← SIN 'price'
                                        .eq('id', item.product_id)
                                        .single();

                                    if (!productError) {
                                        productData = product;
                                    }
                                }

                                return {
                                    ...item,
                                    product: productData // El precio ya está en item.unit_price
                                };
                            })
                        );

                        itemsData = itemsWithProducts;
                    }

                    return {
                        ...reservation,
                        consultant: consultantData,
                        items: itemsData
                    };
                })
            );

            setReservations(reservationsWithDetails);

        } catch (error) {
            console.error('Error loading reservations:', error);
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            'pending': {
                text: 'Pendiente',
                color: 'bg-yellow-100 text-yellow-800',
                icon: (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                )
            },
            'confirmed': {
                text: 'Confirmada',
                color: 'bg-blue-100 text-blue-800',
                icon: (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                )
            },
            'completed': {
                text: 'Completada',
                color: 'bg-green-100 text-green-800',
                icon: (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )
            },
            'cancelled': {
                text: 'Cancelada',
                color: 'bg-red-100 text-red-800',
                icon: (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                )
            },
            'processing': {
                text: 'En proceso',
                color: 'bg-purple-100 text-purple-800',
                icon: (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V7z" clipRule="evenodd" />
                    </svg>
                )
            }
        };

        return configs[status] || {
            text: status || 'Desconocido',
            color: 'bg-gray-100 text-gray-800',
            icon: null
        };
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Fecha no disponible';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        const numAmount = parseFloat(amount || 0);
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(numAmount);
    };

    const getFilteredReservations = () => {
        let filtered = reservations;

        // Filtrar por estado
        if (filter !== 'all') {
            filtered = filtered.filter(res => res.status === filter);
        }

        // Filtrar por búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(res => {
                // Buscar en ID
                if (res.id?.toLowerCase().includes(term)) return true;

                // Buscar en notas
                if (res.notes?.toLowerCase().includes(term)) return true;

                // Buscar en productos
                if (res.items?.some(item =>
                    item.product?.name?.toLowerCase().includes(term) ||
                    item.product?.description?.toLowerCase().includes(term)
                )) return true;

                return false;
            });
        }

        return filtered;
    };

    const handleCancelReservation = async (reservationId) => {
        if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('reservations')
                .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('id', reservationId);

            if (error) throw error;

            // Actualizar la lista localmente
            setReservations(prev =>
                prev.map(res =>
                    res.id === reservationId
                        ? { ...res, status: 'cancelled', updated_at: new Date().toISOString() }
                        : res
                )
            );

            alert('Reserva cancelada exitosamente');
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            alert('Error al cancelar la reserva');
        }
    };

    const filteredReservations = getFilteredReservations();

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Mis Reservas
                    </h1>
                    <p className="text-gray-600">
                        Gestiona y revisa todas tus reservas en un solo lugar
                    </p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {reservations.length}
                        </div>
                        <div className="text-sm text-gray-600">Total reservas</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="text-2xl font-bold text-yellow-600 mb-1">
                            {reservations.filter(r => r.status === 'pending').length}
                        </div>
                        <div className="text-sm text-gray-600">Pendientes</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                            {reservations.filter(r => r.status === 'confirmed' || r.status === 'processing').length}
                        </div>
                        <div className="text-sm text-gray-600">Activas</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                            {reservations.filter(r => r.status === 'completed').length}
                        </div>
                        <div className="text-sm text-gray-600">Completadas</div>
                    </div>
                </div>

                {/* Filtros y búsqueda */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Búsqueda */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar reserva
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por ID, producto o notas..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Filtro por estado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filtrar por estado
                            </label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="all">Todas las reservas</option>
                                <option value="pending">Pendientes</option>
                                <option value="confirmed">Confirmadas</option>
                                <option value="processing">En proceso</option>
                                <option value="completed">Completadas</option>
                                <option value="cancelled">Canceladas</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Cargando tus reservas...</p>
                    </div>
                ) : filteredReservations.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            {reservations.length === 0 ? 'No tienes reservas' : 'No se encontraron resultados'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {reservations.length === 0
                                ? '¡Comienza explorando nuestros productos y creando tu primera reserva!'
                                : 'No hay reservas que coincidan con tu búsqueda.'
                            }
                        </p>
                        <button
                            onClick={() => navigate('/products')}
                            className="inline-block bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            {reservations.length === 0 ? 'Explorar productos' : 'Ver todas las reservas'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredReservations.map(reservation => {
                            const statusConfig = getStatusConfig(reservation.status);
                            const isCancelable = ['pending', 'confirmed', 'processing'].includes(reservation.status);

                            return (
                                <div key={reservation.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-300">
                                    {/* Header de la reserva */}
                                    <div className="p-6 border-b border-gray-100">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                            <div className="mb-4 md:mb-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                                                        {statusConfig.icon}
                                                        {statusConfig.text}
                                                    </span>
                                                    <span className="text-sm text-gray-500 font-mono">
                                                        #{reservation.id.substring(0, 8).toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 flex items-center">
                                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {formatDate(reservation.created_at)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {formatCurrency(reservation.total_amount)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {reservation.items?.length || 0} producto(s)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Botones de acción */}
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {isCancelable && (
                                                <button
                                                    onClick={() => handleCancelReservation(reservation.id)}
                                                    className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Cancelar reserva
                                                </button>
                                            )}
                                            <button className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                                                Descargar comprobante
                                            </button>
                                            {reservation.consultant && (
                                                <button className="px-4 py-2 border border-purple-300 text-purple-600 hover:bg-purple-50 rounded-lg text-sm font-medium transition-colors">
                                                    Contactar consultora
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Información de la consultora */}
                                    {reservation.consultant && (
                                        <div className="px-6 py-4 bg-gray-50">
                                            <h4 className="font-medium text-gray-900 mb-3">Consultora asignada</h4>
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-linear-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {reservation.consultant.full_name?.[0]?.toUpperCase() || 'C'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{reservation.consultant.full_name}</p>
                                                    <div className="flex flex-wrap gap-3 mt-1">
                                                        {reservation.consultant.email && (
                                                            <a
                                                                href={`mailto:${reservation.consultant.email}`}
                                                                className="text-sm text-gray-600 hover:text-purple-600 flex items-center"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                {reservation.consultant.email}
                                                            </a>
                                                        )}
                                                        {reservation.consultant.phone && (
                                                            <a
                                                                href={`tel:${reservation.consultant.phone}`}
                                                                className="text-sm text-gray-600 hover:text-purple-600 flex items-center"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                </svg>
                                                                {reservation.consultant.phone}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Productos de la reserva */}
                                    <div className="px-6 py-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Productos reservados</h4>
                                        <div className="space-y-3">
                                            {reservation.items?.map((item, index) => (
                                                <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                    {/* Imagen del producto */}
                                                    <div className="shrink-0">
                                                        {item.product?.image_url ? (
                                                            <img
                                                                src={item.product.image_url}
                                                                alt={item.product.name}
                                                                className="w-16 h-16 object-cover rounded-lg"
                                                                onError={(e) => {
                                                                    e.target.src = `https://via.placeholder.com/64/F3F4F6/6B7280?text=${encodeURIComponent(item.product?.name?.substring(0, 1) || 'P')}`;
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 bg-linear-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                                                <span className="text-gray-400 text-2xl">📦</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Información del producto */}
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-medium text-gray-900 truncate">
                                                            {item.product?.name || 'Producto no disponible'}
                                                        </h5>
                                                        <p className="text-sm text-gray-600 line-clamp-1">
                                                            {item.product?.description || 'Sin descripción'}
                                                        </p>
                                                        <div className="flex items-center space-x-4 mt-2">
                                                            <span className="text-sm text-gray-700">
                                                                Cantidad: <span className="font-semibold">{item.quantity}</span>
                                                            </span>
                                                            <span className="text-sm text-gray-700">
                                                                Precio unitario: <span className="font-semibold">
                                                                    {formatCurrency(item.product?.current_price || item.unit_price)}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Subtotal */}
                                                    <div className="shrink-0 text-right">
                                                        <p className="font-semibold text-gray-900 text-lg">
                                                            {formatCurrency(item.subtotal)}
                                                        </p>
                                                        {item.product?.id && (
                                                            <button
                                                                onClick={() => navigate(`/product/${item.product.id}`)}
                                                                className="text-sm text-purple-600 hover:text-purple-700 mt-2 font-medium"
                                                            >
                                                                Ver producto →
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Información adicional */}
                                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Notas */}
                                            {reservation.notes && (
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-900 mb-1">Notas adicionales</h5>
                                                    <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                                                        {reservation.notes}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Método de contacto */}
                                            {reservation.contact_method && (
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-900 mb-1">Método de contacto preferido</h5>
                                                    <div className="flex items-center text-sm text-gray-700">
                                                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        {reservation.contact_method}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Última actualización */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-500">
                                                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Última actualización: {formatDate(reservation.updated_at || reservation.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Información adicional */}
                {!loading && reservations.length > 0 && (
                    <div className="mt-8 bg-linear-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                        <div className="flex flex-col md:flex-row items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Necesitas ayuda?</h3>
                                <p className="text-gray-600">
                                    Si tienes preguntas sobre tus reservas, contáctanos a través de nuestro soporte.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/contact')}
                                className="mt-4 md:mt-0 bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                Contactar soporte
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}