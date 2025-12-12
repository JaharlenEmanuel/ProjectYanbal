// src/components/Notifications/NotificationSystem.jsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// Contexto para las notificaciones
const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification debe usarse dentro de NotificationProvider');
    }
    return context;
};

// Componente de notificación individual
const Notification = ({ id, type, title, message, onClose, autoClose }) => {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(() => {
                handleClose();
            }, autoClose);

            return () => clearTimeout(timer);
        }
    }, [autoClose]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            onClose(id);
        }, 300);
    }, [id, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'error':
                return (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            case 'warning':
                return (
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                );
            case 'info':
            default:
                return (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return 'border-green-200';
            case 'error': return 'border-red-200';
            case 'warning': return 'border-yellow-200';
            case 'info': default: return 'border-blue-200';
        }
    };

    return (
        <div className={`relative w-full max-w-md bg-white rounded-xl shadow-lg border ${getBorderColor()} overflow-hidden transition-all duration-300 ${isClosing ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}>
            {/* Barra de progreso para auto-close */}
            {autoClose && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 overflow-hidden">
                    <div
                        className={`h-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        style={{
                            animation: `shrink ${autoClose}ms linear forwards`
                        }}
                    />
                </div>
            )}

            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icono */}
                    {getIcon()}

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                        {title && (
                            <h4 className={`font-semibold text-sm mb-1 ${type === 'success' ? 'text-green-900' : type === 'error' ? 'text-red-900' : type === 'warning' ? 'text-yellow-900' : 'text-blue-900'}`}>
                                {title}
                            </h4>
                        )}
                        <p className="text-gray-700 text-sm">{message}</p>
                    </div>

                    {/* Botón de cerrar */}
                    <button
                        onClick={handleClose}
                        className="shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        aria-label="Cerrar notificación"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Estilos CSS para la animación de la barra de progreso
const ProgressBarStyles = () => (
    <style jsx="true">{`
        @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
        }
    `}</style>
);

// Componente contenedor de notificaciones
export const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <>
            <ProgressBarStyles />
            <div className="fixed top-4 right-4 z-1000 flex flex-col gap-3 w-full max-w-md">
                {notifications.map((notification) => (
                    <Notification
                        key={notification.id}
                        {...notification}
                        onClose={removeNotification}
                    />
                ))}
            </div>
        </>
    );
};

// Provider principal
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const notificationCounter = useRef(0);

    // Función para generar IDs únicos
    const generateUniqueId = useCallback(() => {
        notificationCounter.current += 1;
        return `notification-${Date.now()}-${notificationCounter.current}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const addNotification = useCallback((notification) => {
        const id = generateUniqueId();
        const newNotification = {
            id,
            type: notification.type || 'info',
            title: notification.title,
            message: notification.message,
            autoClose: notification.autoClose || 5000
        };

        setNotifications(prev => [newNotification, ...prev]);
        return id;
    }, [generateUniqueId]);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Métodos helper para tipos específicos
    const showSuccess = useCallback((message, title = '¡Éxito!', autoClose = 5000) => {
        return addNotification({ type: 'success', title, message, autoClose });
    }, [addNotification]);

    const showError = useCallback((message, title = 'Error', autoClose = 7000) => {
        return addNotification({ type: 'error', title, message, autoClose });
    }, [addNotification]);

    const showWarning = useCallback((message, title = 'Advertencia', autoClose = 6000) => {
        return addNotification({ type: 'warning', title, message, autoClose });
    }, [addNotification]);

    const showInfo = useCallback((message, title = 'Información', autoClose = 5000) => {
        return addNotification({ type: 'info', title, message, autoClose });
    }, [addNotification]);

    // Reemplazo para confirm()
    const showConfirm = useCallback(({
        title = 'Confirmar acción',
        message,
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        onConfirm,
        onCancel
    }) => {
        const id = generateUniqueId();

        const ConfirmNotification = () => {
            const [isClosing, setIsClosing] = useState(false);

            const handleClose = () => {
                setIsClosing(true);
                setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n.id !== id));
                    onCancel?.();
                }, 300);
            };

            const handleConfirm = () => {
                setIsClosing(true);
                setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n.id !== id));
                    onConfirm?.();
                }, 300);
            };

            return (
                <div className={`relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    <div className="p-6">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                            <p className="text-gray-600">{message}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleClose}
                                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg font-medium transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        setNotifications(prev => [
            {
                id,
                type: 'confirm',
                title,
                message,
                component: <ConfirmNotification key={id} />
            },
            ...prev
        ]);

        return id;
    }, [generateUniqueId]);

    const value = {
        notifications,
        addNotification,
        removeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
};