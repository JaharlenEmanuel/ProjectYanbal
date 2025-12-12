// src/services/reservationService.js
import { supabase } from "../config/supabase";

export const createReservationFromCart = async (profileId, cartId) => {
    // get items
    const { data: items } = await supabase.from("cart_items").select("*").eq("cart_id", cartId);
    const total = items.reduce((s, it) => s + Number(it.unit_price) * it.quantity, 0);

    const { data: reservation, error: rErr } = await supabase.from("reservations").insert({
        user_profile_id: profileId,
        total_amount: total,
        contact_method: "web"
    }).select().single();
    if (rErr) throw rErr;

    const toInsert = items.map(it => ({
        reservation_id: reservation.id,
        product_id: it.product_id,
        pack_id: it.pack_id,
        quantity: it.quantity,
        unit_price: it.unit_price
    }));

    const { error: itemsErr } = await supabase.from("reservation_items").insert(toInsert);
    if (itemsErr) throw itemsErr;

    await supabase.from("cart_items").delete().eq("cart_id", cartId);
    return reservation;
};
