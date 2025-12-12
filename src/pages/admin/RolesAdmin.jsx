// src/pages/admin/RolesAdmin.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

export default function RolesAdmin() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    // Cargar roles
    const loadRoles = async () => {
        try {
            setLoading(true);
            setError('');

            const { data, error: supabaseError } = await supabase
                .from('roles')
                .select('*, user_count:profiles(count)')
                .order('created_at', { ascending: false });

            if (supabaseError) throw supabaseError;
            setRoles(data || []);
        } catch (err) {
            setError('Error al cargar roles: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoles();
    }, []);

    useEffect(() => {
        if (editingRole) {
            setFormData({
                name: editingRole.name || '',
                description: editingRole.description || ''
            });
            setShowForm(true);
        }
    }, [editingRole]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('El nombre es requerido');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const roleData = {
                name: formData.name.trim(),
                description: formData.description.trim()
            };

            if (editingRole) {
                // Actualizar
                const { error: updateError } = await supabase
                    .from('roles')
                    .update(roleData)
                    .eq('id', editingRole.id);

                if (updateError) throw updateError;
            } else {
                // Crear
                const { error: createError } = await supabase
                    .from('roles')
                    .insert([{
                        ...roleData,
                        created_at: new Date().toISOString()
                    }]);

                if (createError) throw createError;
            }

            await loadRoles();
            handleCancel();
        } catch (err) {
            setError('Error al guardar rol: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);

            // Verificar si hay usuarios con este rol
            const { data: users } = await supabase
                .from('profiles')
                .select('id')
                .eq('role_id', id)
                .limit(1);

            if (users && users.length > 0) {
                setError('No se puede eliminar: Hay usuarios usando este rol');
                return;
            }

            const { error } = await supabase
                .from('roles')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await loadRoles();
        } catch (err) {
            setError('Error al eliminar rol: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingRole(null);
        setFormData({ name: '', description: '' });
        setError('');
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Roles</h1>
                    <p className="text-gray-600 mt-2">
                        Administra los roles del sistema ({roles.length} registros)
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                    <span className="mr-2">➕</span>
                    Nuevo Rol
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
                            {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
                        </h2>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                placeholder="Administrador, Usuario, Consultora..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Descripción del rol y sus permisos..."
                            />
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
                                {loading ? 'Guardando...' : editingRole ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabla de Roles */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading && roles.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando roles...</p>
                    </div>
                ) : roles.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No hay roles registrados
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Rol
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Descripción
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Usuarios
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fecha Creación
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {roles.map(role => (
                                    <tr key={role.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900">
                                                {role.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">
                                                {role.description || 'Sin descripción'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                {role.user_count?.[0]?.count || 0} usuarios
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(role.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => setEditingRole(role)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(role.id)}
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