// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';

export default function ProductDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        try {
            setLoading(true);

            // Cargar producto
            const { data: productData } = await supabase
                .from('products')
                .select(`
                    *,
                    category:category_id (id, name)
                `)
                .eq('id', id)
                .single();

            setProduct(productData);

            // Cargar productos relacionados
            if (productData) {
                const { data: relatedData } = await supabase
                    .from('products')
                    .select(`
                        *,
                        category:category_id (id, name)
                    `)
                    .eq('category_id', productData.category_id)
                    .eq('is_active', true)
                    .gt('stock', 0)
                    .neq('id', id)
                    .limit(4);

                setRelatedProducts(relatedData || []);
            }

        } catch (error) {
            console.error('Error loading product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (!product || product.stock <= 0) {
            alert('Este producto no está disponible');
            return;
        }

        if (quantity > product.stock) {
            alert(`Solo hay ${product.stock} unidades disponibles`);
            return;
        }

        const cart = JSON.parse(localStorage.getItem('user_cart') || '[]');
        const existingIndex = cart.findIndex(item => item.id === product.id);

        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                ...product,
                quantity: quantity
            });
        }

        localStorage.setItem('user_cart', JSON.stringify(cart));
        alert('Producto agregado al carrito');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold text-gray-900">Producto no encontrado</h2>
                    <button onClick={() => navigate('/')} className="mt-4 text-purple-600">
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="mb-8">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-2">
                            <li>
                                <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600">
                                    Inicio
                                </button>
                            </li>
                            <li>
                                <span className="text-gray-400">/</span>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate(`/category/${product.category_id}`)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {product.category?.name}
                                </button>
                            </li>
                            <li>
                                <span className="text-gray-400">/</span>
                            </li>
                            <li className="text-gray-900 font-medium truncate">
                                {product.name}
                            </li>
                        </ol>
                    </nav>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Imagen del producto */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-auto max-h-[500px] object-contain rounded-lg"
                                />
                            ) : (
                                <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-6xl text-gray-400">🛒</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Información del producto */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            {/* Categoría */}
                            {product.category && (
                                <span className="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full mb-4">
                                    {product.category.name}
                                </span>
                            )}

                            {/* Nombre */}
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {product.name}
                            </h1>

                            {/* Precio */}
                            <div className="mb-6">
                                <div className="flex items-baseline space-x-3">
                                    <span className="text-4xl font-bold text-gray-900">
                                        ${Number(product.current_price).toFixed(2)}
                                    </span>
                                    {product.original_price && product.original_price > product.current_price && (
                                        <>
                                            <span className="text-xl text-gray-500 line-through">
                                                ${Number(product.original_price).toFixed(2)}
                                            </span>
                                            <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                                                {Math.round(((product.original_price - product.current_price) / product.original_price) * 100)}% OFF
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Stock */}
                            <div className="mb-6">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${product.stock > 5 ? 'bg-green-100 text-green-800' :
                                    product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {product.stock > 5 ? 'En stock' :
                                        product.stock > 0 ? 'Últimas unidades' :
                                            'Agotado'}
                                    <span className="ml-2">• {product.stock} disponibles</span>
                                </div>
                            </div>

                            {/* Descripción */}
                            {product.description && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
                                    <p className="text-gray-600 whitespace-pre-line">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Cantidad y agregar al carrito */}
                            <div className="border-t border-gray-200 pt-8">
                                <div className="flex items-center space-x-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cantidad
                                        </label>
                                        <div className="flex items-center border border-gray-300 rounded-lg">
                                            <button
                                                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                                className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                                            >
                                                -
                                            </button>
                                            <span className="px-4 py-2 min-w-[60px] text-center font-medium">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                                                disabled={quantity >= product.stock}
                                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={product.stock <= 0}
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {product.stock <= 0 ? 'Agotado' : 'Agregar al carrito'}
                                        </button>
                                    </div>
                                </div>

                                <div className="text-sm text-gray-500">
                                    <p>• Tu consultora se pondrá en contacto para coordinar la entrega</p>
                                    <p>• Pago seguro al momento de la entrega</p>
                                </div>
                            </div>
                        </div>

                        {/* Volver a categoría */}
                        <div className="mt-6">
                            <button
                                onClick={() => navigate(`/category/${product.category_id}`)}
                                className="text-purple-600 hover:text-purple-800 font-medium"
                            >
                                ← Ver más productos en {product.category?.name}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Productos relacionados */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">
                            Productos relacionados
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map(relatedProduct => (
                                <div
                                    key={relatedProduct.id}
                                    className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/product/${relatedProduct.id}`)}
                                >
                                    {relatedProduct.image_url ? (
                                        <img
                                            src={relatedProduct.image_url}
                                            alt={relatedProduct.name}
                                            className="w-full h-32 object-cover rounded-lg mb-3"
                                        />
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                                            <span className="text-2xl text-gray-400">📦</span>
                                        </div>
                                    )}
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {relatedProduct.name}
                                    </h3>
                                    <p className="text-purple-600 font-medium">
                                        ${Number(relatedProduct.current_price).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}