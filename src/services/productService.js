// src/services/productService.js
import { supabase } from "../config/supabase";

export const fetchActiveProducts = async () => {
    const { data, error } = await supabase.from("active_products").select("*");
    if (error) throw error;
    return data;
};

export const createProduct = async (payload) => {
    const { data, error } = await supabase.from("products").insert(payload).select().single();
    if (error) throw error;
    return data;
};

export const deleteProduct = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return true;
};
