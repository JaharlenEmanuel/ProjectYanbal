// src/components/users/UserFilters.jsx
import React, { useState } from 'react'

export default function UserFilters({ filters, roles, onFilterChange, onClearFilters }) {
    const [localFilters, setLocalFilters] = useState(filters)

    const handleChange = (e) => {
        const { name, value } = e.target
        const newFilters = { ...localFilters, [name]: value }
        setLocalFilters(newFilters)
    }

    const handleApply = () => {
        onFilterChange(localFilters)
    }

    const handleClear = () => {
        const clearedFilters = {
            search: '',
            role_id: '',
            is_active: ''
        }
        setLocalFilters(clearedFilters)
        onClearFilters()
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleApply()
        }
    }

    const hasFilters = filters.search || filters.role_id || filters.is_active !== ''

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filtros de búsqueda</h3>
                {hasFilters && (
                    <button
                        onClick={handleClear}
                        className="text-sm text-purple-600 hover:text-purple-800 transition-colors"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Búsqueda por texto */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buscar
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            name="search"
                            value={localFilters.search}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            placeholder="Nombre o email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Filtro por rol */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rol
                    </label>
                    <select
                        name="role_id"
                        value={localFilters.role_id}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="">Todos los roles</option>
                        {Array.isArray(roles) && roles.map(role => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtro por estado */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                    </label>
                    <select
                        name="is_active"
                        value={localFilters.is_active}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="">Todos los estados</option>
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                    </select>
                </div>

                {/* Botones */}
                <div className="flex items-end space-x-3">
                    <button
                        onClick={handleApply}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                    >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Aplicar filtros
                    </button>
                </div>
            </div>

            {/* Filtros activos */}
            {hasFilters && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-600 mr-2">Filtros aplicados:</span>

                        {filters.search && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                                Búsqueda: "{filters.search}"
                                <button
                                    onClick={() => onFilterChange({ search: '' })}
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.role_id && roles.find(r => r.id === filters.role_id) && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                                Rol: {roles.find(r => r.id === filters.role_id)?.name}
                                <button
                                    onClick={() => onFilterChange({ role_id: '' })}
                                    className="ml-2 text-purple-600 hover:text-purple-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.is_active !== '' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                Estado: {filters.is_active === 'true' ? 'Activo' : 'Inactivo'}
                                <button
                                    onClick={() => onFilterChange({ is_active: '' })}
                                    className="ml-2 text-green-600 hover:text-green-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}