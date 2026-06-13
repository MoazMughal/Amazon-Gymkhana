import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';

const SubCategoryManager = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const [categories, setCategories] = useState([]);
  const [hierarchy, setHierarchy] = useState({}); // { parent: [children] }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [editChildren, setEditChildren] = useState([]);
  const [childInput, setChildInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [catRes, hierRes] = await Promise.all([
        fetch(getApiUrl('products/public/categories?includeCounts=true&includeEmpty=true&deduplicate=true')),
        fetch(getApiUrl('products/public/category-hierarchy'))
      ]);
      const catData = await catRes.json();
      const hierData = await hierRes.json();
      const cats = (catData.categories || []).filter(c => c.value !== 'all');
      setCategories(cats);
      const map = {};
      (hierData.hierarchy || []).forEach(h => { map[h.parent] = h.children || []; });
      setHierarchy(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const startEdit = (parent) => {
    setEditingParent(parent);
    setEditChildren([...(hierarchy[parent] || [])]);
    setChildInput('');
    setError('');
  };

  const addChild = () => {
    const val = childInput.trim();
    if (!val) return;
    if (editChildren.map(c => c.toLowerCase()).includes(val.toLowerCase())) {
      setError(`"${val}" already exists under this category.`);
      return;
    }
    setEditChildren(prev => [...prev, val]);
    setChildInput('');
    setError('');
  };

  const removeChild = (idx) => setEditChildren(prev => prev.filter((_, i) => i !== idx));

  const saveHierarchy = async () => {
    if (!editingParent) return;
    setSaving(true);
    try {
      const res = await fetch(getApiUrl(`products/admin/category-hierarchy/${encodeURIComponent(editingParent)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ children: editChildren })
      });
      if (res.ok) {
        setHierarchy(prev => ({ ...prev, [editingParent]: editChildren }));
        setEditingParent(null);
        window.dispatchEvent(new CustomEvent('refreshCategories'));
      } else { alert('Failed to save'); }
    } catch { alert('Error saving'); }
    finally { setSaving(false); }
  };

  const deleteHierarchy = async (parent) => {
    if (!confirm(`Remove all subcategories from "${parent}"?`)) return;
    await fetch(getApiUrl(`products/admin/category-hierarchy/${encodeURIComponent(parent)}`), {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    setHierarchy(prev => { const n = { ...prev }; delete n[parent]; return n; });
    window.dispatchEvent(new CustomEvent('refreshCategories'));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#1f2937' }}>🗂️ Sub Category Manager</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
            Assign subcategories to main categories. These appear in the header dropdown and product forms.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchAll} style={{ padding: '8px 14px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
            🔄 Refresh
          </button>
          <button onClick={() => navigate('/admin/category-manager')} style={{ padding: '8px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
            ← Category Manager
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categories.map(cat => {
            const subs = hierarchy[cat.label] || [];
            const isEditing = editingParent === cat.label;
            return (
              <div key={cat.value} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f9fafb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1f2937' }}>{cat.label}</span>
                    <span style={{ fontSize: '11px', color: '#6b7280', background: '#e5e7eb', padding: '2px 8px', borderRadius: '10px' }}>
                      {subs.length} subcategories
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!isEditing && (
                      <button onClick={() => startEdit(cat.label)} style={{ padding: '5px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                        ✏️ Edit
                      </button>
                    )}
                    {subs.length > 0 && !isEditing && (
                      <button onClick={() => deleteHierarchy(cat.label)} style={{ padding: '5px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                        🗑️ Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategory chips (view mode) */}
                {!isEditing && subs.length > 0 && (
                  <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {subs.map(sub => (
                      <span key={sub} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '500' }}>
                        {sub}
                      </span>
                    ))}
                  </div>
                )}

                {/* Edit mode */}
                {isEditing && (
                  <div style={{ padding: '14px 16px' }}>
                    {/* Current children */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', minHeight: '32px' }}>
                      {editChildren.map((sub, idx) => (
                        <span key={idx} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {sub}
                          <button onClick={() => removeChild(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: '700', fontSize: '13px', lineHeight: 1, padding: 0 }}>×</button>
                        </span>
                      ))}
                      {editChildren.length === 0 && <span style={{ color: '#9ca3af', fontSize: '12px' }}>No subcategories yet</span>}
                    </div>

                    {/* Add input */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={childInput}
                        onChange={e => { setChildInput(e.target.value); setError(''); }}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addChild())}
                        placeholder="Add subcategory name..."
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                      />
                      <button onClick={addChild} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                        + Add
                      </button>
                    </div>
                    {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 8px' }}>{error}</p>}

                    {/* Save / Cancel */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={saveHierarchy} disabled={saving} style={{ padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                        {saving ? 'Saving...' : '💾 Save'}
                      </button>
                      <button onClick={() => setEditingParent(null)} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubCategoryManager;
