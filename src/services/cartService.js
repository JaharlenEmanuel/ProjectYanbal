// src/services/cartService.js
import { supabase } from "../config/supabase";

export const getOrCreateCart = async (profileId) => {
    const { data } = await supabase.from("shopping_carts").select("*").eq("user_profile_id", profileId).single();
    if (data) return data;
    const { data: newCart, error } = await supabase.from("shopping_carts").insert({ user_profile_id: profileId }).select().single();
    if (error) throw error;
    return newCart;
};

export const listCartItems = async (cartId) => {
    const { data, error } = await supabase.from("cart_items").select("*, product:product_id(*)").eq("cart_id", cartId);
    if (error) throw error;
    return data;
};

export const addToCart = async ({ cartId, productId, unitPrice, quantity = 1 }) => {
    const { data, error } = await supabase.from("cart_items").insert({
        cart_id: cartId,
        product_id: productId,
        unit_price: unitPrice,
        quantity
    }).select().single();
    if (error) throw error;
    return data;
};
