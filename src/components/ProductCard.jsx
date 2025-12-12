// src/components/ProductCard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "./Notifications/NotificationSystem";

export default function ProductCard({ product, onAdd }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [imageError, setImageError] = useState(false);
    const navigate = useNavigate();
    const { showSuccess, showError, showWarning } = useNotification();

    const {
        id,
        name,
        description,
        current_price,
        original_price,
        stock,
        image_url,
        category,
        is_active = true
    } = product;

    // Calcular descuento
    const discount = original_price && original_price > current_price
        ? Math.round(((original_price - current_price) / original_price) * 100)
        : 0;

    const handleAddClick = async (e) => {
        e.stopPropagation();

        if ((stock !== undefined && stock <= 0) || is_active === false) {
            showWarning(
                "Este producto no está disponible actualmente",
                "Producto no disponible"
            );
            return;
        }

        setIsAdding(true);
        try {
            const result = await onAdd(product);

            // Mostrar notificación de éxito si onAdd no lanza error
            showSuccess(
                `${name} se agregó al carrito`,
                "¡Producto agregado!"
            );

            return result;
        } catch (error) {
            console.error("Error adding product:", error);

            // Mostrar error específico si está disponible
            const errorMessage = error?.message || "No se pudo agregar el producto al carrito";
            showError(
                errorMessage,
                "Error al agregar"
            );

            throw error;
        } finally {
            setIsAdding(false);
        }
    };

    // Colores para diferentes estados de stock
    const getStockBadge = () => {
        if (stock === undefined || stock === null) {
            return {
                text: "Disponible",
                color: "bg-linear-to-r from-green-500 to-emerald-500 text-white",
                icon: (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )
            };
        }

        if (stock <= 0) {
            return {
                text: "Agotado",
                color: "bg-linear-to-r from-red-500 to-pink-500 text-white",
                icon: (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )
            };
        }

        if (stock <= 5) {
            return {
                text: `Últimas ${stock}`,
                color: "bg-linear-to-r from-yellow-500 to-orange-500 text-white",
                icon: (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                )
            };
        }

        if (is_active === false) {
            return {
                text: "No disponible",
                color: "bg-linear-to-r from-gray-500 to-gray-600 text-white",
                icon: (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            };
        }

        return {
            text: "Disponible",
            color: "bg-linear-to-r from-green-500 to-emerald-500 text-white",
            icon: (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            )
        };
    };

    const isProductAvailable = () => {
        if (stock === undefined || stock === null) return true;
        if (is_active === false) return false;
        return stock > 0;
    };

    const stockBadge = getStockBadge();
    const available = isProductAvailable();

    const handleQuickView = (e) => {
        e?.stopPropagation();
        navigate(`/product/${id}`);
    };

    const handleCardClick = (e) => {
        // Solo navegar si no se hizo click en un botón o enlace
        if (!e.target.closest('button') && !e.target.closest('a')) {
            handleQuickView(e);
        }
    };

    return (
        <div
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 flex flex-col h-full cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleQuickView();
                }
            }}
            aria-label={`Ver detalles de ${name}`}
        >
            {/* Badge de descuento */}
            {discount > 0 && (
                <div className="absolute top-3 left-3 z-10 animate-fade-in">
                    <span className="bg-linear-to-r from-red-500 to-pink-600 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm bg-opacity-95">
                        -{discount}% OFF
                    </span>
                </div>
            )}

            {/* Badge de stock */}
            <div className="absolute top-3 right-3 z-10">
                <span className={`${stockBadge.color} text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-sm bg-opacity-95`}>
                    <span className="flex items-center">{stockBadge.icon}</span>
                    <span>{stockBadge.text}</span>
                </span>
            </div>

            {/* Contenedor de imagen */}
            <div className="relative overflow-hidden h-48 bg-linear-to-br from-gray-50 to-gray-100">
                {image_url && !imageError ? (
                    <>
                        <img
                            src={image_url}
                            alt={name}
                            className={`w-full h-full object-cover transition-all duration-700 ${isHovered ? 'scale-110 brightness-105' : 'scale-100 brightness-100'}`}
                            onError={() => setImageError(true)}
                            loading="lazy"
                        />
                        {/* Overlay linear en hover */}
                        {isHovered && (
                            <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent transition-opacity duration-300" />
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-linear-to-br from-gray-100 to-gray-200">
                        <div className="text-5xl mb-3 text-gray-400">📦</div>
                        <div className="text-gray-500 text-center text-sm font-medium px-4">
                            {name?.substring(0, 20) || 'Imagen no disponible'}
                        </div>
                    </div>
                )}

                {/* Quick view overlay en hover */}
                {isHovered && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity duration-300">
                        <div className="transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <button
                                onClick={handleQuickView}
                                className="bg-white/95 backdrop-blur-sm text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                                aria-label={`Ver detalles rápidos de ${name}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Vista rápida
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Contenido */}
            <div className="p-5 flex flex-col grow">
                {/* Categoría */}
                {category && (
                    <div className="mb-2">
                        <span className="inline-block bg-linear-to-r from-purple-50 to-blue-50 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-full border border-purple-200">
                            {category.name || category}
                        </span>
                    </div>
                )}

                {/* Nombre del producto */}
                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
                    {name}
                </h3>

                {/* Descripción */}
                {description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 grow">
                        {description}
                    </p>
                )}

                {/* Precios */}
                <div className="mb-5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-2xl font-bold text-gray-900">
                            ${Number(current_price || 0).toFixed(2)}
                        </span>

                        {original_price && original_price > current_price && (
                            <>
                                <span className="text-lg text-gray-400 line-through">
                                    ${Number(original_price).toFixed(2)}
                                </span>
                                <span className="text-sm font-semibold bg-linear-to-r from-red-500 to-pink-500 text-transparent bg-clip-text ml-auto">
                                    Ahorras ${(original_price - current_price).toFixed(2)}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Indicador de stock bajo */}
                    {stock > 0 && stock <= 5 && (
                        <div className="mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ¡Solo {stock} {stock === 1 ? 'unidad' : 'unidades'} disponible{stock === 1 ? '' : 's'}!
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer con botón de acción */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                    <button
                        onClick={handleAddClick}
                        disabled={!available || isAdding}
                        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn relative overflow-hidden ${!available
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-linear-to-r from-purple-600 via-purple-500 to-blue-600 hover:from-purple-700 hover:via-purple-600 hover:to-blue-700 text-white shadow-md hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                            }`}
                        aria-label={`Agregar ${name} al carrito`}
                    >
                        {/* Efecto de brillo en hover */}
                        {available && (
                            <span className="absolute inset-0 w-full h-full bg-linear-to-r from-white/0 via-white/20 to-white/0 translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                        )}

                        {isAdding ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="relative">Agregando...</span>
                            </>
                        ) : !available ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="relative">No disponible</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                <span className="relative">Agregar al carrito</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Efecto sutil de borde en hover */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-300/30 rounded-2xl transition-all duration-300 pointer-events-none"></div>
        </div>
    );
}