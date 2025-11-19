import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/AdminProductForm.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    discount: '',
    category: '',
    subcategory: '',
    brand: '',
    images: '',
    rating: 4.5,
    reviews: 0,
    stock: 0,
    seller: '',
    isAmazonsChoice: false,
    isBestSeller: false,
    status: 'active'
  });

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/sellers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSellers(data.sellers || []);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        discount: formData.discount ? parseFloat(formData.discount) : undefined,
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews),
        stock: parseInt(formData.stock),
        images: formData.images.split(',').map(img => img.trim()).filter(img => img)
      };

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        alert('✅ Product added successfully!');
        navigate('/admin/products');
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-product-form">
      <header className="form-header">
        <h1>➕ Add New Product</h1>
        <button onClick={() => navigate('/admin/products')} className="back-btn">
          ← Back to Products
        </button>
      </header>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-section">
          <h2>📝 Basic Information</h2>
          
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter product name"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Enter product description"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Sports">Sports</option>
                <option value="Books">Books</option>
                <option value="Toys">Toys</option>
                <option value="Beauty">Beauty</option>
                <option value="Food">Food</option>
              </select>
            </div>

            <div className="form-group">
              <label>Subcategory</label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="e.g., Smartphones, T-Shirts"
              />
            </div>

            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Enter brand name"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>💰 Pricing & Stock</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Original Price (₹)</label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                min="0"
                max="100"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>⭐ Rating & Reviews</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Rating (0-5)</label>
              <input
                type="number"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                min="0"
                max="5"
                step="0.1"
                placeholder="4.5"
              />
            </div>

            <div className="form-group">
              <label>Number of Reviews</label>
              <input
                type="number"
                name="reviews"
                value={formData.reviews}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>🖼️ Images</h2>
          
          <div className="form-group">
            <label>Image URLs (comma-separated)</label>
            <textarea
              name="images"
              value={formData.images}
              onChange={handleChange}
              rows="3"
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            />
            <small>Enter multiple image URLs separated by commas</small>
          </div>
        </div>

        <div className="form-section">
          <h2>👤 Seller & Status</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Seller</label>
              <select name="seller" value={formData.seller} onChange={handleChange}>
                <option value="">Direct (No Seller)</option>
                {sellers.map(seller => (
                  <option key={seller._id} value={seller._id}>
                    {seller.businessName} - {seller.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="active">✅ Active</option>
                <option value="inactive">❌ Inactive</option>
                <option value="pending">⏳ Pending</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isAmazonsChoice"
                  checked={formData.isAmazonsChoice}
                  onChange={handleChange}
                />
                <span>🏆 Amazon's Choice</span>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isBestSeller"
                  checked={formData.isBestSeller}
                  onChange={handleChange}
                />
                <span>🔥 Best Seller</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '⏳ Adding Product...' : '✅ Add Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
