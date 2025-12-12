// src/App.jsx
import React from "react";
import { Routes, Route, BrowserRouter, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./components/Notifications/NotificationSystem";

// Páginas de autenticación
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Páginas públicas
import Home from "./pages/public/Home";
import Contact from "./pages/public/Contact";
import CategoryProducts from "./pages/public/CategoryProducts";
import ProductDetail from "./pages/public/ProductDetail";

// Páginas de cliente
import Products from "./pages/client/Products";
import Cart from "./pages/client/Cart";
import Profile from "./pages/client/Profile";
import ClientReservations from "./pages/client/Reservations";

// Páginas administrativas
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UsersAdmin from "./pages/admin/UsersAdmin";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin";
import CampaignsAdmin from "./pages/admin/CampaignsAdmin";
import ConsultantsAdmin from "./pages/admin/ConsultantsAdmin";
import ReservationsAdmin from "./pages/admin/ReservationsAdmin";
import RolesAdmin from "./pages/admin/RolesAdmin";
import ProfileAdmin from "./pages/admin/ProfileAdmin";

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

// Layout principal con navbar
function MainLayout() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>

        <BrowserRouter>
          <Routes>
            {/* Rutas de autenticación SIN navbar */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Todas las rutas principales CON navbar */}
            <Route element={<MainLayout />}>
              {/* Páginas públicas - accesibles sin login */}
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/category/:id" element={<CategoryProducts />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/products" element={<Products />} /> {/* ¡Ahora es público! */}

              {/* Páginas protegidas (requieren login) */}
              <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/my-reservations" element={
                <ProtectedRoute>
                  <ClientReservations />
                </ProtectedRoute>
              } />
            </Route>

            {/* Rutas administrativas */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<UsersAdmin />} />
              <Route path="products" element={<ProductsAdmin />} />
              <Route path="categories" element={<CategoriesAdmin />} />
              <Route path="campaigns" element={<CampaignsAdmin />} />
              <Route path="consultants" element={<ConsultantsAdmin />} />
              <Route path="reservations" element={<ReservationsAdmin />} />
              <Route path="profile" element={<ProfileAdmin />} />
              <Route path="roles" element={<RolesAdmin />} />
            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<Home />} />
          </Routes>
        </BrowserRouter>

      </NotificationProvider>
    </AuthProvider>
  );
}