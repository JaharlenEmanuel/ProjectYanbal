// src/pages/client/Profile.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
    const { profile, updateProfile, changePassword } = useAuth();
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        address: "",
        email: ""
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [activeTab, setActiveTab] = useState("profile");
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    // Inicializar datos del formulario cuando el perfil esté disponible
    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || "",
                phone: profile.phone || "",
                address: profile.address || "",
                email: profile.email || ""
            });
        }
    }, [profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await updateProfile({
                full_name: formData.full_name,
                phone: formData.phone,
                address: formData.address
            });

            if (res.ok) {
                setMessage({
                    type: "success",
                    text: "Perfil actualizado correctamente"
                });

                // Limpiar mensaje después de 3 segundos
                setTimeout(() => {
                    setMessage({ type: "", text: "" });
                }, 3000);
            } else {
                setMessage({
                    type: "error",
                    text: res.error || "Error al actualizar el perfil"
                });
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: "Error inesperado al guardar"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        // Validaciones
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({
                type: "error",
                text: "Las contraseñas no coinciden"
            });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({
                type: "error",
                text: "La contraseña debe tener al menos 6 caracteres"
            });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await changePassword(passwordData.newPassword);

            if (res.ok) {
                setMessage({
                    type: "success",
                    text: "Contraseña actualizada correctamente"
                });

                // Limpiar formulario
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
                setShowPasswordForm(false);

                // Limpiar mensaje después de 3 segundos
                setTimeout(() => {
                    setMessage({ type: "", text: "" });
                }, 3000);
            } else {
                setMessage({
                    type: "error",
                    text: res.error || "Error al cambiar la contraseña"
                });
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: "Error inesperado al cambiar la contraseña"
            });
        } finally {
            setLoading(false);
        }
    };

    // Formatear fecha
    const formatDate = (dateString) => {
        if (!dateString) return "No disponible";
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header del perfil */}
                <div className="bg-linear-to-r from-purple-600 to-purple-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                                <span className="text-4xl font-bold">
                                    {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || "U"}
                                </span>
                            </div>
                            <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>

                        {/* Información básica */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold mb-2">
                                {profile.full_name || "Usuario"}
                            </h1>
                            <p className="text-purple-100 mb-4">
                                {profile.email}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    Miembro desde: {formatDate(profile.created_at)}
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    Rol: <span className="ml-1 bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">{profile.role || "Cliente"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Estadísticas (opcional) */}
                        <div className="grid grid-cols-3 gap-4 mt-4 md:mt-0">
                            <div className="text-center">
                                <div className="text-2xl font-bold">0</div>
                                <div className="text-sm text-purple-200">Pedidos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">0</div>
                                <div className="text-sm text-purple-200">Reservas</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">0</div>
                                <div className="text-sm text-purple-200">Favoritos</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs de navegación */}
                <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`flex-1 py-4 px-6 text-center font-medium text-sm ${activeTab === "profile"
                                    ? "border-b-2 border-purple-600 text-purple-600"
                                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Perfil
                            </button>
                            <button
                                onClick={() => setActiveTab("security")}
                                className={`flex-1 py-4 px-6 text-center font-medium text-sm ${activeTab === "security"
                                    ? "border-b-2 border-purple-600 text-purple-600"
                                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Seguridad
                            </button>
                            <button
                                onClick={() => setActiveTab("activity")}
                                className={`flex-1 py-4 px-6 text-center font-medium text-sm ${activeTab === "activity"
                                    ? "border-b-2 border-purple-600 text-purple-600"
                                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Actividad
                            </button>
                        </nav>
                    </div>

                    {/* Mensajes de éxito/error */}
                    {message.text && (
                        <div className={`m-6 p-4 rounded-lg ${message.type === "success"
                            ? "bg-green-50 border border-green-200 text-green-800"
                            : "bg-red-50 border border-red-200 text-red-800"
                            }`}>
                            <div className="flex items-center">
                                {message.type === "success" ? (
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span>{message.text}</span>
                            </div>
                        </div>
                    )}

                    {/* Contenido de la pestaña Perfil */}
                    {activeTab === "profile" && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información personal</h2>

                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Nombre completo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre completo *
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleInputChange}
                                                className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Tu nombre completo"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email (solo lectura) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Correo electrónico
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                readOnly
                                                className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-500"
                                                placeholder="tu@email.com"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
                                    </div>

                                    {/* Teléfono */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Teléfono
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="+34 123 456 789"
                                            />
                                        </div>
                                    </div>

                                    {/* Dirección */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Dirección
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Tu dirección completa"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Botones */}
                                <div className="flex justify-end pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({
                                                full_name: profile.full_name || "",
                                                phone: profile.phone || "",
                                                address: profile.address || "",
                                                email: profile.email || ""
                                            });
                                            setMessage({ type: "", text: "" });
                                        }}
                                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium mr-4"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Guardar cambios
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Contenido de la pestaña Seguridad */}
                    {activeTab === "security" && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Seguridad de la cuenta</h2>

                            {!showPasswordForm ? (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Cambiar contraseña</h3>
                                        <p className="text-gray-600 mb-4">
                                            Para mayor seguridad, te recomendamos cambiar tu contraseña periódicamente.
                                        </p>
                                        <button
                                            onClick={() => setShowPasswordForm(true)}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            Cambiar contraseña
                                        </button>
                                    </div>

                                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6">
                                        <h3 className="text-lg font-medium text-yellow-900 mb-2">Sesiones activas</h3>
                                        <p className="text-yellow-700 mb-4">
                                            Actualmente estás conectado desde este dispositivo.
                                        </p>
                                        <div className="flex items-center text-sm text-yellow-700">
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Sesión activa • {new Date().toLocaleDateString('es-ES')}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div className="space-y-4">
                                        {/* Contraseña actual */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contraseña actual
                                            </label>
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Introduce tu contraseña actual"
                                                required
                                            />
                                        </div>

                                        {/* Nueva contraseña */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nueva contraseña
                                            </label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Mínimo 6 caracteres"
                                                required
                                                minLength="6"
                                            />
                                        </div>

                                        {/* Confirmar contraseña */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirmar nueva contraseña
                                            </label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Repite la nueva contraseña"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Requisitos de contraseña */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">La contraseña debe contener:</h4>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li className={`flex items-center ${passwordData.newPassword.length >= 6 ? 'text-green-600' : ''}`}>
                                                <svg className={`w-4 h-4 mr-2 ${passwordData.newPassword.length >= 6 ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                    {passwordData.newPassword.length >= 6 ? (
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    ) : (
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                                    )}
                                                </svg>
                                                Al menos 6 caracteres
                                            </li>
                                            <li className={`flex items-center ${passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword ? 'text-green-600' : ''}`}>
                                                <svg className={`w-4 h-4 mr-2 ${passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                    {passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword ? (
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    ) : (
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                                    )}
                                                </svg>
                                                Las contraseñas deben coincidir
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Botones */}
                                    <div className="flex justify-end pt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPasswordForm(false);
                                                setPasswordData({
                                                    currentPassword: "",
                                                    newPassword: "",
                                                    confirmPassword: ""
                                                });
                                                setMessage({ type: "", text: "" });
                                            }}
                                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium mr-4"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            {loading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Cambiando...
                                                </>
                                            ) : (
                                                'Actualizar contraseña'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Contenido de la pestaña Actividad */}
                    {activeTab === "activity" && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Actividad reciente</h2>

                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-6 text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sin actividad reciente</h3>
                                    <p className="text-gray-600 mb-4">
                                        Aquí aparecerán tus pedidos, reservas y otras actividades cuando las realices.
                                    </p>
                                    <button
                                        onClick={() => window.location.href = '/products'}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                                    >
                                        Explorar productos
                                    </button>
                                </div>
                            </div>

                            {/* Estadísticas rápidas */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                                    <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                                    <div className="text-gray-600">Pedidos totales</div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                                    <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                                    <div className="text-gray-600">Reservas activas</div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                                    <div className="text-3xl font-bold text-purple-600 mb-2">$0</div>
                                    <div className="text-gray-600">Total gastado</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
}