// src/pages/admin/CampaignsAdmin.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

export default function CampaignsAdmin() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        start_date: '',
        end_date: '',
        is_active: true
    });

    // Cargar campañas
    const loadCampaigns = async () => {
        try {
            setLoading(true);
            setError('');

            const { data, error: supabaseError } = await supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            if (supabaseError) throw supabaseError;
            setCampaigns(data || []);
        } catch (err) {
            setError('Error al cargar campañas: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    // Inicializar formulario para edición
    useEffect(() => {
        if (editingCampaign) {
            setFormData({
                code: editingCampaign.code || '',
                name: editingCampaign.name || '',
                start_date: editingCampaign.start_date?.split('T')[0] || '',
                end_date: editingCampaign.end_date?.split('T')[0] || '',
                is_active: editingCampaign.is_active ?? true
            });
            setShowForm(true);
        }
    }, [editingCampaign]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        if (!formData.code.trim()) return { valid: false, error: 'El código es requerido' };
        if (!formData.name.trim()) return { valid: false, error: 'El nombre es requerido' };
        if (!formData.start_date) return { valid: false, error: 'La fecha de inicio es requerida' };
        if (!formData.end_date) return { valid: false, error: 'La fecha de fin es requerida' };

        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        if (end < start) return { valid: false, error: 'La fecha de fin debe ser posterior a la de inicio' };

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

            const campaignData = {
                ...formData,
                start_date: formData.start_date,
                end_date: formData.end_date,
                updated_at: new Date().toISOString()
            };

            if (editingCampaign) {
                // Actualizar
                const { error: updateError } = await supabase
                    .from('campaigns')
                    .update(campaignData)
                    .eq('id', editingCampaign.id);

                if (updateError) throw updateError;
            } else {
                // Crear
                const { error: createError } = await supabase
                    .from('campaigns')
                    .insert([{
                        ...campaignData,
                        created_at: new Date().toISOString()
                    }]);

                if (createError) throw createError;
            }

            await loadCampaigns();
            handleCancel();
        } catch (err) {
            setError('Error al guardar campaña: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            setLoading(true);

            const { error } = await supabase
                .from('campaigns')
                .update({
                    is_active: !currentStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            await loadCampaigns();
        } catch (err) {
            setError('Error al cambiar estado: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta campaña?')) return;

        try {
            setLoading(true);

            const { error } = await supabase
                .from('campaigns')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await loadCampaigns();
        } catch (err) {
            setError('Error al eliminar campaña: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingCampaign(null);
        setFormData({
            code: '',
            name: '',
            start_date: '',
            end_date: '',
            is_active: true
        });
        setError('');
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Campañas</h1>
                    <p className="text-gray-600 mt-2">
                        Administra las campañas del sistema ({campaigns.length} registros)
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                    <span className="mr-2">➕</span>
                    Nueva Campaña
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
                            {editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
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
                            {/* Código */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Código *
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="CAM-001"
                                />
                            </div>

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Campaña de Verano"
                                />
                            </div>

                            {/* Fecha Inicio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha Inicio *
                                </label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            {/* Fecha Fin */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha Fin *
                                </label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
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
                                    Campaña activa
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
                                {loading ? 'Guardando...' : editingCampaign ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabla de Campañas */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading && campaigns.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando campañas...</p>
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No hay campañas registradas
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Código
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Nombre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fechas
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
                                {campaigns.map(campaign => {
                                    const startDate = new Date(campaign.start_date).toLocaleDateString();
                                    const endDate = new Date(campaign.end_date).toLocaleDateString();
                                    const isActive = campaign.is_active;
                                    const isExpired = new Date(campaign.end_date) < new Date();

                                    return (
                                        <tr key={campaign.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">
                                                    {campaign.code}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{campaign.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {startDate} - {endDate}
                                                </div>
                                                {isExpired && (
                                                    <div className="text-xs text-red-500 mt-1">
                                                        Expirada
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleStatus(campaign.id, isActive)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${isActive
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {isActive ? 'Activa' : 'Inactiva'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => setEditingCampaign(campaign)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(campaign.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}