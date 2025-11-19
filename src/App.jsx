import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppFloat from './components/WhatsAppFloat'

import ProtectedRoute from './components/ProtectedRoute'
import { CurrencyProvider } from './context/CurrencyContext'
import { SellerProvider } from './context/SellerContext'
import Home from './pages/Home'
import AmazonsChoice from './pages/AmazonsChoice'
import BestSellers from './pages/BestSellers'
import Categories from './pages/Categories'
import LatestDeals from './pages/LatestDeals'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import AuthLanding from './pages/auth/AuthLanding'
import BuyerLogin from './pages/auth/BuyerLogin'
import SupplierLogin from './pages/auth/SupplierLogin'
import BuyerRegister from './pages/auth/BuyerRegister'
import SupplierRegister from './pages/auth/SupplierRegister'
import JoinNow from './pages/onboarding/JoinNow'
import Product from './pages/Product'
import ProductDetail from './pages/ProductDetail'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminAddProduct from './pages/admin/AddProduct'
import EditProduct from './pages/admin/EditProduct'
import ExcelProducts from './pages/ExcelProducts'
import AdminSellers from './pages/admin/Sellers'
import AdminSellerProducts from './pages/admin/SellerProducts'
import AdminSellerVerifications from './pages/admin/SellerVerifications'
import ExcelImport from './pages/admin/ExcelImport'
import AdminBuyers from './pages/admin/Buyers'
import BuyerDashboard from './pages/buyer/Dashboard'
import SellerDashboard from './pages/seller/Dashboard'
import ClearStorage from './pages/ClearStorage'
import SellerProfile from './pages/seller/Profile'
import SellerProducts from './pages/seller/Products'
import SellerAddProduct from './pages/seller/AddProduct'
import SellerAddProducts from './pages/seller/AddProducts'
import SellerEditProfile from './pages/seller/EditProfile'
import './App.css'

function App() {
  // Auto-cleanup: Prevent token conflicts on app load
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    const sellerToken = localStorage.getItem('sellerToken')
    const buyerToken = localStorage.getItem('buyerToken')
    
    // If multiple tokens exist, keep only the most recent one based on current URL
    const isAdminRoute = window.location.pathname.startsWith('/admin')
    const isSellerRoute = window.location.pathname.startsWith('/seller')
    const isBuyerRoute = window.location.pathname.startsWith('/buyer')
    
    if (isAdminRoute && (sellerToken || buyerToken)) {
      // On admin routes, clear seller/buyer tokens
      localStorage.removeItem('sellerToken')
      localStorage.removeItem('sellerData')
      localStorage.removeItem('buyerToken')
      localStorage.removeItem('buyerData')
    } else if (isSellerRoute && (adminToken || buyerToken)) {
      // On seller routes, clear admin/buyer tokens
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminData')
      localStorage.removeItem('buyerToken')
      localStorage.removeItem('buyerData')
    } else if (isBuyerRoute && (adminToken || sellerToken)) {
      // On buyer routes, clear admin/seller tokens
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminData')
      localStorage.removeItem('sellerToken')
      localStorage.removeItem('sellerData')
    }
  }, [])
  
  return (
    <CurrencyProvider>
      <SellerProvider>
        <Router>
        <div className="App">
          <Navbar />
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clear-storage" element={<ClearStorage />} />
          <Route path="/amazons-choice" element={<AmazonsChoice />} />
          <Route path="/best-sellers" element={<BestSellers />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/latest-deals" element={<LatestDeals />} />
          <Route path="/contact" element={<Contact />} />
          {/* Legacy routes - redirect to new auth system */}
          <Route path="/login" element={<AuthLanding />} />
          <Route path="/register" element={<AuthLanding />} />
          
          {/* New Auth Routes */}
          <Route path="/auth" element={<AuthLanding />} />
          <Route path="/login/buyer" element={<BuyerLogin />} />
          <Route path="/login/supplier" element={<SupplierLogin />} />
          <Route path="/register/buyer" element={<BuyerRegister />} />
          <Route path="/register/supplier" element={<SupplierRegister />} />
          <Route path="/join-now" element={<JoinNow />} />
          
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/excel-products" element={<ExcelProducts />} />
          
          {/* Buyer Routes */}
          <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
          
          {/* Seller Routes */}
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/profile" element={<SellerProfile />} />
          <Route path="/seller/profile/edit" element={<SellerEditProfile />} />
          <Route path="/seller/products" element={<SellerProducts />} />
          <Route path="/seller/products/add" element={<SellerAddProduct />} />
          <Route path="/seller/add-products" element={<SellerAddProducts />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/products/add" element={<ProtectedRoute><AdminAddProduct /></ProtectedRoute>} />
          <Route path="/admin/products/edit/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
          <Route path="/admin/sellers" element={<ProtectedRoute><AdminSellers /></ProtectedRoute>} />
          <Route path="/admin/seller-products" element={<ProtectedRoute><AdminSellerProducts /></ProtectedRoute>} />
          <Route path="/admin/seller-verifications" element={<ProtectedRoute><AdminSellerVerifications /></ProtectedRoute>} />
          <Route path="/admin/buyers" element={<ProtectedRoute><AdminBuyers /></ProtectedRoute>} />
          <Route path="/admin/excel-import" element={<ProtectedRoute><ExcelImport /></ProtectedRoute>} />
        </Routes>
        <Footer />
        <WhatsAppFloat />
        </div>
      </Router>
      </SellerProvider>
    </CurrencyProvider>
  )
}

export default App
