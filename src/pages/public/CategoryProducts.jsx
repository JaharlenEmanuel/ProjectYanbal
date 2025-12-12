// src/pages/CategoryProducts.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/products/ProductCard';

export default function CategoryProducts() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        sortBy: 'newest'
    });

    useEffect(() => {
        loadCategoryAndProducts();
        loadCartFromStorage();
    }, [id, filters]);

    const loadCategoryAndProducts = async () => {
        try {
            setLoading(true);

            // Cargar categoría
            const { data: categoryData } = await supabase
                .from('categories')
                .select('*')
                .eq('id', id)
                .single();
            setCategory(categoryData);

            // Cargar productos de esta categoría
            let query = supabase
                .from('products')
                .select(`
                    *,
                    category:category_id (id, name)
                `)
                .eq('category_id', id)
                .eq('is_active', true)
                .gt('stock', 0);

            // Aplicar filtros de precio
            if (filters.minPrice) {
                query = query.gte('current_price', filters.minPrice);
            }
            if (filters.maxPrice) {
                query = query.lte('current_price', filters.maxPrice);
            }

            // Ordenar
            switch (filters.sortBy) {
                case 'price_asc':
                    query = query.order('current_price', { ascending: true });
                    break;
                case 'price_desc':
                    query = query.order('current_price', { ascending: false });
                    break;
                case 'name':
                    query = query.order('name', { ascending: true });
                    break;
                default: // 'newest'
                    query = query.order('created_at', { ascending: false });
            }

            const { data: productsData } = await query;
            setProducts(productsData || []);

        } catch (error) {
            console.error('Error loading category products:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCartFromStorage = () => {
        const savedCart = localStorage.getItem('user_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }
    };

    const saveCartToStorage = (cartData) => {
        localStorage.setItem('user_cart', JSON.stringify(cartData));
    };

    const handleAddToCart = (product) => {
        if (!user) {
            navigate('/login');
            return;
        }

        const updatedCart = [...cart];
        const existingItemIndex = updatedCart.findIndex(item => item.id === product.id);

        if (existingItemIndex > -1) {
            if (updatedCart[existingItemIndex].quantity < product.stock) {
                updatedCart[existingItemIndex].quantity += 1;
            } else {
                return;
            }
        } else {
            updatedCart.push({
                ...product,
                quantity: 1
            });
        }

        setCart(updatedCart);
        saveCartToStorage(updatedCart);
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            minPrice: '',
            maxPrice: '',
            sortBy: 'newest'
        });
    };

    if (loading && !category) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando categoría...</p>
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Categoría no encontrada</h2>
                    <p className="text-gray-600">La categoría que buscas no existe o ha sido eliminada.</p>
                    <Link to="/" className="mt-4 inline-block text-purple-600 hover:text-purple-800">
                        ← Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header de la categoría */}
            <div className="bg-linear-to-r from-purple-600 to-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                {category.name}
                            </h1>
                            {category.description && (
                                <p className="text-purple-100 max-w-2xl">
                                    {category.description}
                                </p>
                            )}
                            <p className="mt-2 text-purple-200">
                                {products.length} productos disponibles
                            </p>
                        </div>
                        <Link
                            to="/"
                            className="mt-4 md:mt-0 inline-flex items-center text-white hover:text-purple-100"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-4">
                            {/* Precio mínimo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio mínimo
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        value={filters.minPrice}
                                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                        className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg w-32"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Precio máximo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio máximo
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        value={filters.maxPrice}
                                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                        className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg w-32"
                                        placeholder="999"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Ordenar por */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ordenar por
                                </label>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-48"
                                >
                                    <option value="newest">Más recientes</option>
                                    <option value="price_asc">Precio: menor a mayor</option>
                                    <option value="price_desc">Precio: mayor a menor</option>
                                    <option value="name">Nombre (A-Z)</option>
                                </select>
                            </div>
                        </div>

                        {/* Botones de filtro */}
                        <div className="flex gap-2">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Limpiar filtros
                            </button>
                            <button
                                onClick={loadCategoryAndProducts}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Aplicar filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* Productos */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="animate-pulse bg-white rounded-xl shadow-sm p-6">
                                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                        <div className="text-6xl mb-4">😔</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No hay productos en esta categoría
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {filters.minPrice || filters.maxPrice
                                ? 'Intenta con otros filtros de búsqueda'
                                : 'Pronto agregaremos productos a esta categoría'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/"
                                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                            >
                                Volver al inicio
                            </Link>
                            {(filters.minPrice || filters.maxPrice) && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-block border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                    isAdmin={false}
                                />
                            ))}
                        </div>

                        {/* Paginación (si hay muchos productos) */}
                        {products.length > 12 && (
                            <div className="mt-12 flex justify-center">
                                <nav className="flex items-center space-x-2">
                                    <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                        ← Anterior
                                    </button>
                                    <button className="px-3 py-2 bg-purple-600 text-white rounded-lg">1</button>
                                    <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">2</button>
                                    <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">3</button>
                                    <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                        Siguiente →
                                    </button>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}