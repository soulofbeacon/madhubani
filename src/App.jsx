import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import MobileBottomMenu from './components/MobileBottomMenu';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import AddProduct from './pages/AddProduct';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import Contact from './pages/Contact';
import AdminChatOverview from './pages/AdminChatOverview';
import AdminChat from './pages/AdminChat';

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={
                <PrivateRoute>
                  <Cart />
                </PrivateRoute>
              } />
              <Route path="/wishlist" element={
                <PrivateRoute>
                  <Wishlist />
                </PrivateRoute>
              } />
              <Route path="/orders" element={
                <PrivateRoute>
                  <Orders />
                </PrivateRoute>
              } />
              <Route path="/orders/:id" element={
                <PrivateRoute>
                  <OrderDetails />
                </PrivateRoute>
              } />
              <Route path="/checkout" element={
                <PrivateRoute>
                  <Checkout />
                </PrivateRoute>
              } />
              <Route path="/checkout/success" element={
                <PrivateRoute>
                  <CheckoutSuccess />
                </PrivateRoute>
              } />
              <Route path="/checkout/cancel" element={
                <PrivateRoute>
                  <CheckoutCancel />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/admin" element={
                <PrivateRoute requireAdmin>
                  <AdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/admin/add-product" element={
                <PrivateRoute requireAdmin>
                  <AddProduct />
                </PrivateRoute>
              } />
              <Route path="/admin/orders/:id" element={
                <PrivateRoute requireAdmin>
                  <OrderDetails />
                </PrivateRoute>
              } />
              <Route path="/admin/chats" element={
                <PrivateRoute requireAdmin>
                  <AdminChatOverview />
                </PrivateRoute>
              } />
              <Route path="/admin/chat/:userId" element={
                <PrivateRoute requireAdmin>
                  <AdminChat />
                </PrivateRoute>
              } />
            </Routes>
            <MobileBottomMenu />
            <Toaster position="top-right" />
          </div>
        </Router>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;