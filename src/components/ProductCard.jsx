// src/components/ProductCard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProductCard({ product, onAdd }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [imageError, setImageError] = useState(false);
    const navigate = useNavigate();

    const {
        id,
        name,
        description,
        current_price,
        original_price,
        stock,
        image_url,
        category,
        is_active = true // Valor por defecto si no viene
    } = product;

    // Calcular descuento si hay precio original
    const discount = original_price && original_price > current_price
        ? Math.round(((original_price - current_price) / original_price) * 100)
        : 0;

    const handleAddClick = async () => {
        // Solo deshabilitar si stock es 0 o menor, o si is_active es false explícitamente
        if ((stock !== undefined && stock <= 0) || is_active === false) {
            return;
        }

        setIsAdding(true);
        try {
            await onAdd(product);
        } finally {
            setIsAdding(false);
        }
    };

    // Colores para diferentes estados de stock
    const getStockBadge = () => {
        // Si no tenemos información de stock, asumimos disponible
        if (stock === undefined || stock === null) {
            return { text: "Disponible", color: "bg-green-500 text-white", icon: "✓" };
        }

        if (stock <= 0) {
            return { text: "Agotado", color: "bg-red-500 text-white", icon: "✖️" };
        }
        if (stock <= 5) {
            return { text: `Últimas ${stock}`, color: "bg-yellow-500 text-white", icon: "⚡" };
        }
        if (is_active === false) {
            return { text: "No disponible", color: "bg-gray-500 text-white", icon: "⏸️" };
        }
        return { text: "Disponible", color: "bg-green-500 text-white", icon: "✓" };
    };

    // Verificar si el producto está disponible para compra
    const isProductAvailable = () => {
        // Si no tenemos info de stock o es_active, asumimos disponible
        if (stock === undefined || stock === null) return true;
        if (is_active === false) return false;
        return stock > 0;
    };

    const stockBadge = getStockBadge();
    const available = isProductAvailable();

    const handleQuickView = () => {
        navigate(`/product/${id}`);
    };

    return (
        <div
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 flex flex-col h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Badge de descuento */}
            {discount > 0 && (
                <div className="absolute top-3 left-3 z-10">
                    <span className="bg-linear-to-r from-red-500 to-pink-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg">
                        -{discount}%
                    </span>
                </div>
            )}

            {/* Badge de stock */}
            <div className="absolute top-3 right-3 z-10">
                <span className={`${stockBadge.color} text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1`}>
                    <span className="text-xs">{stockBadge.icon}</span>
                    <span>{stockBadge.text}</span>
                </span>
            </div>

            {/* Contenedor de imagen - clickeable para ver detalles */}
            <div
                className="relative overflow-hidden h-48 bg-linear-to-br from-gray-50 to-gray-100 cursor-pointer"
                onClick={handleQuickView}
            >
                {image_url && !imageError ? (
                    <img
                        src={image_url}
                        alt={name}
                        className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <div className="text-4xl mb-2">📦</div>
                        <div className="text-gray-400 text-center text-sm font-medium">
                            {name?.substring(0, 1).toUpperCase() || 'P'}
                        </div>
                    </div>
                )}

                {/* Overlay en hover */}
                {isHovered && (
                    <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent transition-opacity duration-300" />
                )}

                {/* Quick view button en hover */}
                {isHovered && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevenir que se active el click del contenedor
                                handleQuickView();
                            }}
                            className="bg-white/90 backdrop-blur-sm text-gray-900 font-semibold text-sm px-5 py-2 rounded-full shadow-lg transform -translate-y-2 transition-transform duration-300 hover:scale-105"
                        >
                            Ver detalles
                        </button>
                    </div>
                )}
            </div>

            {/* Contenido */}
            <div className="p-5 flex flex-col grow">
                {/* Categoría */}
                {category && (
                    <div className="mb-2">
                        <span className="inline-block bg-linear-to-r from-purple-50 to-blue-50 text-purple-600 text-xs font-medium px-3 py-1 rounded-full border border-purple-100">
                            {category.name || category}
                        </span>
                    </div>
                )}

                {/* Nombre del producto - clickeable */}
                <h3
                    className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors cursor-pointer"
                    onClick={handleQuickView}
                >
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
                                <span className="text-sm text-red-500 font-semibold ml-auto">
                                    Ahorras ${(original_price - current_price).toFixed(2)}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer con botón de acción */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                    <button
                        onClick={handleAddClick}
                        disabled={!available || isAdding}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${!available
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                            }`}
                    >
                        {isAdding ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Agregando...
                            </>
                        ) : !available ? (
                            <>
                                <span>No disponible</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Agregar al carrito
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 left-1/2 w-1/2 h-1/2 bg-linear-to-r from-transparent via-purple-200/10 to-transparent transform -translate-x-1/2 rotate-45"></div>
            </div>
        </div>
    );
}