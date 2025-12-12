// src/pages/client/Products.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../../components/Spinner";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { profile } = useAuth();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data, error } = await supabase.from("active_products").select("*");
            if (error) {
                console.error(error);
                setProducts([]);
            } else setProducts(data || []);
            setLoading(false);
        };
        load();
    }, []);

    const handleAdd = async (product) => {
        if (!profile) return alert("Inicia sesión primero");
        // get or create cart
        const { data: cart } = await supabase.from("shopping_carts").select("*").eq("user_profile_id", profile.id).single();
        let cartId = cart?.id;
        if (!cartId) {
            const { data: newCart } = await supabase.from("shopping_carts").insert({ user_profile_id: profile.id }).select().single();
            cartId = newCart.id;
        }
        await supabase.from("cart_items").insert({
            cart_id: cartId,
            product_id: product.id,
            unit_price: product.current_price,
            quantity: 1
        });
        alert("Producto agregado al carrito");
    };

    if (loading) return <Spinner />;

    return (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} onAdd={handleAdd} />)}
        </div>
    );
}
