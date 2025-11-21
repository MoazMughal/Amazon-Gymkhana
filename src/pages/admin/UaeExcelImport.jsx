import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

const UaeExcelImport = () => {
  const { isLoggedIn: isAdminLoggedIn, loading: adminLoading } = useAdmin();
  const [uaeProducts, setUaeProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [editedData, setEditedData] = useState({});
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState('');
  const navigate = useNavigate();

  // Helper function to get UAE image path
  const getUaeImagePath = (asin) => {
    if (!asin) return 'https://via.placeholder.com/50x50?text=No+Image';
    
    // Images are served from the public folder
    // Vite serves public folder assets at the root path
    return `/assets/uae/${asin}.jpg`;
  };

  // Load UAE products and sellers from server
  useEffect(() => {
    if (!adminLoading && isAdminLoggedIn) {
      loadUaeProducts();
      loadSellers();
    }
  }, [adminLoading, isAdminLoggedIn]);

  useEffect(() => {
    let filtered = uaeProducts;
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.asin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, uaeProducts]);

  const loadUaeProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/excel/uae-products');
      const data = await response.json();
      
      if (data.success) {
        setUaeProducts(data.products);
        setFilteredProducts(data.products);
        // Initialize edited data with default values
        const initialEdited = {};
        data.products.forEach((product, index) => {
          initialEdited[index] = {
            price: product.price || 0,
            stock: product.stock || 0
          };
        });
        setEditedData(initialEdited);
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('❌ Could not load UAE products from server');
    } finally {
      setLoading(false);
    }
  };

  const loadSellers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token || !isAdminLoggedIn) {
        console.log('No admin token or not logged in, skipping seller load');
        return;
      }
      
      // Load ALL sellers (verified and unverified)
      const response = await fetch('http://localhost:5000/api/sellers?status=all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch sellers');
      }
      
      const data = await response.json();
      
      if (data.sellers && Array.isArray(data.sellers)) {
        if (data.sellers.length === 0) {
          alert('ℹ️ No sellers found in the system');
        }
        setSellers(data.sellers);
      } else {
        alert('⚠️ Invalid response format from server');
        setSellers([]);
      }
    } catch (error) {
      alert('❌ Could not load sellers: ' + error.message);
      setSellers([]);
    }
  };

  const toggleSelectProduct = (index) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProducts(newSelected);
  };

  const handleEditChange = (index, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  };

  const handleImportToCategory = async (targetCategory) => {
    if (selectedProducts.size === 0) {
      alert('⚠️ Please select at least one product to import');
      return;
    }

    if (!selectedSeller) {
      alert('⚠️ Please select a seller first');
      return;
    }

    const categoryNames = {
      'amazons-choice': "Amazon's Choice",
      'best-sellers': 'Best Sellers',
      'latest-deals': 'Latest Deals',
      'home': 'Home Page'
    };

    if (!confirm(`Import ${selectedProducts.size} products to ${categoryNames[targetCategory]} for seller ${sellers.find(s => s._id === selectedSeller)?.username}?`)) {
      return;
    }

    const productsToImport = Array.from(selectedProducts).map(index => {
      const product = filteredProducts[index];
      const edited = editedData[index] || {};
      
      // Use ASIN to construct image URL
      const imageUrl = getUaeImagePath(product.asin);
      
      return {
        name: product.name,
        asin: product.asin,
        price: parseFloat(edited.price) || product.price || 0,
        originalPrice: product.originalPrice,
        category: product.category,
        brand: product.brand,
        rating: product.rating,
        reviews: product.reviews,
        stock: parseInt(edited.stock) || product.stock || 0,
        description: product.description,
        image: imageUrl,
        images: [imageUrl],
        discount: product.discount,
        marketplace: 'UAE',
        currency: 'AED',
        isAdminProduct: true,
        isAmazonsChoice: targetCategory === 'amazons-choice',
        isBestSeller: targetCategory === 'best-sellers',
        isLatestDeal: targetCategory === 'latest-deals',
        showOnHome: targetCategory === 'home',
        status: 'active',
        approvalStatus: 'approved',
        seller: selectedSeller,
        listedBy: 'admin'
      };
    });

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('http://localhost:5000/api/products/admin/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ products: productsToImport })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Successfully imported ${data.imported} UAE products to ${categoryNames[targetCategory]}!`);
        setSelectedProducts(new Set());
        loadUaeProducts(); // Reload to refresh
      } else {
        alert('❌ ' + (data.message || 'Failed to import products'));
      }
    } catch (error) {
      alert('❌ Failed to import products: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((_, index) => index)));
    }
  };

  return (
    <div className="container-fluid mt-3" style={{fontSize: '0.85rem'}}>
      <div className="row mb-3">
        <div className="col-md-8">
          <h5 style={{fontSize: '1rem', fontWeight: '600', marginBottom: '5px'}}>
            <i className="fas fa-file-excel text-success me-2"></i>
            UAE Products Import
          </h5>
          <p className="text-muted mb-0" style={{fontSize: '0.75rem'}}>Import products from uae-asin.xlsx file</p>
        </div>
        <div className="col-md-4 text-end">
          <button 
            className="btn btn-secondary btn-sm me-2" 
            onClick={() => navigate('/admin/dashboard')}
            style={{fontSize: '0.75rem'}}
          >
            <i className="fas fa-arrow-left me-1"></i>
            Back
          </button>
          <button 
            className="btn btn-info btn-sm" 
            onClick={loadUaeProducts}
            disabled={loading}
            style={{fontSize: '0.75rem'}}
          >
            <i className="fas fa-sync me-1"></i>
            Reload
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="row mb-2">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body" style={{padding: '8px'}}>
              <h6 style={{fontSize: '0.7rem', marginBottom: '3px'}}>Total Products</h6>
              <h4 style={{fontSize: '1.2rem', marginBottom: '0'}}>{uaeProducts.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body" style={{padding: '8px'}}>
              <h6 style={{fontSize: '0.7rem', marginBottom: '3px'}}>Selected</h6>
              <h4 style={{fontSize: '1.2rem', marginBottom: '0'}}>{selectedProducts.size}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body" style={{padding: '8px'}}>
              <h6 style={{fontSize: '0.7rem', marginBottom: '3px'}}>Marketplace</h6>
              <h4 style={{fontSize: '1.2rem', marginBottom: '0'}}>UAE</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body" style={{padding: '8px'}}>
              <h6 style={{fontSize: '0.7rem', marginBottom: '3px'}}>Currency</h6>
              <h4 style={{fontSize: '1.2rem', marginBottom: '0'}}>AED (د.إ)</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card mb-2">
        <div className="card-body" style={{padding: '10px'}}>
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="input-group input-group-sm">
                <span className="input-group-text" style={{fontSize: '0.75rem'}}>
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  style={{fontSize: '0.8rem'}}
                  placeholder="Search by product name, ASIN, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-4 text-end">
              <button 
                className="btn btn-outline-primary btn-sm"
                style={{fontSize: '0.75rem'}}
                onClick={selectAll}
              >
                {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Selection */}
      <div className="card mb-2">
        <div className="card-body" style={{padding: '10px'}}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0" style={{fontSize: '0.85rem'}}>
              <i className="fas fa-user-tie me-2"></i>
              Select Seller for Products
            </h6>
            <span className="badge bg-info" style={{fontSize: '0.7rem'}}>
              {sellers.length} Sellers Available
            </span>
          </div>
          <select
            className="form-select form-select-sm"
            style={{fontSize: '0.8rem'}}
            value={selectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
            disabled={sellers.length === 0}
          >
            <option value="">-- Select a Seller --</option>
            {sellers.map(seller => (
              <option key={seller._id} value={seller._id}>
                {seller.username} ({seller.supplierId}) - {seller.email} - {seller.verificationStatus}
              </option>
            ))}
          </select>
          {sellers.length === 0 && (
            <div className="alert alert-danger mt-2 mb-0" style={{padding: '8px', fontSize: '0.75rem'}}>
              <i className="fas fa-exclamation-circle me-2"></i>
              No sellers found. Please add sellers first.
            </div>
          )}
          {sellers.length > 0 && !selectedSeller && (
            <div className="alert alert-warning mt-2 mb-0" style={{padding: '8px', fontSize: '0.75rem'}}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              Please select a seller before importing products
            </div>
          )}
          {selectedSeller && (
            <div className="alert alert-success mt-2 mb-0" style={{padding: '8px', fontSize: '0.75rem'}}>
              <i className="fas fa-check-circle me-2"></i>
              Seller selected: {sellers.find(s => s._id === selectedSeller)?.username}
            </div>
          )}
        </div>
      </div>

      {/* Category Import Buttons */}
      <div className="card mb-2">
        <div className="card-body" style={{padding: '10px'}}>
          <h6 className="mb-2" style={{fontSize: '0.85rem'}}>
            <i className="fas fa-layer-group me-2"></i>
            Import Selected Products To:
          </h6>
          <div className="row g-2">
            <div className="col-md-3">
              <button 
                className="btn btn-warning w-100 btn-sm"
                onClick={() => handleImportToCategory('amazons-choice')}
                disabled={selectedProducts.size === 0 || loading}
                style={{fontSize: '0.75rem', padding: '8px'}}
              >
                <i className="fas fa-trophy me-1"></i>
                Amazon's Choice ({selectedProducts.size})
              </button>
            </div>
            <div className="col-md-3">
              <button 
                className="btn btn-danger w-100 btn-sm"
                onClick={() => handleImportToCategory('best-sellers')}
                disabled={selectedProducts.size === 0 || loading}
                style={{fontSize: '0.75rem', padding: '8px'}}
              >
                <i className="fas fa-fire me-1"></i>
                Best Sellers ({selectedProducts.size})
              </button>
            </div>
            <div className="col-md-3">
              <button 
                className="btn btn-info w-100 btn-sm"
                onClick={() => handleImportToCategory('latest-deals')}
                disabled={selectedProducts.size === 0 || loading}
                style={{fontSize: '0.75rem', padding: '8px'}}
              >
                <i className="fas fa-bolt me-1"></i>
                Latest Deals ({selectedProducts.size})
              </button>
            </div>
            <div className="col-md-3">
              <button 
                className="btn btn-success w-100 btn-sm"
                onClick={() => handleImportToCategory('home')}
                disabled={selectedProducts.size === 0 || loading}
                style={{fontSize: '0.75rem', padding: '8px'}}
              >
                <i className="fas fa-home me-1"></i>
                Home Page ({selectedProducts.size})
              </button>
            </div>
          </div>
          {selectedProducts.size === 0 && (
            <div className="alert alert-info mt-2 mb-0" style={{padding: '8px', fontSize: '0.75rem'}}>
              <i className="fas fa-info-circle me-2"></i>
              Select products from the table below to import them to specific categories
            </div>
          )}
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading UAE products...</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{width: '40px', fontSize: '0.75rem', padding: '8px'}}>
                      <input
                        type="checkbox"
                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={selectAll}
                      />
                    </th>
                    <th style={{fontSize: '0.75rem', padding: '8px'}}>Image</th>
                    <th style={{fontSize: '0.75rem', padding: '8px'}}>Product Name</th>
                    <th style={{fontSize: '0.75rem', padding: '8px'}}>ASIN</th>
                    <th style={{fontSize: '0.75rem', padding: '8px'}}>Price (AED)</th>
                    <th style={{fontSize: '0.75rem', padding: '8px'}}>Stock</th>
                    <th style={{fontSize: '0.75rem', padding: '8px'}}>Rating</th>
                    <th style={{fontSize: '0.75rem', padding: '8px'}}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr key={index} style={{fontSize: '0.8rem'}}>
                      <td style={{padding: '8px'}}>
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(index)}
                          onChange={() => toggleSelectProduct(index)}
                        />
                      </td>
                      <td style={{padding: '8px'}}>
                        <img 
                          src={getUaeImagePath(product.asin)} 
                          alt={product.name}
                          style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
                          }}
                        />
                      </td>
                      <td style={{padding: '8px'}}>
                        <div style={{maxWidth: '300px', fontSize: '0.8rem'}}>
                          <strong>{product.name}</strong>
                          {product.brand && <div className="text-muted" style={{fontSize: '0.7rem'}}>{product.brand}</div>}
                        </div>
                      </td>
                      <td style={{padding: '8px'}}>
                        <code style={{fontSize: '0.7rem'}}>{product.asin}</code>
                      </td>
                      <td style={{padding: '8px'}}>
                        <div className="input-group input-group-sm" style={{width: '120px'}}>
                          <span className="input-group-text" style={{fontSize: '0.7rem'}}>د.إ</span>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{fontSize: '0.75rem'}}
                            value={editedData[index]?.price ?? product.price}
                            onChange={(e) => handleEditChange(index, 'price', e.target.value)}
                            placeholder="Price"
                          />
                        </div>
                      </td>
                      <td style={{padding: '8px'}}>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{width: '70px', fontSize: '0.75rem'}}
                          value={editedData[index]?.stock ?? product.stock}
                          onChange={(e) => handleEditChange(index, 'stock', e.target.value)}
                          placeholder="Stock"
                        />
                      </td>
                      <td style={{padding: '8px'}}>
                        <span className="badge bg-warning" style={{fontSize: '0.7rem'}}>
                          <i className="fas fa-star"></i> {product.rating}
                        </span>
                        <div className="text-muted" style={{fontSize: '0.65rem'}}>{product.reviews} reviews</div>
                      </td>
                      <td style={{padding: '8px'}}>
                        <span className="badge bg-info" style={{fontSize: '0.7rem'}}>{product.category}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-5">
                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p className="text-muted">No products found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UaeExcelImport;
