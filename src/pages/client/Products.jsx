// src/pages/client/Products.jsx
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../config/supabase";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../../components/Spinner";
import { useNotification } from "../../components/Notifications/NotificationSystem";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState({});
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("default");
    const [searchQuery, setSearchQuery] = useState("");

    const { profile } = useAuth();
    const { showSuccess, showError, showWarning, showInfo } = useNotification();

    // Cargar productos y categorías
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Cargar productos
                const { data: productsData, error: productsError } = await supabase
                    .from("active_products")
                    .select("*");

                if (productsError) {
                    console.error("Error loading products:", productsError);
                    showError("No se pudieron cargar los productos", "Error de carga");
                    setProducts([]);
                } else {
                    // Ordenar por ID de manera descendente como fallback
                    const sortedProducts = (productsData || []).sort((a, b) => b.id - a.id);
                    setProducts(sortedProducts);
                    setFilteredProducts(sortedProducts);

                    // Extraer categorías únicas - manejar diferentes formatos de categoría
                    const categorySet = new Set();
                    (productsData || []).forEach(product => {
                        if (product.category) {
                            // Si category es un array
                            if (Array.isArray(product.category)) {
                                product.category.forEach(cat => categorySet.add(cat));
                            }
                            // Si category es un string
                            else if (typeof product.category === 'string') {
                                // Verificar si es un JSON string
                                try {
                                    const parsed = JSON.parse(product.category);
                                    if (Array.isArray(parsed)) {
                                        parsed.forEach(cat => categorySet.add(cat));
                                    } else {
                                        categorySet.add(product.category);
                                    }
                                } catch {
                                    // Si no es JSON válido, agregar como string
                                    categorySet.add(product.category);
                                }
                            }
                            // Si category es un objeto con propiedad name
                            else if (product.category && typeof product.category === 'object') {
                                if (product.category.name) {
                                    categorySet.add(product.category.name);
                                }
                            }
                        }
                    });

                    setCategories(Array.from(categorySet).sort());
                }

            } catch (error) {
                console.error("Unexpected error:", error);
                showError("Error inesperado al cargar los productos", "Error");
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [showError, showInfo]);

    // Filtrar y ordenar productos
    useEffect(() => {
        let result = [...products];

        // Filtrar por categoría
        if (selectedCategory !== "all") {
            result = result.filter(product => {
                if (!product.category) return false;

                // Manejar diferentes formatos de categoría
                const categories = getProductCategories(product);
                return categories.includes(selectedCategory);
            });
        }

        // Filtrar por búsqueda
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(product => {
                const nameMatch = product.name?.toLowerCase().includes(query);
                const descMatch = product.description?.toLowerCase().includes(query);

                // Verificar también en categorías
                const productCategories = getProductCategories(product);
                const categoryMatch = productCategories.some(cat =>
                    cat.toLowerCase().includes(query)
                );

                return nameMatch || descMatch || categoryMatch;
            });
        }

        // Ordenar
        switch (sortBy) {
            case "price-low":
                result.sort((a, b) => (a.current_price || 0) - (b.current_price || 0));
                break;
            case "price-high":
                result.sort((a, b) => (b.current_price || 0) - (a.current_price || 0));
                break;
            case "name":
                result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                break;
            case "newest":
                // Ordenar por ID descendente como proxy de "más reciente"
                result.sort((a, b) => b.id - a.id);
                break;
            default:
                // Mantener orden original (por ID descendente)
                result.sort((a, b) => b.id - a.id);
                break;
        }

        setFilteredProducts(result);
    }, [products, selectedCategory, sortBy, searchQuery]);

    // Función helper para obtener categorías de un producto
    const getProductCategories = (product) => {
        if (!product.category) return [];

        if (Array.isArray(product.category)) {
            return product.category;
        }
        else if (typeof product.category === 'string') {
            try {
                const parsed = JSON.parse(product.category);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
                return [product.category];
            } catch {
                return [product.category];
            }
        }
        else if (product.category && typeof product.category === 'object') {
            if (product.category.name) {
                return [product.category.name];
            }
        }

        return [];
    };

    const handleAdd = useCallback(async (product) => {
        if (!profile) {
            showWarning(
                "Por favor, inicia sesión para agregar productos al carrito",
                "Inicio de sesión requerido"
            );
            return;
        }

        // Verificar si el producto ya se está agregando
        if (addingToCart[product.id]) {
            showInfo(
                "Ya estamos agregando este producto al carrito",
                "Espere por favor"
            );
            return;
        }

        // Marcar como agregando
        setAddingToCart(prev => ({ ...prev, [product.id]: true }));

        try {
            // Obtener o crear carrito - SIN created_at si no existe
            const { data: cart, error: cartError } = await supabase
                .from("shopping_carts")
                .select("*")
                .eq("user_profile_id", profile.id)
                .single();

            let cartId;

            if (cartError && cartError.code === 'PGRST116') {
                // No existe carrito, crear uno nuevo - SIN created_at
                const { data: newCart, error: createError } = await supabase
                    .from("shopping_carts")
                    .insert({
                        user_profile_id: profile.id
                    })
                    .select()
                    .single();

                if (createError) {
                    throw new Error("No se pudo crear el carrito: " + createError.message);
                }
                cartId = newCart.id;
            } else if (cartError) {
                throw new Error("Error al obtener carrito: " + cartError.message);
            } else {
                cartId = cart.id;
            }

            // Verificar si el producto ya está en el carrito
            const { data: existingItem, error: checkError } = await supabase
                .from("cart_items")
                .select("*")
                .eq("cart_id", cartId)
                .eq("product_id", product.id)
                .maybeSingle();

            if (checkError) {
                throw new Error("Error al verificar carrito: " + checkError.message);
            }

            if (existingItem) {
                // Si ya existe, aumentar cantidad - SIN updated_at si no existe
                const updateData = {
                    quantity: existingItem.quantity + 1
                };

                const { error: updateError } = await supabase
                    .from("cart_items")
                    .update(updateData)
                    .eq("id", existingItem.id);

                if (updateError) {
                    throw new Error("Error al actualizar cantidad: " + updateError.message);
                }

                showSuccess(
                    `Se aumentó la cantidad de "${product.name}" en tu carrito`,
                    "¡Producto actualizado!"
                );
            } else {
                // Si no existe, agregar nuevo item - SIN created_at
                const insertData = {
                    cart_id: cartId,
                    product_id: product.id,
                    unit_price: product.current_price,
                    quantity: 1
                };

                const { error: insertError } = await supabase
                    .from("cart_items")
                    .insert(insertData);

                if (insertError) {
                    console.error("Insert error details:", insertError);

                    // Intentar sin unit_price si ese es el problema
                    if (insertError.message.includes('unit_price')) {
                        const alternativeData = {
                            cart_id: cartId,
                            product_id: product.id,
                            quantity: 1
                        };

                        const { error: altInsertError } = await supabase
                            .from("cart_items")
                            .insert(alternativeData);

                        if (altInsertError) {
                            throw new Error("Error al agregar producto (sin precio): " + altInsertError.message);
                        }

                        showSuccess(
                            `"${product.name}" se agregó a tu carrito`,
                            "¡Producto agregado!"
                        );
                    } else {
                        throw new Error("Error al agregar producto: " + insertError.message);
                    }
                } else {
                    showSuccess(
                        `"${product.name}" se agregó a tu carrito`,
                        "¡Producto agregado!"
                    );
                }
            }

        } catch (error) {
            console.error("Error adding to cart:", error);

            let errorMessage = "No se pudo agregar el producto al carrito";
            let errorTitle = "Error";

            if (error.message.includes("stock")) {
                errorMessage = "Producto sin stock disponible";
            } else if (error.message.includes("sesión")) {
                errorMessage = "Debes iniciar sesión para agregar productos";
            } else if (error.message.includes("foreign key constraint")) {
                errorMessage = "Error en la base de datos. Por favor, intenta nuevamente.";
            } else if (error.message.includes("column")) {
                errorMessage = "Error de configuración en la base de datos.";
            }

            showError(errorMessage, errorTitle);

            // Re-lanzar el error para que ProductCard lo maneje
            throw error;
        } finally {
            // Limpiar estado de agregando
            setAddingToCart(prev => ({ ...prev, [product.id]: false }));
        }
    }, [profile, addingToCart, showSuccess, showError, showWarning, showInfo]);

    const clearFilters = () => {
        setSelectedCategory("all");
        setSortBy("default");
        setSearchQuery("");
        showInfo("Filtros limpiados", "Filtros");
    };

    const getFilterStats = () => {
        return {
            total: products.length,
            showing: filteredProducts.length,
            category: selectedCategory !== "all" ? selectedCategory : null
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <span className="ml-4 text-gray-600">Cargando productos...</span>
                    </div>
                </div>
            </div>
        );
    }

    const stats = getFilterStats();

    return (
        <div className="min-h-screen pt-24 pb-12 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Nuestros Productos
                            </h1>
                            <p className="text-gray-600">
                                Descubre nuestra selección exclusiva de productos
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">
                                Mostrando {stats.showing} de {stats.total} productos
                            </span>
                            {(selectedCategory !== "all" || sortBy !== "default" || searchQuery) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtros y búsqueda */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Barra de búsqueda */}
                            <div className="flex-1">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Buscar productos..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Selector de categoría */}
                            <div className="md:w-64">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                >
                                    <option value="all">Todas las categorías</option>
                                    {categories.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Ordenar por */}
                            <div className="md:w-56">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                >
                                    <option value="default">Ordenar por</option>
                                    <option value="newest">Más recientes</option>
                                    <option value="name">Nombre (A-Z)</option>
                                    <option value="price-low">Precio: menor a mayor</option>
                                    <option value="price-high">Precio: mayor a menor</option>
                                </select>
                            </div>
                        </div>

                        {/* Filtros activos */}
                        {(selectedCategory !== "all" || searchQuery) && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex flex-wrap gap-2">
                                    {selectedCategory !== "all" && (
                                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                                            Categoría: {selectedCategory}
                                            <button
                                                onClick={() => setSelectedCategory("all")}
                                                className="ml-1 text-purple-600 hover:text-purple-900"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    )}
                                    {searchQuery && (
                                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                            Buscando: "{searchQuery}"
                                            <button
                                                onClick={() => setSearchQuery("")}
                                                className="ml-1 text-blue-600 hover:text-blue-900"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contenido principal */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No se encontraron productos
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchQuery || selectedCategory !== "all"
                                ? "No hay productos que coincidan con los filtros aplicados. Intenta con otros criterios."
                                : "Actualmente no hay productos disponibles. Vuelve pronto para nuevas ofertas."}
                        </p>
                        {(searchQuery || selectedCategory !== "all") && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center px-5 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Ver todos los productos
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Grid de productos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAdd={handleAdd}
                                />
                            ))}
                        </div>

                        {/* Footer con información */}
                        <div className="mt-12 text-center">
                            <p className="text-gray-500 text-sm">
                                {stats.showing === stats.total ? (
                                    "Mostrando todos los productos disponibles"
                                ) : (
                                    `Mostrando ${stats.showing} producto${stats.showing !== 1 ? 's' : ''} filtrado${stats.showing !== 1 ? 's' : ''} de ${stats.total}`
                                )}
                            </p>
                            <p className="text-gray-400 text-xs mt-2">
                                Los precios y disponibilidad están sujetos a cambios
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}