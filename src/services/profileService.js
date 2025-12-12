// src/services/profileService.js
import { supabase } from "../config/supabase";

export const getProfileByAuthId = async (authId) => {
    const { data, error } = await supabase.from("profiles").select("*, role:role_id(name)").eq("auth_id", authId).single();
    if (error) throw error;
    return data;
};

export const updateProfile = async (id, payload) => {
    const { data, error } = await supabase.from("profiles").update(payload).eq("id", id).select().single();
    if (error) throw error;
    return data;
};
