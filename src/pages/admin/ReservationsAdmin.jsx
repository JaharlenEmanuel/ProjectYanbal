// src/pages/admin/ReservationsAdmin.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

export default function ReservationsAdmin() {
    const [reservations, setReservations] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // Estados para filtros
    const [filters, setFilters] = useState({
        status: '',
        consultant_id: '',
        user_profile_id: '',
        date_from: '',
        date_to: ''
    });

    // Cargar datos
    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            // Construir query base
            let query = supabase
                .from('reservations')
                .select(`
                    *,
                    user:user_profile_id (id, full_name, email, phone),
                    consultant:consultant_id (id, full_name, email)
                `)
                .order('created_at', { ascending: false });

            // Aplicar filtros
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.consultant_id) {
                query = query.eq('consultant_id', filters.consultant_id);
            }
            if (filters.user_profile_id) {
                query = query.eq('user_profile_id', filters.user_profile_id);
            }
            if (filters.date_from) {
                query = query.gte('created_at', filters.date_from + 'T00:00:00');
            }
            if (filters.date_to) {
                query = query.lte('created_at', filters.date_to + 'T23:59:59');
            }

            const { data: reservationsData, error: reservationsError } = await query;
            if (reservationsError) throw reservationsError;
            setReservations(reservationsData || []);

            // Cargar consultoras para filtros
            const { data: consultantsData } = await supabase
                .from('consultants')
                .select('id, full_name')
                .order('full_name');
            setConsultants(consultantsData || []);

            // Cargar usuarios para filtros
            const { data: usersData } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name');
            setUsers(usersData || []);

        } catch (err) {
            setError('Error al cargar reservas: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filters]);

    // Cargar detalles de una reserva
    const loadReservationDetails = async (reservationId) => {
        try {
            const { data: itemsData, error: itemsError } = await supabase
                .from('reservation_items')
                .select(`
                    *,
                    product:product_id (id, name, current_price, image_url),
                    pack:pack_id (id, name, price)
                `)
                .eq('reservation_id', reservationId);

            if (itemsError) throw itemsError;

            return itemsData || [];
        } catch (err) {
            console.error('Error loading reservation details:', err);
            return [];
        }
    };

    const handleStatusChange = async (reservationId, newStatus) => {
        try {
            setLoading(true);

            const { error } = await supabase
                .from('reservations')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reservationId);

            if (error) throw error;
            await loadData();
        } catch (err) {
            setError('Error al actualizar estado: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (reservation) => {
        setSelectedReservation(reservation);
        const items = await loadReservationDetails(reservation.id);
        setSelectedReservation(prev => ({ ...prev, items }));
        setShowDetails(true);
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            status: '',
            consultant_id: '',
            user_profile_id: '',
            date_from: '',
            date_to: ''
        });
    };

    // Estadísticas
    const stats = {
        total: reservations.length,
        pending: reservations.filter(r => r.status === 'pending').length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        completed: reservations.filter(r => r.status === 'completed').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length,
        totalAmount: reservations.reduce((sum, r) => sum + Number(r.total_amount || 0), 0)
    };

    // Opciones de estado
    const statusOptions = [
        { value: 'pending', label: 'Pendiente', color: 'yellow' },
        { value: 'confirmed', label: 'Confirmada', color: 'blue' },
        { value: 'completed', label: 'Completada', color: 'green' },
        { value: 'cancelled', label: 'Cancelada', color: 'red' }
    ];

    const getStatusColor = (status) => {
        const option = statusOptions.find(s => s.value === status);
        return option ? option.color : 'gray';
    };

    const getStatusLabel = (status) => {
        const option = statusOptions.find(s => s.value === status);
        return option ? option.label : status;
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Reservas</h1>
                    <p className="text-gray-600 mt-2">
                        Administra las reservas de clientes ({reservations.length} registros)
                    </p>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-sm text-gray-600">Pendientes</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
                    <div className="text-sm text-gray-600">Confirmadas</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    <div className="text-sm text-gray-600">Completadas</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                    <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                    <div className="text-sm text-gray-600">Canceladas</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
                    <div className="text-2xl font-bold text-purple-600">
                        ${stats.totalAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Valor Total</div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Estado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">Todos los estados</option>
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Consultora */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Consultora
                        </label>
                        <select
                            value={filters.consultant_id}
                            onChange={(e) => handleFilterChange('consultant_id', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">Todas las consultoras</option>
                            {consultants.map(consultant => (
                                <option key={consultant.id} value={consultant.id}>
                                    {consultant.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cliente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cliente
                        </label>
                        <select
                            value={filters.user_profile_id}
                            onChange={(e) => handleFilterChange('user_profile_id', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">Todos los clientes</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha Desde */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Desde
                        </label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>

                    {/* Fecha Hasta */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hasta
                        </label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>

                    {/* Botones de filtro */}
                    <div className="flex items-end space-x-2">
                        <button
                            onClick={handleClearFilters}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla de Reservas */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading && reservations.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando reservas...</p>
                    </div>
                ) : reservations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No hay reservas {Object.values(filters).some(f => f) ? 'con estos filtros' : 'registradas'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Consultora
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
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reservations.map(reservation => (
                                    <tr key={reservation.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {reservation.id.substring(0, 8)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {reservation.user?.full_name || 'Cliente no encontrado'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {reservation.contact_method && `Método: ${reservation.contact_method}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {reservation.consultant?.full_name || 'Sin consultora'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={reservation.status}
                                                onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                                                className={`text-sm rounded-md border-0 py-1 pl-3 pr-8 focus:ring-2 focus:ring-inset focus:ring-indigo-600 ${getStatusColor(reservation.status) === 'yellow' ? 'bg-yellow-50 text-yellow-800' :
                                                        getStatusColor(reservation.status) === 'blue' ? 'bg-blue-50 text-blue-800' :
                                                            getStatusColor(reservation.status) === 'green' ? 'bg-green-50 text-green-800' :
                                                                getStatusColor(reservation.status) === 'red' ? 'bg-red-50 text-red-800' :
                                                                    'bg-gray-50 text-gray-800'
                                                    }`}
                                            >
                                                {statusOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">
                                                ${Number(reservation.total_amount || 0).toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(reservation.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(reservation.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewDetails(reservation)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Detalles
                                                </button>
                                                {reservation.notes && (
                                                    <span className="text-gray-400 cursor-help" title={reservation.notes}>
                                                        📝
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Detalles */}
            {showDetails && selectedReservation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Detalles de la Reserva
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowDetails(false);
                                        setSelectedReservation(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Información general */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Información del Cliente</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-600">Nombre:</span>
                                            <p className="font-medium">{selectedReservation.user?.full_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Email:</span>
                                            <p className="font-medium">{selectedReservation.user?.email}</p>
                                        </div>
                                        {selectedReservation.user?.phone && (
                                            <div>
                                                <span className="text-sm text-gray-600">Teléfono:</span>
                                                <p className="font-medium">{selectedReservation.user.phone}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-sm text-gray-600">Método de contacto:</span>
                                            <p className="font-medium capitalize">{selectedReservation.contact_method || 'No especificado'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Información de la Reserva</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-600">Consultora:</span>
                                            <p className="font-medium">{selectedReservation.consultant?.full_name || 'Sin consultora'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Estado:</span>
                                            <select
                                                value={selectedReservation.status}
                                                onChange={(e) => {
                                                    handleStatusChange(selectedReservation.id, e.target.value);
                                                    setSelectedReservation(prev => ({
                                                        ...prev,
                                                        status: e.target.value
                                                    }));
                                                }}
                                                className={`ml-2 text-sm rounded-md border-0 py-1 px-3 focus:ring-2 focus:ring-inset focus:ring-indigo-600 ${getStatusColor(selectedReservation.status) === 'yellow' ? 'bg-yellow-50 text-yellow-800' :
                                                        getStatusColor(selectedReservation.status) === 'blue' ? 'bg-blue-50 text-blue-800' :
                                                            getStatusColor(selectedReservation.status) === 'green' ? 'bg-green-50 text-green-800' :
                                                                getStatusColor(selectedReservation.status) === 'red' ? 'bg-red-50 text-red-800' :
                                                                    'bg-gray-50 text-gray-800'
                                                    }`}
                                            >
                                                {statusOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Fecha creación:</span>
                                            <p className="font-medium">
                                                {new Date(selectedReservation.created_at).toLocaleDateString()} {new Date(selectedReservation.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        {selectedReservation.updated_at && (
                                            <div>
                                                <span className="text-sm text-gray-600">Última actualización:</span>
                                                <p className="font-medium">
                                                    {new Date(selectedReservation.updated_at).toLocaleDateString()} {new Date(selectedReservation.updated_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notas */}
                            {selectedReservation.notes && (
                                <div className="mb-8">
                                    <h3 className="font-semibold text-gray-700 mb-3">Notas</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-700">{selectedReservation.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Items de la reserva */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Productos Reservados</h3>
                                {selectedReservation.items && selectedReservation.items.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Producto
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Cantidad
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Precio Unitario
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Subtotal
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {selectedReservation.items.map((item, index) => (
                                                    <tr key={item.id || index}>
                                                        <td className="px-4 py-4">
                                                            <div className="font-medium text-gray-900">
                                                                {item.product?.name || item.pack?.name || 'Producto no encontrado'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-gray-900">{item.quantity}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-gray-900">
                                                                ${Number(item.unit_price || 0).toFixed(2)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="font-semibold text-gray-900">
                                                                ${Number(item.subtotal || 0).toFixed(2)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50">
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-4 text-right font-semibold text-gray-900">
                                                        Total:
                                                    </td>
                                                    <td className="px-4 py-4 font-bold text-lg text-gray-900">
                                                        ${Number(selectedReservation.total_amount || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No hay productos en esta reserva
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}