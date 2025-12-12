// src/pages/Cart.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

export default function Cart() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [cart, setCart] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showReservationForm, setShowReservationForm] = useState(false);
    const [reservationData, setReservationData] = useState({
        consultant_id: '',
        notes: '',
        contact_method: 'whatsapp'
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        loadCart();
        loadConsultants();
    }, [user, navigate]);

    const loadCart = () => {
        const savedCart = localStorage.getItem('user_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }
    };

    const loadConsultants = async () => {
        try {
            const { data } = await supabase
                .from('consultants')
                .select('id, full_name, email')
                .eq('is_active', true)
                .order('full_name');
            setConsultants(data || []);
        } catch (error) {
            console.error('Error loading consultants:', error);
        }
    };

    const updateQuantity = (productId, quantity) => {
        const updatedCart = cart.map(item => {
            if (item.id === productId) {
                return { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) };
            }
            return item;
        }).filter(item => item.quantity > 0);

        setCart(updatedCart);
        localStorage.setItem('user_cart', JSON.stringify(updatedCart));
    };

    const removeFromCart = (productId) => {
        const updatedCart = cart.filter(item => item.id !== productId);
        setCart(updatedCart);
        localStorage.setItem('user_cart', JSON.stringify(updatedCart));
    };

    const clearCart = () => {
        if (window.confirm('¿Estás seguro de vaciar el carrito?')) {
            setCart([]);
            localStorage.removeItem('user_cart');
        }
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (Number(item.current_price) * item.quantity), 0);
    };

    const handleReservationChange = (e) => {
        const { name, value } = e.target;
        setReservationData(prev => ({ ...prev, [name]: value }));
    };

    const createReservation = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (cart.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }

        if (!reservationData.consultant_id) {
            alert('Por favor selecciona una consultora');
            return;
        }

        try {
            setLoading(true);

            // 1. Crear la reserva principal
            const totalAmount = calculateTotal();

            const { data: reservation, error: reservationError } = await supabase
                .from('reservations')
                .insert([{
                    user_profile_id: user.id,
                    consultant_id: reservationData.consultant_id,
                    status: 'pending',
                    total_amount: totalAmount,
                    notes: reservationData.notes,
                    contact_method: reservationData.contact_method,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (reservationError) throw reservationError;

            // 2. Crear los items de la reserva
            const reservationItems = cart.map(item => ({
                reservation_id: reservation.id,
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.current_price,
                subtotal: item.current_price * item.quantity,
                created_at: new Date().toISOString()
            }));

            const { error: itemsError } = await supabase
                .from('reservation_items')
                .insert(reservationItems);

            if (itemsError) throw itemsError;

            // 3. Limpiar carrito y mostrar éxito
            clearCart();
            alert('¡Reserva creada exitosamente! Tu consultora se pondrá en contacto contigo pronto.');
            navigate('/');

        } catch (error) {
            console.error('Error creating reservation:', error);
            alert('Error al crear la reserva: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return null; // Será redirigido por el useEffect
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="text-6xl mb-6">🛒</div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Tu carrito está vacío
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Agrega algunos productos para comenzar tu compra
                    </p>
                    <div className="space-y-4">
                        <Link
                            to="/products"
                            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold"
                        >
                            Explorar productos
                        </Link>
                        <br />
                        <Link
                            to="/"
                            className="inline-block text-purple-600 hover:text-purple-800"
                        >
                            ← Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Mi Carrito
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Lista de productos */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Productos ({cart.length})
                                </h2>
                                <button
                                    onClick={clearCart}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Vaciar carrito
                                </button>
                            </div>

                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                                                <span className="text-gray-400">📦</span>
                                            </div>
                                        )}

                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                                            <p className="text-sm text-gray-600">
                                                ${Number(item.current_price).toFixed(2)} c/u
                                            </p>
                                            <div className="mt-2 flex items-center space-x-4">
                                                <div className="flex items-center border border-gray-300 rounded-lg">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="px-3 py-1 min-w-10 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        disabled={item.quantity >= item.stock}
                                                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="font-semibold text-gray-900">
                                                    ${(Number(item.current_price) * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Resumen y reserva */}
                    <div className="space-y-6">
                        {/* Resumen del pedido */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Resumen del pedido
                            </h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${calculateTotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Envío</span>
                                    <span className="text-green-600">Gratis</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Total</span>
                                        <span>${calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {!showReservationForm ? (
                                <button
                                    onClick={() => setShowReservationForm(true)}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Proceder a reservar
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowReservationForm(false)}
                                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors mb-4"
                                >
                                    ← Volver
                                </button>
                            )}
                        </div>

                        {/* Formulario de reserva */}
                        {showReservationForm && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    Datos de la reserva
                                </h2>

                                <div className="space-y-4">
                                    {/* Seleccionar consultora */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Selecciona tu consultora *
                                        </label>
                                        <select
                                            name="consultant_id"
                                            value={reservationData.consultant_id}
                                            onChange={handleReservationChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">Elige una consultora</option>
                                            {consultants.map(consultant => (
                                                <option key={consultant.id} value={consultant.id}>
                                                    {consultant.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Método de contacto */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Prefiero que me contacten por
                                        </label>
                                        <select
                                            name="contact_method"
                                            value={reservationData.contact_method}
                                            onChange={handleReservationChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="phone">Llamada telefónica</option>
                                            <option value="email">Correo electrónico</option>
                                        </select>
                                    </div>

                                    {/* Notas adicionales */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notas adicionales (opcional)
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={reservationData.notes}
                                            onChange={handleReservationChange}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Indicaciones especiales, horario preferido, etc."
                                        />
                                    </div>

                                    {/* Botón de crear reserva */}
                                    <button
                                        onClick={createReservation}
                                        disabled={loading || !reservationData.consultant_id}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Creando reserva...' : 'Confirmar reserva'}
                                    </button>

                                    <p className="text-sm text-gray-500 text-center">
                                        Tu consultora se pondrá en contacto contigo para coordinar la entrega y el pago.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Continuar comprando */}
                        <Link
                            to="/products"
                            className="block text-center text-purple-600 hover:text-purple-800 font-medium"
                        >
                            ← Seguir comprando
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}