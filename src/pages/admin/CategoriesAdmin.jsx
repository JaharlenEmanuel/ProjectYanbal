// src/pages/admin/CategoriesAdmin.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

export default function CategoriesAdmin() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    // Cargar categorías
    const loadCategories = async () => {
        try {
            setLoading(true);
            setError('');

            const { data, error: supabaseError } = await supabase
                .from('categories')
                .select('*')
                .order('created_at', { ascending: false });

            if (supabaseError) throw supabaseError;
            setCategories(data || []);
        } catch (err) {
            setError('Error al cargar categorías: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (editingCategory) {
            setFormData({
                name: editingCategory.name || '',
                description: editingCategory.description || ''
            });
            setShowForm(true);
        }
    }, [editingCategory]);

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

            const categoryData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                updated_at: new Date().toISOString()
            };

            if (editingCategory) {
                // Actualizar
                const { error: updateError } = await supabase
                    .from('categories')
                    .update(categoryData)
                    .eq('id', editingCategory.id);

                if (updateError) throw updateError;
            } else {
                // Crear
                const { error: createError } = await supabase
                    .from('categories')
                    .insert([{
                        ...categoryData,
                        created_at: new Date().toISOString()
                    }]);

                if (createError) throw createError;
            }

            await loadCategories();
            handleCancel();
        } catch (err) {
            setError('Error al guardar categoría: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;

        try {
            setLoading(true);

            // Verificar si hay productos usando esta categoría
            const { data: products } = await supabase
                .from('products')
                .select('id')
                .eq('category_id', id)
                .limit(1);

            if (products && products.length > 0) {
                setError('No se puede eliminar: Hay productos usando esta categoría');
                return;
            }

            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await loadCategories();
        } catch (err) {
            setError('Error al eliminar categoría: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
        setError('');
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h1>
                    <p className="text-gray-600 mt-2">
                        Administra las categorías de productos ({categories.length} registros)
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                    <span className="mr-2">➕</span>
                    Nueva Categoría
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
                            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
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
                                placeholder="Electrónica, Ropa, Hogar..."
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
                                placeholder="Descripción de la categoría..."
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
                                {loading ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grid de Categorías */}
            {loading && categories.length === 0 ? (
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando categorías...</p>
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <div className="text-4xl mb-4">📂</div>
                    <h3 className="text-xl font-semibold text-gray-700">No hay categorías</h3>
                    <p className="text-gray-500 mt-2">
                        Comienza agregando tu primera categoría
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map(category => (
                        <div key={category.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {category.name}
                                </h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setEditingCategory(category)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>

                            {category.description && (
                                <p className="text-gray-600 text-sm mb-4">
                                    {category.description}
                                </p>
                            )}

                            <div className="text-xs text-gray-500">
                                Creada: {new Date(category.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}