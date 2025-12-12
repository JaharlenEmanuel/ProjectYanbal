// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';

export default function Home() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Cargar categorías
            const { data: categoriesData } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            setCategories(categoriesData || []);

            // Cargar productos destacados (con stock)
            const { data: productsData } = await supabase
                .from('products')
                .select(`
                    *,
                    category:category_id (id, name)
                `)
                .eq('is_active', true)
                .gt('stock', 0)
                .order('created_at', { ascending: false })
                .limit(8);

            setProducts(productsData || []);

            // Seleccionar algunos productos como destacados
            setFeaturedProducts(productsData?.slice(0, 3) || []);

        } catch (error) {
            console.error('Error loading home data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getProductsByCategory = (categoryId) => {
        return products.filter(product => product.category_id === categoryId).slice(0, 3);
    };

    return (
        <div className="min-h-screen">
            {/* Productos Destacados */}
            {featuredProducts.length > 0 && (
                <div className="bg-gray-50 py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Productos Destacados
                            </h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                Los productos más populares entre nuestros clientes
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredProducts.map(product => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    {product.image_url ? (
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gray-100 flex items-center justify-center">
                                            <span className="text-4xl text-gray-400">🛒</span>
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                {product.name}
                                            </h3>
                                            <span className="text-sm font-medium text-green-600">
                                                ${Number(product.current_price).toFixed(2)}
                                            </span>
                                        </div>

                                        {product.description && (
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                {product.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${product.stock > 5 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {product.stock > 5 ? 'Disponible' : 'Stock bajo'}
                                            </span>
                                            <Link
                                                to={`/product/${product.id}`}
                                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                            >
                                                Ver detalles →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <Link
                                to="/products"
                                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Ver todos los productos
                            </Link>
                        </div>
                    </div>
                </div>
            )}


            {/* Categorías */}
            <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Explora por Categorías
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Encuentra los productos que necesitas organizados por categorías
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-200 h-64 rounded-lg"></div>
                                <div className="mt-4 h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : categories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map(category => {
                            const categoryProducts = getProductsByCategory(category.id);

                            return (
                                <div
                                    key={category.id}
                                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {category.name}
                                            </h3>
                                            <Link
                                                to={`/category/${category.id}`}
                                                className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                                            >
                                                Ver todo →
                                            </Link>
                                        </div>

                                        {category.description && (
                                            <p className="text-gray-600 mb-6">
                                                {category.description}
                                            </p>
                                        )}

                                        {/* Productos de ejemplo de esta categoría */}
                                        <div className="space-y-4">
                                            {categoryProducts.length > 0 ? (
                                                categoryProducts.map(product => (
                                                    <div key={product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                                        {product.image_url ? (
                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                className="w-16 h-16 object-cover rounded"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                                                <span className="text-gray-400">📦</span>
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 truncate">
                                                                {product.name}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                ${Number(product.current_price).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4 text-gray-500">
                                                    Próximamente productos en esta categoría
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-gray-100">
                                            <Link
                                                to={`/category/${category.id}`}
                                                className="block w-full text-center bg-purple-50 text-purple-600 hover:bg-purple-100 py-2 rounded-lg font-medium transition-colors"
                                            >
                                                Explorar {category.name}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">📂</div>
                        <h3 className="text-xl font-semibold text-gray-700">No hay categorías disponibles</h3>
                        <p className="text-gray-500 mt-2">Pronto agregaremos nuestras categorías</p>
                    </div>
                )}
            </div>

        </div>
    );
}