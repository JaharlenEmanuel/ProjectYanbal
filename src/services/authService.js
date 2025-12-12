// src/services/authService.js
import { supabase } from "../config/supabase";

export const signUp = async (email, password, extra = {}) => {
    return await supabase.auth.signUp({ email, password, options: { data: extra } });
};

export const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
    return await supabase.auth.signOut();
};
