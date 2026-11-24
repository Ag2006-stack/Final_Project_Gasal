import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import OfflineBanner from './components/OfflineBanner';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NetworkStatusProvider } from './context/NetworkStatusContext';

const Home = lazy(() => import('./pages/Home'));
const Catalog = lazy(() => import('./pages/Catalog'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <NetworkStatusProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="app-shell">
              <OfflineBanner />
              <Header />

              <main className="app-main">
                <Suspense fallback={<p aria-live="polite">Loading view...</p>}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Catalog />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/ai-assistant" element={<AIAssistant />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payment/success"
                      element={<PaymentCallback mode="success" />}
                    />
                    <Route
                      path="/payment/cancelled"
                      element={<PaymentCallback mode="cancelled" />}
                    />
                    <Route
                      path="/orders"
                      element={
                        <ProtectedRoute>
                          <Orders />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orders/:id"
                      element={
                        <ProtectedRoute>
                          <OrderDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/admin/*"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>

                <footer className="app-footer">
                  CoreSpec Hardware PWA • Precision Components & Systems
                </footer>
              </main>

              <BottomNav />
            </div>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </NetworkStatusProvider>
  );
}