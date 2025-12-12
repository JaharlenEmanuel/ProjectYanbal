// src/pages/client/Cart.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../components/Notifications/NotificationSystem";

export default function Cart() {
    const { profile } = useAuth();
    const { showSuccess, showError, showConfirm } = useNotification();
    const [cart, setCart] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchCart();
    }, [profile]);

    const fetchCart = async () => {
        if (!profile) return;

        setLoading(true);
        try {
            const { data: c, error: cartError } = await supabase
                .from("shopping_carts")
                .select("*")
                .eq("user_profile_id", profile.id)
                .single();

            if (cartError && cartError.code !== 'PGRST116') {
                throw cartError;
            }

            setCart(c || null);

            if (c?.id) {
                const { data: its, error: itemsError } = await supabase
                    .from("cart_items")
                    .select("*, product:product_id(*)")
                    .eq("cart_id", c.id);

                if (itemsError) throw itemsError;
                setItems(its || []);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
            showError("No se pudo cargar el carrito", "Error");
        } finally {
            setLoading(false);
        }
    };

    const removeItem = async (id) => {
        await supabase.from("cart_items").delete().eq("id", id);
        setItems(items.filter(it => it.id !== id));
    };

    const updateQuantity = async (id, newQuantity) => {
        if (newQuantity < 1) return;

        try {
            const { error } = await supabase
                .from("cart_items")
                .update({ quantity: newQuantity })
                .eq("id", id);

            if (error) throw error;

            setItems(items.map(item =>
                item.id === id ? { ...item, quantity: newQuantity } : item
            ));

            showSuccess("Cantidad actualizada", "¡Actualizado!");
        } catch (error) {
            console.error("Error updating quantity:", error);
            showError("No se pudo actualizar la cantidad", "Error");
        }
    };

    const confirmReservation = async () => {
        if (!cart) return;
        // compute total
        const total = items.reduce((s, it) => s + Number(it.unit_price) * it.quantity, 0);
        const { data: reservation } = await supabase.from("reservations").insert({
            user_profile_id: profile.id,
            total_amount: total,
            contact_method: "web"
        }).select().single();

        const toInsert = items.map(it => ({
            reservation_id: reservation.id,
            product_id: it.product_id,
            pack_id: it.pack_id,
            quantity: it.quantity,
            unit_price: it.unit_price
        }));

        await supabase.from("reservation_items").insert(toInsert);
        await supabase.from("cart_items").delete().eq("cart_id", cart.id);
        setItems([]);
    };

    const calculateTotal = () => {
        return items.reduce((s, it) => s + Number(it.unit_price) * it.quantity, 0);
    };

    const calculateItemTotal = (item) => {
        return Number(item.unit_price) * item.quantity;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Mi Carrito</h1>
                        <p className="text-gray-600 mt-2">
                            Revisa tus productos y confirma tu reserva
                        </p>
                    </div>

                    {/* Cart Content */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        {items.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Tu carrito está vacío
                                </h3>
                                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                                    No hay productos en tu carrito. ¡Agrega algunos productos para continuar!
                                </p>
                                <a
                                    href="/products"
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Explorar Productos
                                </a>
                            </div>
                        ) : (
                            <>
                                {/* Items List */}
                                <div className="divide-y divide-gray-200">
                                    {items.map((item) => (
                                        <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                {/* Product Info */}
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        {item.product?.image_url ? (
                                                            <img
                                                                src={item.product.image_url}
                                                                alt={item.product.name}
                                                                className="w-full h-full object-cover rounded-lg"
                                                            />
                                                        ) : (
                                                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900">
                                                            {item.product?.name || "Producto no disponible"}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {item.product?.description?.substring(0, 80) || "Sin descripción"}...
                                                        </p>
                                                        <div className="mt-3">
                                                            <span className="text-lg font-bold text-blue-600">
                                                                ${Number(item.unit_price).toFixed(2)}
                                                            </span>
                                                            <span className="text-sm text-gray-500 ml-2">
                                                                c/u
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Controls */}
                                                <div className="flex flex-col sm:items-end gap-4">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                            </svg>
                                                        </button>
                                                        <span className="w-12 text-center font-medium text-gray-900">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    {/* Price and Remove */}
                                                    <div className="flex items-center justify-between w-full sm:w-auto">
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-gray-900">
                                                                ${calculateItemTotal(item).toFixed(2)}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                Total
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(item.id, item.product?.name)}
                                                            className="ml-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar producto"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Summary */}
                                <div className="bg-gray-50 p-6 border-t border-gray-200">
                                    <div className="max-w-md ml-auto">
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-lg">
                                                <span className="text-gray-600">Subtotal</span>
                                                <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg">
                                                <span className="text-gray-600">Impuestos</span>
                                                <span className="font-medium">$0.00</span>
                                            </div>
                                            <div className="pt-4 border-t border-gray-300">
                                                <div className="flex justify-between text-2xl font-bold text-gray-900">
                                                    <span>Total</span>
                                                    <span>${calculateTotal().toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                                            <a
                                                href="/products"
                                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
                                            >
                                                <span className="flex items-center justify-center">
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                    Seguir Comprando
                                                </span>
                                            </a>
                                            <button
                                                onClick={confirmReservation}
                                                disabled={processing || items.length === 0}
                                                className={`flex-1 px-6 py-3 font-medium rounded-lg transition-colors flex items-center justify-center ${processing || items.length === 0
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                                                    }`}
                                            >
                                                {processing ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                        Procesando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Confirmar Reserva
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Help Text */}
                                        <p className="mt-6 text-sm text-gray-600 text-center">
                                            Al confirmar la reserva, te contactaremos en las próximas 24 horas para coordinar la entrega.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}