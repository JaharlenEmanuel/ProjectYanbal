// src/pages/admin/ConsultantsAdmin.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

export default function ConsultantsAdmin() {
    const [consultants, setConsultants] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingConsultant, setEditingConsultant] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        campaign_id: '',
        user_profile_id: '',
        contract_date: '',
        is_active: true
    });

    // Cargar datos
    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            // Cargar consultoras con datos relacionados
            const { data: consultantsData, error: consultantsError } = await supabase
                .from('consultants')
                .select(`
                    *,
                    campaign:campaign_id (id, name),
                    profile:user_profile_id (id, full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (consultantsError) throw consultantsError;
            setConsultants(consultantsData || []);

            // Cargar campañas para el select
            const { data: campaignsData } = await supabase
                .from('campaigns')
                .select('id, name')
                .order('name');
            setCampaigns(campaignsData || []);

            // Cargar usuarios para el select
            const { data: usersData } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name');
            setUsers(usersData || []);

        } catch (err) {
            setError('Error al cargar datos: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (editingConsultant) {
            setFormData({
                full_name: editingConsultant.full_name || '',
                email: editingConsultant.email || '',
                phone: editingConsultant.phone || '',
                address: editingConsultant.address || '',
                campaign_id: editingConsultant.campaign_id || '',
                user_profile_id: editingConsultant.user_profile_id || '',
                contract_date: editingConsultant.contract_date?.split('T')[0] || '',
                is_active: editingConsultant.is_active ?? true
            });
            setShowForm(true);
        }
    }, [editingConsultant]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        if (!formData.full_name.trim()) return { valid: false, error: 'El nombre es requerido' };
        if (!formData.email.trim()) return { valid: false, error: 'El email es requerido' };
        if (!formData.contract_date) return { valid: false, error: 'La fecha de contrato es requerida' };
        return { valid: true };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validation = validateForm();
        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const consultantData = {
                ...formData,
                contract_date: formData.contract_date,
                updated_at: new Date().toISOString()
            };

            if (editingConsultant) {
                // Actualizar
                const { error: updateError } = await supabase
                    .from('consultants')
                    .update(consultantData)
                    .eq('id', editingConsultant.id);

                if (updateError) throw updateError;
            } else {
                // Crear
                const { error: createError } = await supabase
                    .from('consultants')
                    .insert([{
                        ...consultantData,
                        created_at: new Date().toISOString()
                    }]);

                if (createError) throw createError;
            }

            await loadData();
            handleCancel();
        } catch (err) {
            setError('Error al guardar consultora: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            setLoading(true);

            const { error } = await supabase
                .from('consultants')
                .update({
                    is_active: !currentStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            await loadData();
        } catch (err) {
            setError('Error al cambiar estado: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta consultora?')) return;

        try {
            setLoading(true);

            // Verificar si hay reservas asociadas
            const { data: reservations } = await supabase
                .from('reservations')
                .select('id')
                .eq('consultant_id', id)
                .limit(1);

            if (reservations && reservations.length > 0) {
                setError('No se puede eliminar: Hay reservas asociadas a esta consultora');
                return;
            }

            const { error } = await supabase
                .from('consultants')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await loadData();
        } catch (err) {
            setError('Error al eliminar consultora: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingConsultant(null);
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            address: '',
            campaign_id: '',
            user_profile_id: '',
            contract_date: '',
            is_active: true
        });
        setError('');
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Consultoras</h1>
                    <p className="text-gray-600 mt-2">
                        Administra las consultoras del sistema ({consultants.length} registros)
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                    <span className="mr-2">➕</span>
                    Nueva Consultora
                </button>
            </div>

            {/* Mensajes de error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Formulario */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {editingConsultant ? 'Editar Consultora' : 'Nueva Consultora'}
                        </h2>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nombre Completo */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre Completo *
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="María García López"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="consultora@ejemplo.com"
                                />
                            </div>

                            {/* Teléfono */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="+34 600 000 000"
                                />
                            </div>

                            {/* Dirección */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Calle Principal 123, Ciudad"
                                />
                            </div>

                            {/* Campaña */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Campaña
                                </label>
                                <select
                                    name="campaign_id"
                                    value={formData.campaign_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Seleccionar campaña</option>
                                    {campaigns.map(campaign => (
                                        <option key={campaign.id} value={campaign.id}>
                                            {campaign.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Usuario asociado */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Usuario Asociado
                                </label>
                                <select
                                    name="user_profile_id"
                                    value={formData.user_profile_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Seleccionar usuario</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.full_name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Fecha de Contrato */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha de Contrato *
                                </label>
                                <input
                                    type="date"
                                    name="contract_date"
                                    value={formData.contract_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            {/* Estado */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                    Consultora activa
                                </label>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : editingConsultant ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabla de Consultoras */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading && consultants.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando consultoras...</p>
                    </div>
                ) : consultants.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No hay consultoras registradas
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Consultora
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Contacto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Campaña
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fecha Contrato
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {consultants.map(consultant => (
                                    <tr key={consultant.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {consultant.full_name}
                                            </div>
                                            {consultant.profile && (
                                                <div className="text-xs text-gray-500">
                                                    Usuario: {consultant.profile.full_name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{consultant.email}</div>
                                            {consultant.phone && (
                                                <div className="text-sm text-gray-600">{consultant.phone}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {consultant.campaign ? (
                                                <div className="text-sm text-gray-900">
                                                    {consultant.campaign.name}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">Sin campaña</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(consultant.contract_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(consultant.id, consultant.is_active)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${consultant.is_active
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                    }`}
                                            >
                                                {consultant.is_active ? 'Activa' : 'Inactiva'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => setEditingConsultant(consultant)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(consultant.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
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