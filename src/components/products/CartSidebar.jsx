// src/components/products/CartSidebar.jsx
import React from 'react';

export default function CartSidebar({
    isOpen,
    onClose,
    cart,
    onUpdateQuantity,
    onRemoveItem,
    total,
    onOrder,
    onClearCart,
    isAdmin = false
}) {
    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white z-50 flex flex-col shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">
                        🛒 Carrito ({cart.reduce((total, item) => total + item.quantity, 0)})
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-6">
                    {cart.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🛒</div>
                            <h3 className="text-lg font-semibold text-gray-700">Carrito vacío</h3>
                            <p className="text-gray-500 mt-2">Agrega productos al carrito</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="shrink-0 w-16 h-16 bg-gray-200 rounded overflow-hidden">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <span className="text-xl">📦</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 truncate">
                                            {item.name}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            ${Number(item.current_price || 0).toFixed(2)} × {item.quantity}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            ${(Number(item.current_price || 0) * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => onRemoveItem(item.id)}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="border-t p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">Total:</span>
                            <span className="text-2xl font-bold text-purple-600">
                                ${total.toFixed(2)}
                            </span>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={onClearCart}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                            >
                                Vaciar Carrito
                            </button>
                            <button
                                onClick={onOrder}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                {isAdmin ? 'Crear Orden' : 'Completar Compra'}
                            </button>
                        </div>

                        {isAdmin && (
                            <p className="text-sm text-gray-500 text-center">
                                Esta orden se creará en el sistema administrativo
                            </p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}