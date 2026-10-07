import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import { Protected, AdminOnly } from "./components/Guards.jsx";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Chat from "./pages/Chat.jsx";
import Account from "./pages/Account.jsx";
import { Privacy, Terms, Refunds, Shipping, Contact } from "./pages/Legal.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import ProductsAdmin from "./pages/admin/Products.jsx";
import OrdersAdmin from "./pages/admin/Orders.jsx";
import CouponsAdmin from "./pages/admin/Coupons.jsx";
import UsersAdmin from "./pages/admin/Users.jsx";
import { Link } from "react-router-dom";

const ChatFab = () => (
  <Link
    to="/chat"
    aria-label="Chat with Shree Assistant"
    className="fixed bottom-5 right-5 z-40 rounded-full bg-primary p-4 text-2xl shadow-lg hover:bg-primary-soft"
  >
    💬
  </Link>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:pid" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refunds" element={<Refunds />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/contact" element={<Contact />} />
          <Route element={<Protected />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:oid" element={<OrderDetail />} />
            <Route path="/account" element={<Account />} />
          </Route>
          <Route element={<AdminOnly />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<ProductsAdmin />} />
              <Route path="orders" element={<OrdersAdmin />} />
              <Route path="coupons" element={<CouponsAdmin />} />
              <Route path="users" element={<UsersAdmin />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ChatFab />
      <ToastContainer position="bottom-center" />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
