import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeller } from '../../context/SellerContext';
import { getApiUrl } from '../../utils/api';

const COUNTRY_OPTIONS = [
  { code: 'GBP', label: 'UK (£ GBP)' },
  { code: 'PKR', label: 'Pakistan (Rs PKR)' },
  { code: 'AED', label: 'UAE (AED)' },
  { code: 'USD', label: 'USA ($ USD)' },
];

// Render flag using regional indicator letters (encoding-safe)
const countryFlag = (code) => {
  const flags = { GBP: 'GB', PKR: 'PK', AED: 'AE', USD: 'US' };
  const cc = flags[code];
  if (!cc) return '\uD83C\uDF0D'; // 🌍 globe fallback
  return String.fromCodePoint(...[...cc].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
};

// Shipping is always calculated in PKR. Convert to display currency.
const PKR_RATES = { PKR: 1, GBP: 440, AED: 75, USD: 280 };
const CURRENCY_SYMBOLS = { GBP: '£', PKR: 'Rs', AED: 'د.إ', USD: '$' };

const calcShipping = (l, w, h, wtGrams) => {
  const actualWeight = wtGrams > 0 ? wtGrams / 1000 : 0;
  const volumetricWeight = (l * w * h) / 5000;
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);
  return parseFloat((chargeableWeight * 1600).toFixed(2)); // Rs (PKR)
};

const shippingInCurrency = (pkrAmount, currency) => {
  const rate = PKR_RATES[currency] || PKR_RATES.GBP;
  return parseFloat((pkrAmount / rate).toFixed(2));
};

