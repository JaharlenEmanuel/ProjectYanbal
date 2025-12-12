// src/components/products/ProductForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { cloudinaryConfig } from '../../config/cloudinary';

export default function ProductForm({
    product,
    categories = [],
    onSubmit,
    onCancel
}) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        current_price: '',
        original_price: '',
        stock: '',
        category_id: '',
        image_url: '',
        is_active: true
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                current_price: product.current_price || '',
                original_price: product.original_price || '',
                stock: product.stock || '',
                category_id: product.category_id || '',
                image_url: product.image_url || '',
                is_active: product.is_active !== undefined ? product.is_active : true
            });

            if (product.image_url) {
                setImagePreview(product.image_url);
            }
        }
    }, [product]);

    // Función para subir imagen a Cloudinary
    const uploadImageToCloudinary = async (file) => {
        try {
            setUploadingImage(true);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', cloudinaryConfig.uploadPreset);
            formData.append('cloud_name', cloudinaryConfig.cloudName);

            // También puedes agregar tags para organizar las imágenes
            formData.append('tags', 'product, ecommerce');

            const response = await axios.post(cloudinaryConfig.uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    console.log(`Upload progress: ${percentCompleted}%`);
                }
            });

            if (response.data.secure_url) {
                return {
                    success: true,
                    url: response.data.secure_url,
                    publicId: response.data.public_id,
                    data: response.data
                };
            } else {
                throw new Error('No se recibió URL de Cloudinary');
            }
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        } finally {
            setUploadingImage(false);
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setMessage({
                type: 'error',
                text: 'Formato de imagen no válido. Use JPEG, PNG, GIF o WebP'
            });
            return;
        }

        // Validar tamaño (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setMessage({
                type: 'error',
                text: 'La imagen es muy grande. Máximo 5MB'
            });
            return;
        }

        // Crear preview local
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Subir a Cloudinary
        const result = await uploadImageToCloudinary(file);

        if (result.success) {
            setFormData(prev => ({
                ...prev,
                image_url: result.url
            }));
            setMessage({
                type: 'success',
                text: 'Imagen subida exitosamente!'
            });

            // Limpiar mensaje después de 3 segundos
            setTimeout(() => {
                setMessage(prev => prev.type === 'success' ? '' : prev);
            }, 3000);
        } else {
            setMessage({
                type: 'error',
                text: `Error al subir imagen: ${result.error}`
            });
            setImagePreview('');
        }
    };

    const removeImage = () => {
        setImagePreview('');
        setFormData(prev => ({
            ...prev,
            image_url: ''
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.current_price || Number(formData.current_price) <= 0) {
            newErrors.current_price = 'El precio actual debe ser mayor a 0';
        }

        if (formData.original_price && Number(formData.original_price) <= 0) {
            newErrors.original_price = 'El precio original debe ser mayor a 0';
        }

        if (!formData.stock || Number(formData.stock) < 0) {
            newErrors.stock = 'El stock debe ser 0 o mayor';
        }

        if (!formData.category_id) {
            newErrors.category_id = 'La categoría es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const productData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                current_price: Number(formData.current_price),
                original_price: formData.original_price ? Number(formData.original_price) : null,
                stock: Number(formData.stock),
                category_id: formData.category_id,
                image_url: formData.image_url || null,
                is_active: formData.is_active
            };

            const result = await onSubmit(productData);

            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                // Resetear formulario después de éxito
                if (!product) {
                    setFormData({
                        name: '',
                        description: '',
                        current_price: '',
                        original_price: '',
                        stock: '',
                        category_id: '',
                        image_url: '',
                        is_active: true
                    });
                    setImagePreview('');
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
                setTimeout(() => {
                    onCancel();
                }, 1500);
            } else {
                setMessage({ type: 'error', text: result.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error inesperado: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {product ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    type="button"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sección de Imagen */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Imagen del Producto
                    </label>

                    <div className="flex flex-col items-center justify-center">
                        {/* Preview de imagen */}
                        {imagePreview ? (
                            <div className="relative mb-4">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-64 h-64 object-cover rounded-lg border-2 border-gray-300"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center mb-4 bg-gray-50">
                                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-2 text-sm text-gray-500">Sube una imagen</p>
                                <p className="text-xs text-gray-400">PNG, JPG, GIF hasta 5MB</p>
                            </div>
                        )}

                        {/* Input de archivo */}
                        <div className="flex items-center space-x-4">
                            <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
                                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                {uploadingImage ? 'Subiendo...' : 'Seleccionar Imagen'}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    disabled={uploadingImage}
                                />
                            </label>

                            {uploadingImage && (
                                <div className="flex items-center text-gray-600">
                                    <svg className="animate-spin h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Subiendo...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* URL actual (solo para referencia) */}
                    {formData.image_url && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">URL de la imagen:</p>
                            <p className="text-xs text-gray-500 truncate">{formData.image_url}</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                            placeholder="Nombre del producto"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    {/* Descripción */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Descripción del producto"
                        />
                    </div>

                    {/* Precio actual */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio Actual *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                name="current_price"
                                value={formData.current_price}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.current_price ? 'border-red-300' : 'border-gray-300'}`}
                                placeholder="0.00"
                            />
                        </div>
                        {errors.current_price && <p className="mt-1 text-sm text-red-600">{errors.current_price}</p>}
                    </div>

                    {/* Precio original */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio Original (opcional)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                name="original_price"
                                value={formData.original_price}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.original_price ? 'border-red-300' : 'border-gray-300'}`}
                                placeholder="0.00"
                            />
                        </div>
                        {errors.original_price && <p className="mt-1 text-sm text-red-600">{errors.original_price}</p>}
                    </div>

                    {/* Stock */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock *
                        </label>
                        <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            min="0"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.stock ? 'border-red-300' : 'border-gray-300'}`}
                            placeholder="0"
                        />
                        {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoría *
                        </label>
                        <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.category_id ? 'border-red-300' : 'border-gray-300'}`}
                        >
                            <option value="">Seleccionar categoría</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
                    </div>

                    {/* Estado (solo en edición) */}
                    {product && (
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
                                Producto activo
                            </label>
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading || uploadingImage}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading || uploadingImage}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Procesando...
                            </>
                        ) : (
                            product ? 'Actualizar Producto' : 'Crear Producto'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}