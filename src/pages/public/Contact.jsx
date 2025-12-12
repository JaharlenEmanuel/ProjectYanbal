// src/pages/Contact.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

export default function Contact() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        subject: '',
        message: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.message) {
            setError('Por favor completa todos los campos requeridos');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Aquí puedes guardar el mensaje en tu base de datos
            // Por ejemplo, en una tabla 'contact_messages'
            const { error: supabaseError } = await supabase
                .from('contact_messages') // Necesitarás crear esta tabla
                .insert([{
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    phone: formData.phone,
                    user_id: user?.id || null,
                    created_at: new Date().toISOString()
                }]);

            if (supabaseError) throw supabaseError;

            setSuccess(true);
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
                phone: ''
            });

            // Opcional: También puedes enviar un email
            // await sendContactEmail(formData);

        } catch (err) {
            setError('Error al enviar el mensaje: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Contáctanos
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        ¿Tienes preguntas? Nos encantaría ayudarte. Envíanos un mensaje y te responderemos lo antes posible.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Formulario de contacto */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Envíanos un mensaje
                        </h2>

                        {success ? (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-6 rounded-lg text-center">
                                <div className="text-4xl mb-4">✅</div>
                                <h3 className="text-xl font-semibold mb-2">¡Mensaje enviado!</h3>
                                <p className="text-green-600">
                                    Hemos recibido tu mensaje. Te responderemos dentro de las próximas 24 horas.
                                </p>
                                <button
                                    onClick={() => setSuccess(false)}
                                    className="mt-4 text-green-600 hover:text-green-800 font-medium"
                                >
                                    Enviar otro mensaje
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Nombre */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Tu nombre"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="+34 600 000 000"
                                    />
                                </div>

                                {/* Asunto */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Asunto
                                    </label>
                                    <select
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">Selecciona un asunto</option>
                                        <option value="Consulta">Consulta general</option>
                                        <option value="Producto">Información de producto</option>
                                        <option value="Reserva">Sobre mi reserva</option>
                                        <option value="Problema">Reportar un problema</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>

                                {/* Mensaje */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mensaje *
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows="6"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="¿En qué podemos ayudarte?"
                                    />
                                </div>

                                {/* Botón de enviar */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Enviando...' : 'Enviar mensaje'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Información de contacto */}
                    <div className="space-y-8">
                        {/* Información de la empresa */}
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">
                                Información de contacto
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Dirección</h4>
                                        <p className="text-gray-600">
                                            Calle Principal 123<br />
                                            Ciudad, CP 28001<br />
                                            Madrid, España
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Teléfono</h4>
                                        <p className="text-gray-600">
                                            +34 900 000 000<br />
                                            <span className="text-sm text-gray-500">Lunes a Viernes: 9:00 - 18:00</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Email</h4>
                                        <p className="text-gray-600">
                                            info@tutienda.com<br />
                                            soporte@tutienda.com
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preguntas frecuentes */}
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">
                                Preguntas frecuentes
                            </h3>
                            <div className="space-y-4">
                                <div className="border-b border-gray-100 pb-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                        ¿Cuánto tarda la entrega?
                                    </h4>
                                    <p className="text-gray-600 text-sm">
                                        Las entregas suelen tardar entre 3-5 días hábiles en la península.
                                    </p>
                                </div>
                                <div className="border-b border-gray-100 pb-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                        ¿Puedo modificar mi reserva?
                                    </h4>
                                    <p className="text-gray-600 text-sm">
                                        Sí, puedes modificar tu reserva dentro de las primeras 24 horas.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                        ¿Qué métodos de pago aceptan?
                                    </h4>
                                    <p className="text-gray-600 text-sm">
                                        Aceptamos tarjetas de crédito/débito, transferencia bancaria y PayPal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}