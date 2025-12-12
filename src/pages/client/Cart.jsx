// src/pages/client/Cart.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";

export default function Cart() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Cargar carrito
    useEffect(() => {
        loadCart();
    }, [profile]);

    const loadCart = async () => {
        if (!profile) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);

            // Obtener carrito del usuario
            const { data: cartData } = await supabase
                .from("shopping_carts")
                .select("*")
                .eq("user_profile_id", profile.id)
                .single();

            setCart(cartData || null);

            // Si hay carrito, obtener items con detalles del producto
            if (cartData?.id) {
                const { data: itemsData } = await supabase
                    .from("cart_items")
                    .select(`
                        id,
                        quantity,
                        unit_price,
                        subtotal,
                        product_id,
                        products:product_id (
                            id,
                            name,
                            description,
                            current_price,
                            original_price,
                            image_url,
                            stock,
                            is_active
                        )
                    `)
                    .eq("cart_id", cartData.id)
                    .order('created_at', { ascending: false });

                setItems(itemsData || []);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        } finally {
            setLoading(false);
        }
    };

    // Eliminar item del carrito
    const removeItem = async (itemId) => {
        try {
            await supabase.from("cart_items").delete().eq("id", itemId);
            setItems(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            console.error('Error removing item:', error);
            alert('Error al eliminar el producto');
        }
    };

    // Actualizar cantidad
    const updateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) {
            removeItem(itemId);
            return;
        }

        try {
            // Obtener precio del producto
            const item = items.find(i => i.id === itemId);
            if (!item) return;

            const newSubtotal = item.unit_price * newQuantity;

            await supabase
                .from("cart_items")
                .update({
                    quantity: newQuantity,
                    subtotal: newSubtotal
                })
                .eq("id", itemId);

            // Actualizar estado local
            setItems(prev =>
                prev.map(i =>
                    i.id === itemId
                        ? { ...i, quantity: newQuantity, subtotal: newSubtotal }
                        : i
                )
            );
        } catch (error) {
            console.error('Error updating quantity:', error);
            alert('Error al actualizar la cantidad');
        }
    };

    // Calcular total
    const calculateTotal = () => {
        return items.reduce((total, item) => total + (item.subtotal || item.unit_price * item.quantity), 0);
    };

    // Calcular subtotal por item
    const calculateItemSubtotal = (item) => {
        return item.subtotal || item.unit_price * item.quantity;
    };

    // Confirmar reserva
    const confirmReservation = async () => {
        if (!cart || items.length === 0) return;

        setProcessing(true);
        try {
            // Calcular total
            const total = calculateTotal();

            // Crear reserva
            const { data: reservation, error: reservationError } = await supabase
                .from("reservations")
                .insert({
                    user_profile_id: profile.id,
                    total_amount: total,
                    contact_method: "web",
                    status: "pending"
                })
                .select()
                .single();

            if (reservationError) throw reservationError;

            // Preparar items de la reserva
            const reservationItems = items.map(item => ({
                reservation_id: reservation.id,
                product_id: item.product_id,
                pack_id: item.pack_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: calculateItemSubtotal(item)
            }));

            // Insertar items de la reserva
            const { error: itemsError } = await supabase
                .from("reservation_items")
                .insert(reservationItems);

            if (itemsError) throw itemsError;

            // Vaciar carrito
            await supabase.from("cart_items").delete().eq("cart_id", cart.id);

            // Actualizar estado
            setItems([]);
            setShowConfirmModal(false);

            // Redirigir a confirmación
            navigate(`/reservation-confirmation/${reservation.id}`);

        } catch (error) {
            console.error('Error creating reservation:', error);
            alert('Error al crear la reserva. Por favor, inténtalo de nuevo.');
        } finally {
            setProcessing(false);
        }
    };

    // Formatear precio
    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando tu carrito...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Inicia sesión</h2>
                    <p className="text-gray-600 mb-6">Para ver tu carrito, necesitas iniciar sesión</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-linear-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all"
                    >
                        Iniciar sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Tu Carrito de Compras</h1>
                    <p className="text-gray-600 mt-2">Revisa y gestiona los productos que deseas reservar</p>
                </div>

                {items.length === 0 ? (
                    // Carrito vacío
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <div className="text-8xl mb-6">🛒</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Tu carrito está vacío</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Parece que aún no has agregado productos a tu carrito.
                            ¡Explora nuestros productos y encuentra lo que necesitas!
                        </p>
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-linear-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                        >
                            Explorar Productos
                        </button>
                    </div>
                ) : (
                    // Carrito con productos
                    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                        {/* Lista de productos */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Productos ({items.length})
                                        </h2>
                                        <button
                                            onClick={() => navigate('/products')}
                                            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                            Seguir comprando
                                        </button>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {items.map((item) => (
                                        <div key={item.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex gap-4">
                                                {/* Imagen del producto */}
                                                <div className="shrink-0">
                                                    {item.products?.image_url ? (
                                                        <img
                                                            src={item.products.image_url}
                                                            alt={item.products.name}
                                                            className="w-24 h-24 rounded-xl object-cover border border-gray-200"
                                                            onError={(e) => {
                                                                e.target.src = `https://via.placeholder.com/96/F3F4F6/6B7280?text=${encodeURIComponent(item.products?.name?.substring(0, 1) || 'P')}`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-24 h-24 rounded-xl bg-linear-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center">
                                                            <span className="text-3xl text-gray-400">📦</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Información del producto */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between">
                                                        <div className="flex-1">
                                                            <h3
                                                                className="font-semibold text-gray-900 hover:text-orange-600 cursor-pointer transition-colors"
                                                                onClick={() => navigate(`/product/${item.product_id}`)}
                                                            >
                                                                {item.products?.name || 'Producto'}
                                                            </h3>
                                                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                                                {item.products?.description || 'Sin descripción'}
                                                            </p>
                                                        </div>

                                                        {/* Precio unitario */}
                                                        <div className="shrink-0 ml-4">
                                                            <div className="text-lg font-bold text-gray-900">
                                                                {formatPrice(item.unit_price)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Controles de cantidad y acciones */}
                                                    <div className="flex items-center justify-between mt-4">
                                                        <div className="flex items-center gap-3">
                                                            {/* Selector de cantidad */}
                                                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                    className="px-3 py-1.5 hover:bg-gray-100 transition-colors text-gray-600"
                                                                    aria-label="Reducir cantidad"
                                                                >
                                                                    −
                                                                </button>
                                                                <span className="px-4 py-1.5 text-gray-900 font-medium min-w-10 text-center">
                                                                    {item.quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                    className="px-3 py-1.5 hover:bg-gray-100 transition-colors text-gray-600"
                                                                    aria-label="Aumentar cantidad"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>

                                                            {/* Botón eliminar */}
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Eliminar
                                                            </button>
                                                        </div>

                                                        {/* Subtotal */}
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-500">Subtotal</div>
                                                            <div className="text-xl font-bold text-gray-900">
                                                                {formatPrice(calculateItemSubtotal(item))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Resumen del pedido */}
                        <div className="lg:col-span-1 mt-8 lg:mt-0">
                            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Resumen de la Reserva</h3>

                                {/* Detalles del resumen */}
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(calculateTotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Envío</span>
                                        <span className="text-green-600">Gratis</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span className="text-2xl text-orange-600">{formatPrice(calculateTotal())}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">IVA incluido</p>
                                    </div>
                                </div>

                                {/* Botón de confirmación */}
                                <button
                                    onClick={() => setShowConfirmModal(true)}
                                    disabled={processing}
                                    className="w-full bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Procesando...
                                        </div>
                                    ) : (
                                        'Confirmar Reserva'
                                    )}
                                </button>

                                {/* Información adicional */}
                                <div className="mt-6 space-y-3 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Pago seguro y encriptado</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Garantía de devolución</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Soporte 24/7</span>
                                    </div>
                                </div>

                                {/* Métodos de pago */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-sm text-gray-500 mb-3">Métodos de pago aceptados:</p>
                                    <div className="flex gap-2">
                                        <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">💳</div>
                                        <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">📱</div>
                                        <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">🏦</div>
                                        <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">💰</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de confirmación */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-fadeIn">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Confirmar reserva?</h3>
                            <p className="text-gray-600">
                                Estás a punto de crear una reserva por {formatPrice(calculateTotal())}.
                                Esta acción no se puede deshacer.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={confirmReservation}
                                disabled={processing}
                                className="w-full bg-linear-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
                            >
                                {processing ? 'Procesando...' : 'Sí, confirmar reserva'}
                            </button>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={processing}
                                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}