// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session ?? null);
            if (data.session?.user) {
                await loadProfile(data.session.user.id);
            }
            setLoading(false);
        };
        init();

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session ?? null);
            if (session?.user) {
                await loadProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    const loadProfile = async (authId) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, auth_id, email, full_name, phone, address, role_id, role:role_id(name)")
                .eq("auth_id", authId)
                .single();

            if (error) throw error;

            const profileData = {
                ...data,
                role: data.role?.name,
                role_id: data.role_id
            };

            setProfile(profileData);
            return profileData;
        } catch (err) {
            console.error("loadProfile error", err);
            setProfile(null);
            return null;
        }
    };
    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { ok: false, error: error.message };

        // Cargar el perfil inmediatamente
        const profileData = await loadProfile(data.user.id);

        return {
            ok: true,
            user: data.user,
            profile: profileData // Retornamos el perfil cargado
        };
    };

    const register = async (email, password, extra = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: extra }
        });
        if (error) return { ok: false, error: error.message };
        // trigger will create profile; update with extras
        if (data?.user) {
            await supabase.from("profiles").update(extra).eq("auth_id", data.user.id);
            await loadProfile(data.user.id);
        }
        return { ok: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
    };

    const updateProfile = async (payload) => {
        if (!profile) return { ok: false, error: "No authenticated user" };
        const { data, error } = await supabase.from("profiles").update(payload).eq("id", profile.id).select().single();
        if (error) return { ok: false, error: error.message };
        setProfile({ ...data, role: profile.role });
        return { ok: true, data };
    };

    const changePassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
    };

    return (
        <AuthContext.Provider value={{
            session,
            profile,
            loading,
            login,
            register,
            logout,
            updateProfile,
            changePassword,
            isAdmin: profile?.role === "admin",
            isClient: profile?.role === "cliente"
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
