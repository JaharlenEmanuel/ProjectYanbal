// src/pages/admin/UsersAdmin.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../config/supabase'
import UserList from '../../components/users/UserList'
import UserForm from '../../components/users/UserForm'
import UserFilters from '../../components/users/UserFilters'

export default function UsersAdmin() {
    const { user } = useAuth()
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [filters, setFilters] = useState({
        search: '',
        role_id: '',
        is_active: ''
    })

    // Cargar usuarios y roles
    useEffect(() => {
        loadData()
    }, [filters])

    const loadData = async () => {
        try {
            setLoading(true)
            setError('')

            // Construir consulta de usuarios con filtros
            let query = supabase
                .from('profiles')
                .select('*, role:role_id(name)')
                .order('created_at', { ascending: false })

            // Aplicar filtros
            if (filters.search) {
                query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`)
            }
            if (filters.role_id) {
                query = query.eq('role_id', filters.role_id)
            }
            if (filters.is_active !== '') {
                query = query.eq('is_active', filters.is_active === 'true')
            }

            const { data: usersData, error: usersError } = await query

            if (usersError) throw usersError
            setUsers(usersData || [])

            // Cargar roles
            const { data: rolesData, error: rolesError } = await supabase
                .from('roles')
                .select('*')
                .order('name')

            if (rolesError) throw rolesError
            setRoles(rolesData || [])

        } catch (err) {
            setError('Error al cargar datos: ' + err.message)
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // En UsersAdmin.jsx, modifica las funciones para manejar el formulario:

    const handleCreateUser = async (result) => {
        // El formulario ahora maneja la creación, solo necesitamos actualizar la lista
        if (result && result.success && result.data) {
            setUsers([result.data, ...users]);
            return { success: true, message: result.message };
        }
        return { success: false, error: 'Error al crear usuario' };
    };

    const handleUpdateUser = async (id, userData) => {
        try {
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
                .eq('id', id)
                .select('*, role:role_id(name)')
                .single()

            if (error) throw error

            setUsers(users.map(u => u.id === id ? data : u))
            return { success: true, message: 'Usuario actualizado exitosamente', data }
        } catch (err) {
            return { success: false, error: err.message }
        }
    };


    const handleDeleteUser = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
            return { success: false, error: 'Cancelado por el usuario' }
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id)

            if (error) throw error

            setUsers(users.filter(u => u.id !== id))
            return { success: true, message: 'Usuario eliminado exitosamente' }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    is_active: !currentStatus,
                    updated_by: user.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('*, role:role_id(name)')
                .single()

            if (error) throw error

            setUsers(users.map(u => u.id === id ? data : u))
            return {
                success: true,
                message: `Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`
            }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }

    const handleChangeRole = async (userId, roleId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    role_id: roleId,
                    updated_by: user.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select('*, role:role_id(name)')
                .single()

            if (error) throw error

            setUsers(users.map(u => u.id === userId ? data : u))
            return { success: true, message: 'Rol actualizado exitosamente' }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }))
    }

    const handleClearFilters = () => {
        setFilters({
            search: '',
            role_id: '',
            is_active: ''
        })
    }

    // Actualizar UserList para incluir handleChangeRole
    const enhancedUserList = (props) => (
        <UserList
            {...props}
            onChangeRole={handleChangeRole}
        />
    )

    if (loading && users.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando usuarios...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-gray-600 mt-2">
                        Administra los usuarios del sistema ({users.length} registros)
                    </p>
                </div>
                <div className="mt-4 md:mt-0">
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                    >
                        <span>➕</span>
                        <span>Nuevo Usuario</span>
                    </button>
                </div>
            </div>

            {/* Mensajes de error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <UserFilters
                filters={filters}
                roles={roles}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />

            {/* Formulario */}
            {(showForm || editingUser) && (
                <UserForm
                    user={editingUser}
                    roles={roles}
                    onSubmit={editingUser ?
                        (data) => handleUpdateUser(editingUser.id, data) :
                        handleCreateUser
                    }
                    onCancel={() => {
                        setShowForm(false)
                        setEditingUser(null)
                    }}
                />
            )}

            {/* Lista de usuarios */}
            {enhancedUserList({
                users,
                roles,
                loading,
                onEdit: setEditingUser,
                onDelete: handleDeleteUser,
                onToggleStatus: handleToggleStatus
            })}

            {/* Estadísticas */}
            <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-lg mb-4">Estadísticas de Usuarios</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {users.filter(u => u.is_active).length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Activos</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                        <div className="text-2xl font-bold text-gray-600">
                            {users.filter(u => !u.is_active).length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Inactivos</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {roles.length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Roles</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {users.filter(u => u.role?.name === 'admin' || u.role_id === 1).length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Administradores</div>
                    </div>
                </div>
            </div>
        </div>
    )
}