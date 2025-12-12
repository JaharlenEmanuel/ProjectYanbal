// src/services/adminService.js
import { supabase } from "../config/supabase";

export const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("*, role:role_id(name)");
    if (error) throw error;
    return data;
};

export const fetchRoles = async () => {
    const { data, error } = await supabase.from("roles").select("*");
    if (error) throw error;
    return data;
};

export const updateProfileByAdmin = async (id, payload) => {
    const { data, error } = await supabase.from("profiles").update(payload).eq("id", id).select().single();
    if (error) throw error;
    return data;
};
