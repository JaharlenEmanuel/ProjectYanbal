// src/components/products/ProductCard.jsx
import React from 'react';

export default function ProductCard({
    product,
    onEdit,
    onDelete,
    onAddToCart,
    onToggleStatus,
    isAdmin = false
}) {
    const {
        id,
        name,
        description,
        current_price,
        original_price,
        stock,
        image_url,
        is_active,
        category
    } = product;

    const hasDiscount = original_price && current_price < original_price;
    const discountPercentage = hasDiscount
        ? Math.round(((original_price - current_price) / original_price) * 100)
        : 0;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Imagen del producto */}
            <div className="relative h-48 overflow-hidden bg-gray-100">
                {image_url ? (
                    <img
                        src={image_url}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl">🛒</span>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {!is_active && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                            Inactivo
                        </span>
                    )}
                    {stock <= 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                            Sin Stock
                        </span>
                    )}
                    {stock <= 5 && stock > 0 && (
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                            Stock Bajo
                        </span>
                    )}
                    {hasDiscount && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                            -{discountPercentage}%
                        </span>
                    )}
                </div>
            </div>

            {/* Contenido */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                        {name}
                    </h3>
                    {isAdmin && (
                        <button
                            onClick={() => onToggleStatus && onToggleStatus(id, is_active)}
                            className={`ml-2 text-xs px-2 py-1 rounded ${is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                        >
                            {is_active ? 'Activo' : 'Inactivo'}
                        </button>
                    )}
                </div>

                {description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {description}
                    </p>
                )}

                {/* Categoría */}
                {category && (
                    <div className="mb-3">
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            {category.name}
                        </span>
                    </div>
                )}

                {/* Precio y stock */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <div className="flex items-baseline">
                            <span className="text-xl font-bold text-gray-900">
                                ${Number(current_price || 0).toFixed(2)}
                            </span>
                            {hasDiscount && (
                                <span className="ml-2 text-sm text-gray-500 line-through">
                                    ${Number(original_price).toFixed(2)}
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-gray-500">
                            Stock: {stock} unidades
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                    {isAdmin ? (
                        <>
                            <button
                                onClick={() => onEdit && onEdit(product)}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => onDelete && onDelete(id)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                            >
                                Eliminar
                            </button>

                        </>
                    ) : (
                        <button
                            onClick={() => onAddToCart && onAddToCart(product)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                            disabled={stock <= 0}
                        >
                            {stock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}