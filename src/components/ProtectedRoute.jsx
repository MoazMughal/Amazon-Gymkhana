import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const sellerToken = localStorage.getItem('sellerToken');
  const buyerToken = localStorage.getItem('buyerToken');
  
  // If trying to access admin routes but logged in as seller/buyer, clear their tokens
  if (!adminToken && (sellerToken || buyerToken)) {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerData');
    localStorage.removeItem('buyerToken');
    localStorage.removeItem('buyerData');
    return <Navigate to="/admin/login" replace />;
  }
  
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
