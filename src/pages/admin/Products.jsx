import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/AdminProducts.css';
import '../../styles/AdminLayout.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', status: '' });
  const [currency, setCurrency] = useState('PKR');
  const navigate = useNavigate();

  // Currency conversion rates (base: PKR)
  const currencyRates = {
    PKR: 1,
    USD: 0.0036,
    GBP: 0.0028
  };

  const currencySymbols = {
    PKR: 'Rs',
    USD: '$',
    GBP: '£'
  };

  const convertPrice = (price) => {
    const converted = price * currencyRates[currency];
    return converted.toFixed(2);
  };

  const formatPrice = (price) => {
    return `${currencySymbols[currency]}${convertPrice(price)}`;
  };

  useEffect(() => {
    fetchProducts();
  }, [search, filters]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status })
      });

      const response = await fetch(`http://localhost:5000/api/products?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="admin-products" style={{fontSize: '0.85rem'}}>
      <header className="page-header" style={{padding: '12px 0', marginBottom: '15px'}}>
        <h1 style={{fontSize: '1.3rem', margin: 0}}>📦 Products ({products.length})</h1>
        <div className="header-actions" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <span style={{fontSize: '0.75rem', color: '#666'}}>💱</span>
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #667eea',
                background: 'white',
                color: '#667eea',
                fontWeight: '600',
                fontSize: '0.75rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="PKR">Rs</option>
              <option value="USD">$</option>
              <option value="GBP">£</option>
            </select>
          </div>
          <button 
            onClick={() => navigate('/admin/excel-import')} 
            className="add-btn"
            style={{padding: '5px 10px', fontSize: '0.75rem'}}
          >
            ➕ Add from Excel
          </button>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="back-btn"
            style={{padding: '5px 10px', fontSize: '0.75rem'}}
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="filters-section" style={{padding: '10px', marginBottom: '10px'}}>
        <div className="search-box" style={{marginBottom: '8px'}}>
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            style={{padding: '6px 10px', fontSize: '0.8rem'}}
          />
        </div>
        
        <div className="filters" style={{display: 'flex', gap: '8px'}}>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="filter-select"
            style={{padding: '5px 8px', fontSize: '0.75rem'}}
          >
            <option value="">All Status</option>
            <option value="active">✅ Active</option>
            <option value="inactive">❌ Inactive</option>
            <option value="pending">⏳ Pending</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="filter-select"
            style={{padding: '5px 8px', fontSize: '0.75rem'}}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Sports">Sports</option>
            <option value="Books">Books</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="products-table-container">
          <div className="table-info" style={{padding: '6px 0', fontSize: '0.75rem'}}>
            <span>Showing {products.length} products</span>
          </div>
          
          <div className="products-table" style={{fontSize: '0.8rem'}}>
            <table style={{width: '100%'}}>
              <thead>
                <tr style={{background: '#f8f9fa'}}>
                  <th style={{padding: '8px', fontSize: '0.75rem', fontWeight: '600'}}>Product</th>
                  <th style={{padding: '8px', fontSize: '0.75rem', fontWeight: '600'}}>Category</th>
                  <th style={{padding: '8px', fontSize: '0.75rem', fontWeight: '600'}}>Price</th>
                  <th style={{padding: '8px', fontSize: '0.75rem', fontWeight: '600'}}>Stock</th>
                  <th style={{padding: '8px', fontSize: '0.75rem', fontWeight: '600'}}>Status</th>
                  <th style={{padding: '8px', fontSize: '0.75rem', fontWeight: '600'}}>Seller</th>
                  <th style={{padding: '8px', fontSize: '0.75rem', fontWeight: '600'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id} style={{borderBottom: '1px solid #e5e7eb'}}>
                    <td className="product-info" style={{padding: '6px 8px'}}>
                      <div className="product-name" style={{fontSize: '0.8rem', fontWeight: '500', marginBottom: '2px'}}>{product.name}</div>
                      <div className="product-id" style={{fontSize: '0.65rem', color: '#6b7280'}}>ID: {product._id.slice(-6)}</div>
                    </td>
                    <td style={{padding: '6px 8px'}}>
                      <span className="category-badge" style={{fontSize: '0.7rem', padding: '2px 6px'}}>{product.category}</span>
                    </td>
                    <td className="price" style={{padding: '6px 8px', fontSize: '0.8rem', fontWeight: '600'}}>{formatPrice(product.price)}</td>
                    <td className="stock" style={{padding: '6px 8px'}}>
                      <span className={product.stock > 10 ? 'in-stock' : 'low-stock'} style={{fontSize: '0.75rem', padding: '2px 6px'}}>
                        {product.stock}
                      </span>
                    </td>
                    <td style={{padding: '6px 8px'}}>
                      <select
                        value={product.status}
                        onChange={(e) => handleStatusChange(product._id, e.target.value)}
                        className={`status-select ${product.status}`}
                        style={{fontSize: '0.7rem', padding: '3px 6px'}}
                      >
                        <option value="active">✅</option>
                        <option value="inactive">❌</option>
                        <option value="pending">⏳</option>
                      </select>
                    </td>
                    <td className="seller-info" style={{padding: '6px 8px', fontSize: '0.75rem'}}>
                      {product.seller?.businessName || 'Direct'}
                    </td>
                    <td className="actions" style={{padding: '6px 8px'}}>
                      <button
                        onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                        className="edit-btn"
                        title="Edit Product"
                        style={{padding: '3px 8px', fontSize: '0.7rem', marginRight: '4px'}}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="delete-btn"
                        title="Delete Product"
                        style={{padding: '3px 8px', fontSize: '0.7rem'}}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <div className="no-products" style={{padding: '30px', textAlign: 'center'}}>
              <h3 style={{fontSize: '1rem', marginBottom: '8px'}}>No products found</h3>
              <p style={{fontSize: '0.8rem', marginBottom: '12px'}}>Try adjusting your search or filters</p>
              <button 
                onClick={() => navigate('/admin/excel-import')} 
                className="add-first-product"
                style={{padding: '6px 12px', fontSize: '0.8rem'}}
              >
                ➕ Add from Excel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
