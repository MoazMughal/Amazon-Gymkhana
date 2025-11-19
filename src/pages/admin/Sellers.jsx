import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/AdminSellers.css';

const AdminSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSellers();
  }, [filter]);

  const fetchSellers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ status: filter });
      
      const response = await fetch(`http://localhost:5000/api/sellers?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch sellers');
      
      const data = await response.json();
      setSellers(data.sellers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this seller?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/sellers/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Seller approved successfully');
        fetchSellers();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Are you sure you want to reject this seller?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/sellers/${id}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Seller rejected');
        fetchSellers();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('⚠️ Are you sure you want to permanently delete this seller? This action cannot be undone!')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/sellers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('✅ Seller deleted successfully');
        fetchSellers();
      } else {
        const data = await response.json();
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Failed to delete seller');
    }
  };

  return (
    <div className="admin-sellers">
      <header className="page-header">
        <h1>Manage Sellers</h1>
        <button onClick={() => navigate('/admin/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </header>

      <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '0.9rem'}}>
        <h3 style={{marginBottom: '10px', fontSize: '1rem'}}>📋 Seller Status Guide:</h3>
        <ul style={{margin: 0, paddingLeft: '20px'}}>
          <li><strong>📝 Pending Verification:</strong> Sellers who registered and can login but haven't completed ID card verification</li>
          <li><strong>✅ Verified & Approved:</strong> Sellers with completed and approved ID card verification (fully verified)</li>
          <li><strong>❌ Rejected:</strong> Sellers who were rejected or deleted by admin</li>
          <li><strong>👥 All Sellers:</strong> Complete list of all registered sellers</li>
        </ul>
      </div>

      <div className="filters-section">
        <button
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
          title="Sellers who registered and can login but haven't completed ID verification"
        >
          📝 Pending Verification ({sellers.length})
        </button>
        <button
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
          title="Sellers with completed and approved ID card verification"
        >
          ✅ Verified & Approved ({sellers.length})
        </button>
        <button
          className={filter === 'rejected' ? 'active' : ''}
          onClick={() => setFilter('rejected')}
          title="Sellers who were rejected or deleted by admin"
        >
          ❌ Rejected ({sellers.length})
        </button>
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
          title="All registered sellers"
        >
          👥 All Sellers ({sellers.length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="sellers-table">
          <table>
            <thead>
              <tr>
                <th>Supplier ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>WhatsApp/Contact</th>
                <th>Location</th>
                <th>Category</th>
                <th>Verification Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map(seller => (
                <tr key={seller._id}>
                  <td>{seller.supplierId}</td>
                  <td>{seller.username}</td>
                  <td>{seller.email}</td>
                  <td>{seller.whatsappNo || seller.contactNo || 'N/A'}</td>
                  <td>{seller.city}, {seller.country}</td>
                  <td>{seller.productCategory}</td>
                  <td>
                    <span className={`status-badge ${seller.verificationStatus || 'required'}`}>
                      {(seller.verificationStatus || 'required').toUpperCase().replace('_', ' ')}
                    </span>
                  </td>
                  <td>{new Date(seller.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                      {/* Show verification review button for sellers with pending verification */}
                      {seller.verificationStatus === 'pending' && (
                        <button
                          onClick={() => navigate('/admin/seller-verifications')}
                          className="verify-btn"
                          style={{backgroundColor: '#ffc107', color: '#000', padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '0.8rem'}}
                          title="Review ID card verification documents"
                        >
                          🆔 Review Verification
                        </button>
                      )}
                      
                      {/* Show approve/reject for sellers who haven't submitted verification yet */}
                      {(seller.verificationStatus === 'required' || seller.verificationStatus === 'not_required') && (
                        <>
                          <button
                            onClick={() => handleApprove(seller._id)}
                            className="approve-btn"
                            style={{backgroundColor: '#28a745', color: 'white', padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '0.8rem'}}
                            title="Approve seller without verification"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleReject(seller._id)}
                            className="reject-btn"
                            style={{backgroundColor: '#dc3545', color: 'white', padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '0.8rem'}}
                            title="Reject seller"
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                      
                      {/* Always show delete button */}
                      <button
                        onClick={() => handleDelete(seller._id)}
                        className="delete-btn"
                        style={{backgroundColor: '#dc3545', color: 'white', padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '0.8rem'}}
                        title="Delete Seller Permanently"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSellers;
