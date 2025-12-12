// src/components/users/UserForm.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../config/supabase'

export default function UserForm({ user, roles, onSubmit, onCancel }) {
    const { register } = useAuth()
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        role_id: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
        is_active: true
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    // Inicializar formulario cuando se edita un usuario
    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                full_name: user.full_name || '',
                role_id: user.role_id || '',
                phone: user.phone || '',
                address: user.address || '',
                password: '',
                confirmPassword: '',
                is_active: user.is_active !== undefined ? user.is_active : true
            })
        }
    }, [user])

    const validateForm = () => {
        const newErrors = {}

        // Validar email
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'El email no es válido'
        }

        // Validar nombre
        if (!formData.full_name.trim()) {
            newErrors.full_name = 'El nombre es requerido'
        }

        // Validar rol
        if (!formData.role_id) {
            newErrors.role_id = 'El rol es requerido'
        }

        // Validar contraseña (solo para nuevo usuario)
        if (!user) {
            if (!formData.password) {
                newErrors.password = 'La contraseña es requerida'
            } else if (formData.password.length < 6) {
                newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden'
            }
        } else if (formData.password && formData.password.length < 6) {
            // Si se está editando y se cambia la contraseña
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        // Limpiar error al escribir
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    // Función para crear usuario en Supabase Auth y tabla profiles
    const createUserWithProfile = async (userData) => {
        try {
            // Paso 1: Registrar en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.full_name,
                        role_id: userData.role_id
                    }
                }
            })

            if (authError) {
                return { success: false, error: authError.message }
            }

            if (!authData.user) {
                return { success: false, error: 'No se pudo crear el usuario de autenticación' }
            }

            // Paso 2: Insertar en la tabla profiles
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id, // Este es el auth_id en tu tabla
                        email: userData.email,
                        full_name: userData.full_name,
                        phone: userData.phone || '',
                        address: userData.address || '',
                        role_id: userData.role_id,
                        is_active: userData.is_active !== undefined ? userData.is_active : true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ])
                .select('*, role:role_id(name)')
                .single()

            if (profileError) {
                // Si falla el perfil, podrías querer revertir la creación del usuario auth
                console.error('Error creating profile:', profileError)
                return { success: false, error: profileError.message }
            }

            return {
                success: true,
                message: 'Usuario creado exitosamente',
                data: profileData
            }

        } catch (err) {
            console.error('Error in createUserWithProfile:', err)
            return { success: false, error: err.message }
        }
    }

    // Función para actualizar usuario en tabla profiles
    const updateUserProfile = async (userId, userData) => {
        try {
            // Actualizar en la tabla profiles
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    full_name: userData.full_name,
                    phone: userData.phone || '',
                    address: userData.address || '',
                    role_id: userData.role_id,
                    is_active: userData.is_active,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select('*, role:role_id(name)')
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            return {
                success: true,
                message: 'Usuario actualizado exitosamente',
                data
            }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)
        setMessage('')

        try {
            if (user) {
                // Editar usuario existente
                const userData = {
                    full_name: formData.full_name.trim(),
                    phone: formData.phone.trim(),
                    address: formData.address.trim(),
                    role_id: formData.role_id,
                    is_active: formData.is_active
                }

                const result = await updateUserProfile(user.id, userData)

                if (result.success) {
                    setMessage({ type: 'success', text: result.message })
                    // Pasar el resultado al componente padre para actualizar la lista
                    if (typeof onSubmit === 'function') {
                        onSubmit(result)
                    }
                    // Cerrar después de éxito en edición
                    setTimeout(() => {
                        onCancel()
                    }, 1000)
                } else {
                    setMessage({ type: 'error', text: result.error })
                }
            } else {
                // Crear nuevo usuario
                const userData = {
                    email: formData.email.trim(),
                    full_name: formData.full_name.trim(),
                    phone: formData.phone.trim(),
                    address: formData.address.trim(),
                    role_id: formData.role_id,
                    password: formData.password,
                    is_active: formData.is_active
                }

                const result = await createUserWithProfile(userData)

                if (result.success) {
                    setMessage({ type: 'success', text: result.message })
                    // Pasar el resultado al componente padre para actualizar la lista
                    if (typeof onSubmit === 'function') {
                        onSubmit(result)
                    }
                    // Limpiar formulario
                    setFormData({
                        email: '',
                        full_name: '',
                        role_id: '',
                        phone: '',
                        address: '',
                        password: '',
                        confirmPassword: '',
                        is_active: true
                    })
                } else {
                    setMessage({ type: 'error', text: result.error })
                }
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error inesperado: ' + err.message })
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        if (onCancel) {
            onCancel()
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {user ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
                <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    type="button"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Mensajes */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className={user ? 'opacity-70' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!!user} // No permitir cambiar email en edición
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                            placeholder="usuario@ejemplo.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                        {user && (
                            <p className="mt-1 text-xs text-gray-500">El email no se puede modificar</p>
                        )}
                    </div>

                    {/* Nombre completo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre completo *
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.full_name ? 'border-red-300' : 'border-gray-300'}`}
                            placeholder="Juan Pérez"
                        />
                        {errors.full_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                        )}
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
                            placeholder="+34 123 456 789"
                        />
                    </div>

                    {/* Dirección */}
                    <div>
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

                    {/* Rol */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rol *
                        </label>
                        <select
                            name="role_id"
                            value={formData.role_id}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.role_id ? 'border-red-300' : 'border-gray-300'}`}
                        >
                            <option value="">Seleccionar rol</option>
                            {Array.isArray(roles) && roles.map(role => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                        {errors.role_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.role_id}</p>
                        )}
                    </div>

                    {/* Contraseña (solo para nuevo o si se desea cambiar) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {user ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
                    </div>

                    {/* Confirmar contraseña (solo si hay contraseña) */}
                    {(formData.password || !user) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmar contraseña {!user && '*'}
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>
                    )}

                    {/* Estado (solo en edición) */}
                    {user && (
                        <div className="flex items-center col-span-1 md:col-span-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                Usuario activo
                            </label>
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
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
                            user ? 'Actualizar Usuario' : 'Crear Usuario'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}