const ListedProducts = () => {
  const navigate = useNavigate();
  const { seller, isLoggedIn, loading, authResolved } = useSeller();
  const [products, setProducts] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState('approved');
  const [editingCell, setEditingCell] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [priceCurrencyEdit, setPriceCurrencyEdit] = useState({}); // per-product currency during price edit
  const [dimEdit, setDimEdit] = useState({}); // per-product dimensions during shipping edit
  const [updatingProducts, setUpdatingProducts] = useState(new Set());
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingCountry, setUpdatingCountry] = useState(new Set());
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [asinModal, setAsinModal] = useState(null);
  const [asinSaving, setAsinSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkEdit, setBulkEdit] = useState({ price: '', shipping: '', stock: '', moq: '' });
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const itemsPerPage = 50;

  useEffect(() => {
    // Wait for authentication to be resolved before checking login status
    if (!authResolved || loading) {
      return;
    }

    if (!isLoggedIn || !seller) {
      navigate('/login/supplier');
      return;
    }
    
    loadProducts();
  }, [isLoggedIn, seller, navigate, activeTab, authResolved, loading, currentPage]);

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Debounced search — reset page and reload when searchTerm changes
  useEffect(() => {
    if (!authResolved || !isLoggedIn || !seller) return;
    setCurrentPage(1);
    const t = setTimeout(() => loadProducts(), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Category filter — reload immediately when category changes
  useEffect(() => {
    if (!authResolved || !isLoggedIn || !seller) return;
    setCurrentPage(1);
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async (isRetry = false) => {
    try {
      setPageLoading(true);
      setShowRetryButton(false);
      setErrorMsg('');
      
      const token = localStorage.getItem('sellerToken');
      
      if (!token) {
        navigate('/login/supplier');
        return;
      }
      
      const statusParam = activeTab !== 'all' ? `&status=${activeTab}` : '';
      const searchParam = searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : '';
      const categoryParam = selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : '';
      
      // Timeout covers the full request + parse cycle
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      let data;
      try {
        const response = await fetch(getApiUrl(`products/seller/listed-products?limit=${itemsPerPage}&page=${currentPage}${statusParam}${searchParam}${categoryParam}`), {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        });
        data = await response.json(); // parse before clearing timeout
        clearTimeout(timeoutId);

        if (response.ok) {
          const enriched = (data.products || []).map(p => {
            const sellerId = seller?._id?.toString();
            const sellerEntry = p.sellers?.find(s => s.sellerId?.toString() === sellerId);
            return {
              ...p,
              sellerListingCountries: sellerEntry?.listingCountries || [],
              sellerPriceCurrency: sellerEntry?.priceCurrency || 'GBP',
              sellerCustomPrice: sellerEntry?.sellerPrice ?? p.sellerInfo?.sellerPrice ?? p.price,
              sellerAsinData: {
                asinAvailable: sellerEntry?.asinAvailable || false,
                asinYearlyCost: sellerEntry?.asinYearlyCost || 0,
                asinReviews: sellerEntry?.asinReviews || 0,
                asinYearlyIncome: sellerEntry?.asinYearlyIncome || 0
              }
            };
          });
          setProducts(enriched);
          setCounts(data.counts || { total: 0, pending: 0, approved: 0, rejected: 0 });
          setTotalPages(data.totalPages || 1);
          setRetryCount(0);
        } else {
          clearTimeout(timeoutId);
          if (response.status === 401) {
            navigate('/login/supplier');
          } else {
            setShowRetryButton(true);
            setErrorMsg(data.message || 'Failed to load products');
          }
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error) {
      console.error('Network error:', error);
      if (error.name === 'AbortError') {
        setShowRetryButton(true);
        setErrorMsg('Request timed out. Please check your connection and try again.');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setShowRetryButton(true);
        setErrorMsg('Could not connect to server. Please check your internet connection.');
      } else {
        if (!isRetry && retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => loadProducts(true), 2000);
          return;
        }
        setShowRetryButton(true);
        setErrorMsg('Could not load products. Please try again.');
      }
    } finally {
      setPageLoading(false);
    }
  };

  const handleBulkUnlist = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to unlist ${selectedIds.size} product${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return;

    setBulkDeleting(true);
    const token = localStorage.getItem('sellerToken');
    let successCount = 0;
    let failCount = 0;

    await Promise.all([...selectedIds].map(async (id) => {
      try {
        const res = await fetch(getApiUrl(`sellers/unlist-product/${id}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }));

    setBulkDeleting(false);
    setSelectedIds(new Set());
    if (failCount > 0) alert(`✅ ${successCount} unlisted, ❌ ${failCount} failed.`);
    loadProducts();
  };

  const handleBulkUpdate = async () => {
    const { price, shipping, stock, moq } = bulkEdit;
    const hasAny = price !== '' || shipping !== '' || stock !== '' || moq !== '';
    if (!hasAny) { alert('Enter at least one value to update.'); return; }

    const updates = {};
    if (price !== '' && !isNaN(price) && parseFloat(price) >= 0) updates.price = parseFloat(price);
    if (shipping !== '' && !isNaN(shipping) && parseFloat(shipping) >= 0) updates.shipping = parseFloat(shipping);
    if (stock !== '' && !isNaN(stock) && parseInt(stock) >= 0) updates.stock = parseInt(stock);
    if (moq !== '' && !isNaN(moq) && parseInt(moq) >= 1) updates.moq = parseInt(moq);

    if (Object.keys(updates).length === 0) { alert('Please enter valid values.'); return; }

    setBulkUpdating(true);
    try {
      const token = localStorage.getItem('sellerToken');
      const res = await fetch(getApiUrl('sellers/bulk-update-inventory'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productIds: [...selectedIds], updates })
      });
      const data = await res.json();
      if (!res.ok) alert('❌ ' + (data.message || 'Bulk update failed'));
    } catch {
      alert('❌ Bulk update failed');
    } finally {
      setBulkUpdating(false);
      setBulkEdit({ price: '', shipping: '', stock: '', moq: '' });
      setSelectedIds(new Set());
      loadProducts();
    }
  };

  const toggleSelectAll = () => {
    const selectableIds = sortedProducts.filter(p => !p.isListingRequest).map(p => p._id);
    if (selectableIds.length > 0 && selectableIds.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleUnlistProduct = async (product) => {
    if (!confirm(`Are you sure you want to unlist "${product.name}"? This will remove your seller information from this product.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('sellerToken');
      
      const response = await fetch(getApiUrl(`sellers/unlist-product/${product._id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Product unlisted successfully!');
        loadProducts(); // Refresh the list
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Unlist product error:', error);
      alert('❌ Failed to unlist product');
    }
  };

  const handleUpdateCountry = async (productId, countries) => {
    setUpdatingCountry(prev => new Set(prev).add(productId));
    try {
      const token = localStorage.getItem('sellerToken');
      const response = await fetch(getApiUrl(`sellers/update-inventory/${productId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ listingCountries: countries })
      });
      const data = await response.json();
      if (response.ok) {
        setProducts(prev => prev.map(p =>
          p._id === productId ? { ...p, sellerListingCountries: countries } : p
        ));
      } else {
        alert('❌ ' + (data.message || 'Failed to update countries'));
      }
    } catch (err) {
      alert('❌ Failed to update countries');
    } finally {
      setUpdatingCountry(prev => { const n = new Set(prev); n.delete(productId); return n; });
    }
  };

  const handleCellClick = (productId, field, currentValue, product) => {
    setEditingCell(`${productId}-${field}`)
    setEditValues({ ...editValues, [`${productId}-${field}`]: currentValue || '' })
    // Init currency edit state from stored priceCurrency
    if (field === 'price' && product) {
      setPriceCurrencyEdit(prev => ({ ...prev, [productId]: product.sellerPriceCurrency || 'GBP' }))
    }
  }

  const handleEditChange = (productId, field, value) => {
    setEditValues({ ...editValues, [`${productId}-${field}`]: value })
  }

  const handleInputEvent = (e, productId, field) => {
    // Handle keyboard up/down arrows and direct input
    const value = e.target.value
    handleEditChange(productId, field, value)
  }

  const handleMouseWheel = (e, productId, field) => {
    // Handle mouse wheel up/down on number inputs
    if (e.deltaY < 0) {
      // Wheel up - increment
      const currentValue = parseFloat(editValues[`${productId}-${field}`] || 0)
      const step = (field === 'price' || field === 'shipping') ? 0.01 : 1
      const newValue = (currentValue + step).toFixed((field === 'price' || field === 'shipping') ? 2 : 0)
      handleEditChange(productId, field, newValue)
    } else if (e.deltaY > 0) {
      // Wheel down - decrement
      const currentValue = parseFloat(editValues[`${productId}-${field}`] || 0)
      const step = (field === 'price' || field === 'shipping') ? 0.01 : 1
      const newValue = Math.max(0, currentValue - step).toFixed((field === 'price' || field === 'shipping') ? 2 : 0)
      handleEditChange(productId, field, newValue)
    }
  }
  const handleSaveEdit = async (productId, field) => {
    const cellKey = `${productId}-${field}`
    const newValue = editValues[cellKey]

    if (!newValue || newValue === '' || isNaN(newValue)) {
      setEditingCell(null)
      return
    }

    const numericValue = (field === 'price' || field === 'shipping') ? parseFloat(newValue) : parseInt(newValue)
    if (numericValue < 0) {
      setEditingCell(null)
      return
    }

    // MOQ must be at least 1
    if (field === 'moq' && numericValue < 1) {
      setEditingCell(null)
      return
    }

    // Add product to updating set
    setUpdatingProducts(prev => new Set(prev).add(productId))
    setEditingCell(null) // Exit edit mode

    try {
      const token = localStorage.getItem('sellerToken')
      const updateData = {}
      updateData[field] = numericValue
      // Include priceCurrency when updating price
      if (field === 'price') {
        updateData.priceCurrency = priceCurrencyEdit[productId] || 'GBP'
      }

      const response = await fetch(getApiUrl(`sellers/update-inventory/${productId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        // Update the local state to reflect the change
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product._id === productId 
              ? { 
                  ...product, 
                  [field]: numericValue,
                  ...(field === 'price' && {
                    sellerCustomPrice: numericValue,
                    sellerPriceCurrency: priceCurrencyEdit[productId] || product.sellerPriceCurrency || 'GBP',
                    sellerInfo: {
                      ...product.sellerInfo,
                      sellerPrice: numericValue
                    }
                  }),
                  ...(field === 'shipping' && {
                    sellerInfo: {
                      ...product.sellerInfo,
                      sellerShipping: numericValue
                    }
                  }),
                  ...(field === 'moq' && { sellerMoq: numericValue })
                }
              : product
          )
        )
      } else {
        const data = await response.json()
        console.error('Update failed:', data.message)
      }
    } catch (error) {
      console.error('Update error:', error)
    } finally {
      // Remove product from updating set
      setUpdatingProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleKeyPress = (e, productId, field) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleSaveEdit(productId, field)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditingCell(null)
    }
  }

  const handleSaveAsin = async () => {
    if (!asinModal) return;
    setAsinSaving(true);
    try {
      const token = localStorage.getItem('sellerToken');
      const response = await fetch(getApiUrl(`sellers/update-inventory/${asinModal.productId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          asinAvailable: asinModal.asinAvailable,
          asinYearlyCost: asinModal.asinYearlyCost,
          asinReviews: asinModal.asinReviews,
          asinYearlyIncome: asinModal.asinYearlyIncome
        })
      });
      if (response.ok) {
        setProducts(prev => prev.map(p =>
          p._id === asinModal.productId
            ? { ...p, sellerAsinData: { asinAvailable: asinModal.asinAvailable, asinYearlyCost: asinModal.asinYearlyCost, asinReviews: asinModal.asinReviews, asinYearlyIncome: asinModal.asinYearlyIncome } }
            : p
        ));
        setAsinModal(null);
      } else {
        const d = await response.json();
        alert('❌ ' + (d.message || 'Failed to save'));
      }
    } catch (e) {
      alert('❌ Failed to save ASIN data');
    } finally {
      setAsinSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning text-dark',
      approved: 'bg-success',
      rejected: 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  };

  const getMarketplaceBadge = (marketplace) => {
    const badges = {
      UK: 'bg-primary',
      UAE: 'bg-info',
      US: 'bg-success',
      Amazon10: 'bg-warning text-dark'
    };
    return badges[marketplace] || 'bg-secondary';
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedProducts = [...products]
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'name': aVal = a.name?.toLowerCase(); bVal = b.name?.toLowerCase(); break;
        case 'price': aVal = parseFloat(a.sellerInfo?.sellerPrice || a.price || 0); bVal = parseFloat(b.sellerInfo?.sellerPrice || b.price || 0); break;
        case 'stock': aVal = a.stock || 0; bVal = b.stock || 0; break;
        case 'status': aVal = a.approvalStatus; bVal = b.approvalStatus; break;
        case 'category': aVal = a.category?.toLowerCase() || ''; bVal = b.category?.toLowerCase() || ''; break;
        case 'createdAt': aVal = new Date(a.createdAt); bVal = new Date(b.createdAt); break;
        default: aVal = new Date(a.createdAt); bVal = new Date(b.createdAt);
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: '4px', opacity: sortField === field ? 1 : 0.3, fontSize: '0.7rem' }}>
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  if (loading || !authResolved) {
    return null;
  }

  return (
    <div className="container-fluid" style={{ fontSize: '0.85rem', padding: '8px', backgroundColor: '#f4f6f9', minHeight: '100vh', color: '#212529' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1">
            <i className="fas fa-boxes text-primary me-2"></i>
            My Listed Products
          </h5>
          <small className="text-muted">
            Manage your product inventory and pricing
          </small>
        </div>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => navigate('/seller/dashboard')}
        >
          <i className="fas fa-arrow-left me-1"></i>Back to Dashboard
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-2 mb-3">
        {[
          { label: 'Total Products', value: counts.total, icon: 'fa-boxes', bg: '#0d6efd', color: '#fff' },
          { label: 'Approved', value: counts.approved, icon: 'fa-check-circle', bg: '#198754', color: '#fff' },
          { label: 'Pending', value: counts.pending, icon: 'fa-clock', bg: '#ffc107', color: '#212529' },
          { label: 'Rejected', value: counts.rejected, icon: 'fa-times-circle', bg: '#dc3545', color: '#fff' },
        ].map(({ label, value, icon, bg, color }) => (
          <div key={label} className="col-6 col-md-3">
            <div style={{ background: bg, borderRadius: '8px', padding: '10px 14px', color }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.9 }}>{label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
                </div>
                <i className={`fas ${icon}`} style={{ fontSize: '1.6rem', opacity: 0.5 }}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
            style={{ 
              color: '#212529',
              fontWeight: activeTab === 'approved' ? 'bold' : '600'
            }}
          >
            Approved ({counts.approved})
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
            style={{ 
              color: '#212529',
              fontWeight: activeTab === 'pending' ? 'bold' : '600'
            }}
          >
            Pending ({counts.pending})
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            style={{ 
              color: '#212529',
              fontWeight: activeTab === 'all' ? 'bold' : '600'
            }}
          >
            All Products ({counts.total})
          </button>
        </li>
        {counts.rejected > 0 && (
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveTab('rejected')}
              style={{ 
                color: '#212529',
                fontWeight: activeTab === 'rejected' ? 'bold' : '600'
              }}
            >
              Rejected ({counts.rejected})
            </button>
          </li>
        )}
      </ul>

      {/* Search & Sort Controls */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        {/* Search */}
        <div className="position-relative" style={{ flex: '1 1 200px', minWidth: '180px' }}>
          <i className="fas fa-search position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '0.8rem', pointerEvents: 'none' }}></i>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '30px', fontSize: '0.82rem', border: '1px solid #dee2e6', backgroundColor: '#fff', color: '#212529' }}
          />
        </div>

        {/* Category filter */}
        <div className="d-flex align-items-center gap-1" style={{ flex: '0 1 180px' }}>
          <select
            className="form-select form-select-sm"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ fontSize: '0.78rem', border: '1px solid #dee2e6', backgroundColor: '#fff', color: '#212529' }}
          >
            <option value="">All Categories</option>
            {[...new Set(products.map(p => p.category).filter(Boolean))].sort().map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory('')} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px', flexShrink: 0 }}>✕</button>
          )}
        </div>

        {/* Sort */}
        <div className="d-flex align-items-center gap-1" style={{ flexShrink: 0 }}>
          <span style={{ fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>Sort:</span>
          <select
            className="form-select form-select-sm"
            value={sortField}
            onChange={e => { setSortField(e.target.value); setSortDir('asc'); }}
            style={{ fontSize: '0.78rem', border: '1px solid #dee2e6', backgroundColor: '#fff', color: '#212529', width: 'auto' }}
          >
            <option value="createdAt">Date</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
            <option value="category">Category</option>
          </select>
          <button
            className="btn btn-sm"
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            style={{ fontSize: '0.78rem', padding: '3px 8px', border: '1px solid #dee2e6', backgroundColor: '#fff', color: '#212529' }}
          >
            {sortDir === 'asc' ? '▲' : '▼'}
          </button>
        </div>

        {/* Active filters info */}
        {(searchTerm || selectedCategory) && (
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {sortedProducts.length} result{sortedProducts.length !== 1 ? 's' : ''}
            <button onClick={() => { setSearchTerm(''); setSelectedCategory(''); }} style={{ marginLeft: '6px', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>✕ Clear all</button>
          </span>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: '#1e293b', color: '#fff',
          borderRadius: '8px', padding: '10px 16px',
          marginBottom: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          {/* Top row: count + clear + unlist */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              <i className="fas fa-check-square me-2" style={{ color: '#60a5fa' }}></i>
              {selectedIds.size} product{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setSelectedIds(new Set()); setBulkEdit({ price: '', shipping: '', stock: '', moq: '' }); }}
                style={{ padding: '5px 12px', fontSize: '0.78rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '5px', cursor: 'pointer' }}
              >
                Clear
              </button>
              <button
                onClick={handleBulkUnlist}
                disabled={bulkDeleting || bulkUpdating}
                style={{ padding: '5px 14px', fontSize: '0.78rem', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '5px', cursor: (bulkDeleting || bulkUpdating) ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: (bulkDeleting || bulkUpdating) ? 0.7 : 1 }}
              >
                {bulkDeleting
                  ? <><i className="fas fa-spinner fa-spin me-1"></i>Unlisting...</>
                  : <><i className="fas fa-trash me-1"></i>Unlist</>}
              </button>
            </div>
          </div>

          {/* Bottom row: bulk edit inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>Bulk update:</span>
            {[
              { key: 'price',    label: 'Price (£)',  placeholder: 'e.g. 1.99', step: '0.01', min: '0' },
              { key: 'shipping', label: 'Shipping',   placeholder: 'e.g. 0.50', step: '0.01', min: '0' },
              { key: 'stock',    label: 'Stock',      placeholder: 'e.g. 100',  step: '1',    min: '0' },
              { key: 'moq',      label: 'MOQ',        placeholder: 'e.g. 5',    step: '1',    min: '1' },
            ].map(({ key, label, placeholder, step, min }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', marginBottom: '1px' }}>{label}</label>
                <input
                  type="number"
                  step={step}
                  min={min}
                  placeholder={placeholder}
                  value={bulkEdit[key]}
                  onChange={e => setBulkEdit(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{
                    width: '90px', padding: '5px 8px', fontSize: '0.8rem',
                    border: bulkEdit[key] !== '' ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '5px', background: 'rgba(255,255,255,0.1)',
                    color: '#fff', outline: 'none'
                  }}
                />
              </div>
            ))}
            <button
              onClick={handleBulkUpdate}
              disabled={bulkUpdating || bulkDeleting}
              style={{
                padding: '6px 16px', fontSize: '0.82rem', fontWeight: 700,
                background: (bulkUpdating || bulkDeleting) ? '#374151' : '#2563eb',
                border: 'none', color: '#fff', borderRadius: '5px',
                cursor: (bulkUpdating || bulkDeleting) ? 'not-allowed' : 'pointer',
                alignSelf: 'flex-end', marginBottom: '1px'
              }}
            >
              {bulkUpdating
                ? <><i className="fas fa-spinner fa-spin me-1"></i>Updating...</>
                : <><i className="fas fa-save me-1"></i>Update All</>}
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      {showRetryButton && (
        <div className="alert alert-warning d-flex justify-content-between align-items-center mb-3">
          <div>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {errorMsg || 'Failed to load products. Please check your connection and try again.'}
          </div>
          <button 
            className="btn btn-warning btn-sm"
            onClick={() => loadProducts()}
            disabled={pageLoading}
          >
            <i className="fas fa-redo me-1"></i>
            {pageLoading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}
      
      <div className="card">
        <div className="card-body">
          {pageLoading ? (
            /* Inline skeleton — page stays visible, table area shows loading */
            <div>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="placeholder-glow d-flex align-items-center gap-2 py-2 border-bottom">
                  <div className="placeholder rounded" style={{ width: '36px', height: '36px', flexShrink: 0 }}></div>
                  <div className="flex-grow-1">
                    <div className="placeholder col-7 mb-1" style={{ height: '12px', borderRadius: '3px' }}></div>
                    <div className="placeholder col-4" style={{ height: '10px', borderRadius: '3px' }}></div>
                  </div>
                  <div className="placeholder col-1" style={{ height: '12px', borderRadius: '3px' }}></div>
                  <div className="placeholder col-1" style={{ height: '12px', borderRadius: '3px' }}></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No products found</h5>
              <p className="text-muted">
                {activeTab === 'all' 
                  ? "You haven't listed any products yet." 
                  : `No ${activeTab} products found.`}
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/seller/dashboard')}
              >
                <i className="fas fa-plus me-1"></i>List Products
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm" style={{ fontSize: '0.78rem' }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '36px', padding: '6px 4px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        title="Select all"
                        checked={sortedProducts.filter(p => !p.isListingRequest).length > 0 && sortedProducts.filter(p => !p.isListingRequest).every(p => selectedIds.has(p._id))}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                      />
                    </th>
                    <th style={{ width: '44px', padding: '6px 4px' }}>Img</th>
                    <th style={{ minWidth: '200px', width: 'auto', cursor: 'pointer', padding: '6px 4px' }} onClick={() => handleSort('name')}>
                      Product Name <SortIcon field="name" />
                    </th>
                    <th style={{ width: '80px', padding: '6px 4px' }}>SKU</th>
                    <th style={{ width: '80px', cursor: 'pointer', padding: '6px 4px' }} onClick={() => handleSort('price')}>
                      Price <SortIcon field="price" />
                    </th>
                    <th style={{ width: '70px', padding: '6px 4px' }}>Ship</th>
                    <th style={{ width: '55px', cursor: 'pointer', padding: '6px 4px' }} onClick={() => handleSort('stock')}>
                      Stock <SortIcon field="stock" />
                    </th>
                    <th style={{ width: '55px', padding: '6px 4px' }}>MOQ</th>
                    <th style={{ width: '110px', padding: '6px 4px' }}>Country</th>
                    <th style={{ width: '80px', cursor: 'pointer', padding: '6px 4px' }} onClick={() => handleSort('category')}>
                      Category <SortIcon field="category" />
                    </th>
                    <th style={{ width: '80px', padding: '6px 4px' }}>ASIN Bulk</th>
                    <th style={{ width: '70px', cursor: 'pointer', padding: '6px 4px' }} onClick={() => handleSort('createdAt')}>
                      Date <SortIcon field="createdAt" />
                    </th>
                    <th style={{ width: '60px', padding: '6px 4px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product) => (
                    <tr key={product._id} style={{ verticalAlign: 'middle', background: selectedIds.has(product._id) ? '#eff6ff' : '' }}>
                      <td style={{ textAlign: 'center', padding: '4px' }}>
                        {!product.isListingRequest && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(product._id)}
                            onChange={() => toggleSelectOne(product._id)}
                            style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                          />
                        )}
                      </td>
                      <td>
                        {!product.isListingRequest ? (
                          <a 
                            href={`/product/${product._id}`}
                            style={{ cursor: 'pointer', display: 'block' }}
                          >
                            <img 
                              src={product.images?.[0] || 'https://via.placeholder.com/50x50?text=No+Image'} 
                              alt={product.name}
                              style={{ 
                                width: '40px', 
                                height: '40px', 
                                objectFit: 'contain', 
                                objectPosition: 'center',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                padding: '2px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e5e7eb',
                                transition: 'transform 0.2s ease'
                              }}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
                              }}
                              onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            />
                          </a>
                        ) : (
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px'
                          }}>
                            <i className="fas fa-clock text-muted" title="Listing request pending"></i>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ minWidth: '200px' }}>
                          {product.isListingRequest ? (
                            <div>
                              <span className="d-block fw-bold" style={{ color: '#0066cc', wordBreak: 'break-word' }} title={product.name}>
                                {product.name}
                              </span>
                              <small className="badge bg-info">Listing Request</small>
                            </div>
                          ) : (
                            <a 
                              href={`/product/${product._id}`}
                              style={{
                                textDecoration: 'none',
                                color: '#0066cc',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                wordBreak: 'break-word',
                                display: 'block'
                              }}
                              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                              title={product.name}
                            >
                              {product.name}
                            </a>
                          )}
                          {product.asin && (
                            <></>
                          )}
                        </div>
                      </td>
                      {/* SKU Column */}
                      <td style={{ padding: '4px 3px', verticalAlign: 'middle' }}>
                        {product.sku ? (
                          <span style={{
                            display: 'inline-block',
                            background: '#f0f4ff',
                            border: '1px solid #c7d2fe',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#3730a3',
                            fontFamily: 'monospace'
                          }}>
                            {product.sku}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                      <td
                        style={{ 
                          cursor: product.isListingRequest ? 'default' : 'pointer', 
                          transition: 'background 0.2s',
                          padding: '4px 3px'
          }}
                        onClick={() => !product.isListingRequest && handleCellClick(product._id, 'price', product.sellerCustomPrice ?? product.sellerInfo?.sellerPrice ?? product.price, product)}
                        onMouseEnter={(e) => !product.isListingRequest && (e.target.style.background = '#f0f0ff')}
                        onMouseLeave={(e) => e.target.style.background = ''}
                        title={product.isListingRequest ? "Cannot edit price for listing requests" : "Click to edit price"}
                      >
                        {editingCell === `${product._id}-price` && !product.isListingRequest ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {/* Currency selector */}
                            <select
                              value={priceCurrencyEdit[product._id] || product.sellerPriceCurrency || 'GBP'}
                              onChange={e => setPriceCurrencyEdit(prev => ({ ...prev, [product._id]: e.target.value }))}
                              onClick={e => e.stopPropagation()}
                              style={{ width: '80px', padding: '2px 4px', fontSize: '0.75rem', border: '1.5px solid #667eea', borderRadius: '4px' }}
                            >
                              <option value="GBP">£ GBP</option>
                              <option value="PKR">Rs PKR</option>
                              <option value="AED">AED</option>
                              <option value="USD">$ USD</option>
                            </select>
                            <input
                              type="number"
                              step="0.01"
                              value={editValues[`${product._id}-price`] || ''}
                              onChange={(e) => handleEditChange(product._id, 'price', e.target.value)}
                              onInput={(e) => handleInputEvent(e, product._id, 'price')}
                              onWheel={(e) => handleMouseWheel(e, product._id, 'price')}
                              onBlur={() => handleSaveEdit(product._id, 'price')}
                              onKeyDown={(e) => handleKeyPress(e, product._id, 'price')}
                              autoFocus
                              disabled={updatingProducts.has(product._id)}
                              style={{
                                width: '80px',
                                padding: '4px',
                                fontSize: '0.85rem',
                                border: '2px solid #667eea',
                                borderRadius: '4px',
                                outline: 'none'
                              }}
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="fw-bold text-success">
                              {(() => {
                                const cur = product.sellerPriceCurrency || 'GBP';
                                const sym = { GBP: '£', PKR: 'Rs ', AED: 'د.إ ', USD: '$' };
                                const price = product.sellerCustomPrice ?? product.sellerInfo?.sellerPrice ?? product.price;
                                return `${sym[cur] || ''}${parseFloat(price || 0).toFixed(2)} ${cur}`;
                              })()}
                              {!product.isListingRequest && (
                                <span style={{ marginLeft: '4px', fontSize: '0.6rem', color: '#999' }}>✏️</span>
                              )}
                            </span>
                          </div>
                        )}
                      </td>
                      <td
                        style={{ cursor: product.isListingRequest ? 'default' : 'pointer', transition: 'background 0.2s', padding: '4px 3px' }}
                        onClick={() => {
                          if (product.isListingRequest) return;
                          // Init dim edit state from seller entry
                          const se = product.sellers?.find(s => s.sellerId?.toString() === seller?._id?.toString());
                          setDimEdit(prev => ({
                            ...prev,
                            [product._id]: {
                              l: se?.dimensions?.length || '',
                              w: se?.dimensions?.width  || '',
                              h: se?.dimensions?.height || '',
                              wt: se?.weight || ''
                            }
                          }));
                          handleCellClick(product._id, 'shipping', product.sellerInfo?.sellerShipping || product.shipping || 0);
                        }}
                        onMouseEnter={e => !product.isListingRequest && (e.target.style.background = '#f0f0ff')}
                        onMouseLeave={e => (e.target.style.background = '')}
                        title={product.isListingRequest ? 'Cannot edit shipping for listing requests' : 'Click to edit shipping via dimensions'}
                      >
                        {editingCell === `${product._id}-shipping` && !product.isListingRequest ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '120px' }}
                            onClick={e => e.stopPropagation()}>
                            {/* Dimension inputs L W H */}
                            {['l','w','h'].map((dim, i) => (
                              <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6b7280', width: '10px' }}>{dim.toUpperCase()}</span>
                                <input type="number" min="0.01" step="0.01" placeholder="0"
                                  value={dimEdit[product._id]?.[dim] || ''}
                                  onChange={e => setDimEdit(prev => ({ ...prev, [product._id]: { ...prev[product._id], [dim]: e.target.value } }))}
                                  style={{ width: '60px', padding: '3px 5px', fontSize: '0.75rem', border: '1.5px solid #667eea', borderRadius: '4px', outline: 'none' }} />
                                <span style={{ fontSize: '0.6rem', color: '#aaa' }}>cm</span>
                              </div>
                            ))}
                            {/* Weight input */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#fd7e14', width: '10px' }}>W</span>
                              <input type="number" min="0" step="1" placeholder="g (opt)"
                                value={dimEdit[product._id]?.wt || ''}
                                onChange={e => setDimEdit(prev => ({ ...prev, [product._id]: { ...prev[product._id], wt: e.target.value } }))}
                                style={{ width: '60px', padding: '3px 5px', fontSize: '0.75rem', border: '1.5px solid #fd7e14', borderRadius: '4px', outline: 'none' }} />
                              <span style={{ fontSize: '0.6rem', color: '#aaa' }}>g</span>
                            </div>
                            {/* Computed shipping preview */}
                            {(() => {
                              const d = dimEdit[product._id] || {};
                              const l = parseFloat(d.l)||0, w = parseFloat(d.w)||0, h = parseFloat(d.h)||0, wt = parseFloat(d.wt)||0;
                              const currency = product.sellerPriceCurrency || 'GBP';
                              const sym = CURRENCY_SYMBOLS[currency] || '£';
                              if (l>0 && w>0 && h>0) {
                                const pkr = calcShipping(l, w, h, wt);
                                const display = currency === 'PKR' ? pkr : shippingInCurrency(pkr, currency);
                                return <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#28a745' }}>= {sym}{display.toFixed(2)}</div>;
                              }
                              return null;
                            })()}
                            {/* Save/Cancel */}
                            <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                              <button
                                onClick={async () => {
                                  const d = dimEdit[product._id] || {};
                                  const l = parseFloat(d.l)||0, w = parseFloat(d.w)||0, h = parseFloat(d.h)||0, wt = parseFloat(d.wt)||0;
                                  if (l<=0 || w<=0 || h<=0) { alert('Enter all 3 dimensions'); return; }
                                  // Always store in PKR; display layer converts
                                  const computed = calcShipping(l, w, h, wt);
                                  setUpdatingProducts(prev => new Set(prev).add(product._id));
                                  setEditingCell(null);
                                  try {
                                    const token = localStorage.getItem('sellerToken');
                                    await fetch(getApiUrl(`sellers/update-inventory/${product._id}`), {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                      body: JSON.stringify({ shipping: computed, dimensions: { length: l, width: w, height: h }, weight: wt })
                                    });
                                    setProducts(prev => prev.map(p => p._id === product._id
                                      ? { ...p, sellerInfo: { ...p.sellerInfo, sellerShipping: computed } }
                                      : p));
                                  } catch {}
                                  finally { setUpdatingProducts(prev => { const n=new Set(prev); n.delete(product._id); return n; }); }
                                }}
                                style={{ flex:1, padding: '3px 6px', fontSize: '0.7rem', fontWeight: '700', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                ✓ Save
                              </button>
                              <button onClick={() => setEditingCell(null)}
                                style={{ flex:1, padding: '3px 6px', fontSize: '0.7rem', background: '#f8f9fa', color: '#666', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="fw-bold text-info">
                              {(() => {
                                const pkr = product.sellerInfo?.sellerShipping || product.shipping || 0;
                                const currency = product.sellerPriceCurrency || 'GBP';
                                const sym = CURRENCY_SYMBOLS[currency] || '£';
                                const display = currency === 'PKR' ? pkr : shippingInCurrency(pkr, currency);
                                return `${sym}${display.toFixed(2)}`;
                              })()}
                              {!product.isListingRequest && <span style={{ marginLeft: '4px', fontSize: '0.6rem', color: '#999' }}>✏️</span>}
                            </span>
                            {(() => {
                              const se = product.sellers?.find(s => s.sellerId?.toString() === seller?._id?.toString());
                              const d = se?.dimensions;
                              if (d && (d.length||d.width||d.height)) {
                                return <div style={{ fontSize: '0.6rem', color: '#aaa' }}>{d.length}×{d.width}×{d.height}{se.weight?` ${se.weight}kg`:''}</div>;
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </td>
                      <td
                        style={{ 
                          cursor: product.isListingRequest ? 'default' : 'pointer', 
                          transition: 'background 0.2s',
                          padding: '4px 3px'
          }}
                        onClick={() => !product.isListingRequest && handleCellClick(product._id, 'stock', product.stock)}
                        onMouseEnter={(e) => !product.isListingRequest && (e.target.style.background = '#f0f0ff')}
                        onMouseLeave={(e) => e.target.style.background = ''}
                        title={product.isListingRequest ? "Stock not available for listing requests" : "Click to edit stock"}
                      >
                        {editingCell === `${product._id}-stock` && !product.isListingRequest ? (
                          <input
                            type="number"
                            value={editValues[`${product._id}-stock`] || ''}
                            onChange={(e) => handleEditChange(product._id, 'stock', e.target.value)}
                            onInput={(e) => handleInputEvent(e, product._id, 'stock')}
                            onWheel={(e) => handleMouseWheel(e, product._id, 'stock')}
                            onBlur={() => handleSaveEdit(product._id, 'stock')}
                            onKeyDown={(e) => handleKeyPress(e, product._id, 'stock')}
                            autoFocus
                            disabled={updatingProducts.has(product._id)}
                            style={{
                              width: '70px',
                              padding: '4px',
                              fontSize: '0.85rem',
                              border: '2px solid #667eea',
                              borderRadius: '4px',
                              outline: 'none'
                            }}
                          />
                        ) : (
                          <span className={`badge ${
                            product.isListingRequest ? 'bg-secondary' : 
                            product.stock > 0 ? 'bg-success' : 'bg-danger'
                          }`}>
                            {product.isListingRequest ? 'Pending' : product.stock}
                            {!product.isListingRequest && (
                              <span style={{ marginLeft: '4px', fontSize: '0.6rem', color: '#999' }}>✏️</span>
                            )}
                          </span>
                        )}
                      </td>
                      {/* MOQ Column - editable like Price */}
                      <td
                        style={{
                          cursor: product.isListingRequest ? 'default' : 'pointer',
                          transition: 'background 0.2s',
                          padding: '4px 3px', verticalAlign: 'middle'
                        }}
                        onClick={() => !product.isListingRequest && handleCellClick(product._id, 'moq', product.sellerMoq || 1)}
                        onMouseEnter={(e) => !product.isListingRequest && (e.currentTarget.style.background = '#fffbeb')}
                        onMouseLeave={(e) => e.currentTarget.style.background = ''}
                        title={product.isListingRequest ? 'MOQ not editable for pending requests' : 'Click to edit MOQ'}
                      >
                        {editingCell === `${product._id}-moq` && !product.isListingRequest ? (
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={editValues[`${product._id}-moq`] || ''}
                            onChange={(e) => handleEditChange(product._id, 'moq', e.target.value)}
                            onInput={(e) => handleInputEvent(e, product._id, 'moq')}
                            onWheel={(e) => handleMouseWheel(e, product._id, 'moq')}
                            onBlur={() => handleSaveEdit(product._id, 'moq')}
                            onKeyDown={(e) => handleKeyPress(e, product._id, 'moq')}
                            autoFocus
                            disabled={updatingProducts.has(product._id)}
                            style={{
                              width: '70px',
                              padding: '4px',
                              fontSize: '0.85rem',
                              border: '2px solid #ffc107',
                              borderRadius: '4px',
                              outline: 'none'
                            }}
                          />
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: '#fff3cd',
                            border: '1px solid #ffc107',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: '#856404',
                            whiteSpace: 'nowrap'
                          }}>
                            <i className="fas fa-boxes" style={{ fontSize: '0.65rem' }}></i>
                            {product.sellerMoq || 1}
                            {!product.isListingRequest && (
                              <span style={{ fontSize: '0.6rem', color: '#999' }}>✏️</span>
                            )}
                          </span>
                        )}
                      </td>
                      {/* Country Column - multi-select inline toggles */}
                      <td style={{ verticalAlign: 'middle', minWidth: '160px' }}>
                        {!product.isListingRequest ? (
                          <div>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '3px' }}>
                              {COUNTRY_OPTIONS.map(c => {
                                const selected = (product.sellerListingCountries || []).includes(c.code)
                                return (
                                  <button
                                    key={c.code}
                                    type="button"
                                    disabled={updatingCountry.has(product._id)}
                                    onClick={() => {
                                      const current = product.sellerListingCountries || []
                                      const next = selected
                                        ? current.filter(x => x !== c.code)
                                        : [...current, c.code]
                                      handleUpdateCountry(product._id, next)
                                    }}
                                    title={c.label}
                                    style={{
                                      fontSize: '14px', padding: '2px 5px',
                                      borderRadius: '5px', cursor: 'pointer',
                                      border: selected ? '2px solid #ff6600' : '2px solid #dee2e6',
                                      background: selected ? '#fff5f0' : '#f8f9fa',
                                      opacity: updatingCountry.has(product._id) ? 0.5 : 1,
                                      transition: 'all 0.15s', lineHeight: 1
                                    }}
                                  >
                                    {countryFlag(c.code)}
                                  </button>
                                )
                              })}
                            </div>
                            <div style={{ fontSize: '9px', color: '#888' }}>
                              {updatingCountry.has(product._id)
                                ? <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                                : (product.sellerListingCountries || []).length === 0
                                  ? <span style={{ color: '#28a745' }}>All countries</span>
                                  : (product.sellerListingCountries || []).map(c => (
                                      <span key={c} style={{ marginRight: '3px' }}>{countryFlag(c)} {c}</span>
                                    ))
                              }
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#aaa' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-info">{product.category}</span>
                      </td>
                      <td style={{ padding: '4px 3px' }}>
                        {!product.isListingRequest ? (
                          <button
                            onClick={() => setAsinModal({
                              productId: product._id,
                              asinAvailable: product.sellerAsinData?.asinAvailable || false,
                              asinYearlyCost: product.sellerAsinData?.asinYearlyCost || '',
                              asinReviews: product.sellerAsinData?.asinReviews || '',
                              asinYearlyIncome: product.sellerAsinData?.asinYearlyIncome || ''
                            })}
                            style={{
                              fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                              border: product.sellerAsinData?.asinAvailable ? '1px solid #28a745' : '1px solid #dee2e6',
                              background: product.sellerAsinData?.asinAvailable ? '#d4edda' : '#f8f9fa',
                              color: product.sellerAsinData?.asinAvailable ? '#155724' : '#6c757d',
                              cursor: 'pointer', whiteSpace: 'nowrap'
                            }}
                          >
                            {product.sellerAsinData?.asinAvailable ? '✓ Set' : '+ Set'}
                          </button>
                        ) : <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>—</span>}
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {!product.isListingRequest ? (
                            <>
                              <a
                                href={`/product/${product._id}`}
                                className="btn btn-info btn-sm"
                                title="View Product"
                                style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none',
                                  color: 'white'
                                }}
                              >
                                <i className="fas fa-eye"></i>
                              </a>
                              <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleUnlistProduct(product)}
                                title="Remove your listing from this product"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </>
                          ) : (
                            <div className="d-flex gap-1">
                              <span className="badge bg-info" title="This is a listing request pending admin approval">
                                <i className="fas fa-clock me-1"></i>
                                {product.approvalStatus === 'pending' ? 'Pending Review' : 
                                 product.approvalStatus === 'rejected' ? 'Rejected' : 'Request'}
                              </span>
                              {product.rejectionReason && (
                                <span 
                                  className="badge bg-danger" 
                                  title={`Rejection reason: ${product.rejectionReason}`}
                                  style={{ cursor: 'help' }}
                                >
                                  <i className="fas fa-info-circle"></i>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!pageLoading && products.length > 0 && totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-3 flex-wrap">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn btn-sm btn-outline-primary"
            style={{
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            ← Prev
          </button>

          {/* Page Numbers */}
          {(() => {
            const pages = [];
            const maxVisible = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
            
            if (endPage - startPage < maxVisible - 1) {
              startPage = Math.max(1, endPage - maxVisible + 1);
            }

            // First page + ellipsis
            if (startPage > 1) {
              pages.push(
                <button
                  key={1}
                  onClick={() => setCurrentPage(1)}
                  className="btn btn-sm btn-outline-primary"
                >
                  1
                </button>
              );
              if (startPage > 2) {
                pages.push(<span key="ellipsis1" className="px-2">...</span>);
              }
            }

            // Page numbers
            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`btn btn-sm ${currentPage === i ? 'btn-primary' : 'btn-outline-primary'}`}
                  style={{
                    fontWeight: currentPage === i ? 'bold' : 'normal'
                  }}
                >
                  {i}
                </button>
              );
            }

            // Ellipsis + last page
            if (endPage < totalPages) {
              if (endPage < totalPages - 1) {
                pages.push(<span key="ellipsis2" className="px-2">...</span>);
              }
              pages.push(
                <button
                  key={totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="btn btn-sm btn-outline-primary"
                >
                  {totalPages}
                </button>
              );
            }

            return pages;
          })()}

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-sm btn-outline-primary"
            style={{
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* ASIN Bulk Listing Modal */}
      {asinModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setAsinModal(null)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                  <i className="fas fa-barcode me-2" style={{ color: '#ff6b35' }}></i>ASIN Bulk Listing
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem' }}>Set ASIN availability & financial data for buyers</div>
              </div>
              <button onClick={() => setAsinModal(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
            </div>
            <div style={{ padding: '16px 18px' }}>
              {/* ASIN Available toggle */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  <i className="fas fa-check-circle me-1" style={{ color: '#28a745' }}></i>ASIN Available for Buyers?
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[true, false].map(val => (
                    <button key={String(val)} type="button"
                      onClick={() => setAsinModal(m => ({ ...m, asinAvailable: val }))}
                      style={{ flex: 1, padding: '8px', borderRadius: '7px', border: `2px solid ${asinModal.asinAvailable === val ? '#28a745' : '#dee2e6'}`, background: asinModal.asinAvailable === val ? '#d4edda' : '#f8f9fa', color: asinModal.asinAvailable === val ? '#155724' : '#6c757d', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                      {val ? '✓ Yes, Available' : '✗ Not Available'}
                    </button>
                  ))}
                </div>
              </div>

              {asinModal.asinAvailable && (
                <>
                  {/* Yearly Cost */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      <i className="fas fa-pound-sign me-1" style={{ color: '#dc3545' }}></i>Yearly Cost of ASIN (£)
                    </label>
                    <input type="number" min="0" step="0.01" placeholder="e.g. 299.99"
                      value={asinModal.asinYearlyCost}
                      onChange={e => setAsinModal(m => ({ ...m, asinYearlyCost: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e9ecef', borderRadius: '7px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#667eea'} onBlur={e => e.target.style.borderColor = '#e9ecef'} />
                  </div>

                  {/* ASIN Reviews removed */}

                  {/* Yearly Income */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      <i className="fas fa-chart-line me-1" style={{ color: '#28a745' }}></i>Estimated Yearly Income (£)
                    </label>
                    <input type="number" min="0" step="0.01" placeholder="e.g. 4800"
                      value={asinModal.asinYearlyIncome}
                      onChange={e => setAsinModal(m => ({ ...m, asinYearlyIncome: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e9ecef', borderRadius: '7px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#667eea'} onBlur={e => e.target.style.borderColor = '#e9ecef'} />
                  </div>
                </>
              )}

              {/* Summary preview */}
              {asinModal.asinAvailable && (asinModal.asinYearlyCost || asinModal.asinYearlyIncome) && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '0.75rem', color: '#0c4a6e' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>📋 Preview for buyers:</div>
                  {asinModal.asinYearlyCost && <div>💰 Yearly cost: <strong>£{parseFloat(asinModal.asinYearlyCost || 0).toFixed(2)}</strong></div>}
                  {asinModal.asinYearlyIncome && <div>📈 Est. yearly income: <strong>£{parseFloat(asinModal.asinYearlyIncome || 0).toFixed(2)}</strong></div>}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setAsinModal(null)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '2px solid #e9ecef', background: '#f8f9fa', color: '#6c757d', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSaveAsin} disabled={asinSaving}
                  style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', background: asinSaving ? '#adb5bd' : 'linear-gradient(135deg, #28a745, #20c997)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: asinSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {asinSaving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save ASIN Data</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListedProducts;

