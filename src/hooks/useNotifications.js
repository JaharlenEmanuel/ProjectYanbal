// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cargar notificaciones
    const loadNotifications = useCallback(async () => {
        if (!profile?.id) return;

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_profile_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            setNotifications(data || []);

            // Calcular no leídas
            const unread = data?.filter(n => !n.is_read).length || 0;
            setUnreadCount(unread);

        } catch (err) {
            console.error('Error loading notifications:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile?.id]);

    // Cargar notificaciones al iniciar
    useEffect(() => {
        if (profile?.id) {
            loadNotifications();
        }
    }, [profile?.id, loadNotifications]);

    // Suscripción en tiempo real
    useEffect(() => {
        if (!profile?.id) return;

        const channel = supabase
            .channel('notifications-changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_profile_id=eq.${profile.id}`
            }, () => {
                loadNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id, loadNotifications]);

    // Marcar como leída
    const markAsRead = async (notificationId) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId
                        ? { ...n, is_read: true }
                        : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

        } catch (err) {
            console.error('Error marking notification as read:', err);
            throw err;
        }
    };

    // Marcar todas como leídas
    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_profile_id', profile.id)
                .eq('is_read', false);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);

        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            throw err;
        }
    };

    // Eliminar notificación
    const deleteNotification = async (notificationId) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;

            setNotifications(prev =>
                prev.filter(n => n.id !== notificationId)
            );

            // Actualizar contador si no estaba leída
            const notification = notifications.find(n => n.id === notificationId);
            if (notification && !notification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

        } catch (err) {
            console.error('Error deleting notification:', err);
            throw err;
        }
    };

    // Crear notificación (para uso del admin)
    const createNotification = async (userId, title, message, type = 'info', relatedId = null) => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([{
                    user_profile_id: userId,
                    title,
                    message,
                    type,
                    related_id: relatedId,
                    is_read: false
                }])
                .select()
                .single();

            if (error) throw error;
            return data;

        } catch (err) {
            console.error('Error creating notification:', err);
            throw err;
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        error,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        createNotification
    };
}