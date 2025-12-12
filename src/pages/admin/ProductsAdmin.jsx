// src/pages/admin/ProductsAdmin.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import ProductCard from '../../components/products/ProductCard';
import ProductForm from '../../components/products/ProductForm';
import CartSidebar from '../../components/products/CartSidebar';

export default function ProductsAdmin() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');

    // Cargar datos iniciales
    useEffect(() => {
        loadProducts();
        loadCategories();
        loadCartFromStorage();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError('');

            const { data, error: productsError } = await supabase
                .from('products')
                .select(`
                    *,
                    category:category_id (
                        id,
                        name
                    )
                `)
                .order('created_at', { ascending: false });

            if (productsError) throw productsError;
            setProducts(data || []);

        } catch (err) {
            setError('Error al cargar productos: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const { data, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (categoriesError) throw categoriesError;
            setCategories(data || []);

        } catch (err) {
            console.error('Error loading categories:', err);
        }
    };

    const loadCartFromStorage = () => {
        const savedCart = localStorage.getItem('admin_products_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart from storage:', error);
            }
        }
    };

    const saveCartToStorage = (cartData) => {
        localStorage.setItem('admin_products_cart', JSON.stringify(cartData));
    };

    // Funciones CRUD para productos
    const handleCreateProduct = async (productData) => {
        try {
            const { data, error: createError } = await supabase
                .from('products')
                .insert([{
                    ...productData,
                    created_by: user?.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select(`
                    *,
                    category:category_id (
                        id,
                        name
                    )
                `)
                .single();

            if (createError) throw createError;

            await loadProducts();
            setShowForm(false);
            return { success: true, message: 'Producto creado exitosamente', data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const handleUpdateProduct = async (id, productData) => {
        try {
            const { data, error: updateError } = await supabase
                .from('products')
                .update({
                    ...productData,
                    updated_by: user?.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
                    *,
                    category:category_id (
                        id,
                        name
                    )
                `)
                .single();

            if (updateError) throw updateError;

            await loadProducts();
            setEditingProduct(null);
            return { success: true, message: 'Producto actualizado exitosamente', data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
            return { success: false, error: 'Cancelado por el usuario' };
        }

        try {
            const { error: deleteError } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await loadProducts();
            return { success: true, message: 'Producto eliminado exitosamente' };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const { data, error: updateError } = await supabase
                .from('products')
                .update({
                    is_active: !currentStatus,
                    updated_by: user?.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
                    *,
                    category:category_id (
                        id,
                        name
                    )
                `)
                .single();

            if (updateError) throw updateError;

            await loadProducts();
            return {
                success: true,
                message: `Producto ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`
            };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // Funciones del carrito
    const addToCart = (product) => {
        const updatedCart = [...cart];
        const existingItemIndex = updatedCart.findIndex(item => item.id === product.id);

        if (existingItemIndex > -1) {
            updatedCart[existingItemIndex].quantity += 1;
        } else {
            updatedCart.push({
                ...product,
                quantity: 1
            });
        }

        setCart(updatedCart);
        saveCartToStorage(updatedCart);
    };

    const updateQuantity = (productId, quantity) => {
        const updatedCart = cart.map(item => {
            if (item.id === productId) {
                return { ...item, quantity: Math.max(1, quantity) };
            }
            return item;
        }).filter(item => item.quantity > 0);

        setCart(updatedCart);
        saveCartToStorage(updatedCart);
    };

    const removeFromCart = (productId) => {
        const updatedCart = cart.filter(item => item.id !== productId);
        setCart(updatedCart);
        saveCartToStorage(updatedCart);
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('admin_products_cart');
    };

    const handleOrder = () => {
        // Lógica para crear orden administrativa
        console.log('Crear orden administrativa:', cart);
        // Aquí puedes implementar la creación de órdenes/pedidos
        alert(`Orden creada con ${cart.reduce((total, item) => total + item.quantity, 0)} productos. Total: $${cartTotal.toFixed(2)}`);
        clearCart();
        setShowCart(false);
    };

    // Cálculos
    const cartTotal = cart.reduce((total, item) =>
        total + (Number(item.current_price || 0) * item.quantity), 0
    );

    const totalItemsInCart = cart.reduce((total, item) => total + item.quantity, 0);

    // Filtrado de productos
    const filteredProducts = products.filter(product => {
        if (filter === 'all') return true;
        if (filter === 'active') return product.is_active === true;
        if (filter === 'inactive') return product.is_active === false;
        if (filter === 'low_stock') return product.stock <= 5;
        if (filter === 'out_of_stock') return product.stock <= 0;
        return true;
    });

    // Estadísticas
    const stats = {
        total: products.length,
        active: products.filter(p => p.is_active).length,
        lowStock: products.filter(p => p.stock <= 5).length,
        outOfStock: products.filter(p => p.stock <= 0).length,
        totalValue: products.reduce((sum, p) => sum + (Number(p.current_price || 0) * p.stock), 0)
    };

    if (loading && products.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando productos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
                    <p className="text-gray-600 mt-2">
                        Administra tu catálogo de productos ({products.length} productos)
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
                    <button
                        onClick={() => setShowCart(true)}
                        className="relative bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                    >
                        <span className="mr-2">🛒</span>
                        Carrito ({totalItemsInCart})
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                    >
                        <span className="mr-2">➕</span>
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Mensajes de error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Productos</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    <div className="text-sm text-gray-600">Activos</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
                    <div className="text-sm text-gray-600">Stock Bajo</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                    <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
                    <div className="text-sm text-gray-600">Sin Stock</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
                    <div className="text-2xl font-bold text-purple-600">
                        ${stats.totalValue.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Valor Total</div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'all', label: 'Todos los Productos', color: 'gray' },
                        { value: 'active', label: 'Activos', color: 'green' },
                        { value: 'inactive', label: 'Inactivos', color: 'red' },
                        { value: 'low_stock', label: 'Stock Bajo', color: 'yellow' },
                        { value: 'out_of_stock', label: 'Sin Stock', color: 'red' }
                    ].map(({ value, label, color }) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value)}
                            className={`px-4 py-2 rounded-md transition-colors ${filter === value
                                ? `bg-${color}-600 text-white`
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Formulario */}
            {(showForm || editingProduct) && (
                <ProductForm
                    product={editingProduct}
                    categories={categories}
                    onSubmit={editingProduct ?
                        (data) => handleUpdateProduct(editingProduct.id, data) :
                        handleCreateProduct
                    }
                    onCancel={() => {
                        setShowForm(false);
                        setEditingProduct(null);
                    }}
                />
            )}

            {/* Grid de Productos */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando productos...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <div className="text-4xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-gray-700">No hay productos</h3>
                    <p className="text-gray-500 mt-2">
                        {filter === 'all'
                            ? 'Comienza agregando tu primer producto'
                            : 'No hay productos con este filtro'}
                    </p>
                    {filter === 'all' && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                        >
                            ➕ Agregar Primer Producto
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={setEditingProduct}
                            onDelete={handleDeleteProduct}
                            onAddToCart={addToCart}
                            onToggleStatus={handleToggleStatus}
                            isAdmin={true}
                        />
                    ))}
                </div>
            )}

            {/* Sidebar del Carrito */}
            <CartSidebar
                isOpen={showCart}
                onClose={() => setShowCart(false)}
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                total={cartTotal}
                onOrder={handleOrder}
                onClearCart={clearCart}
                isAdmin={true}
            />
        </div>
    );
}