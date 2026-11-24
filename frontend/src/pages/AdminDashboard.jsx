import { useEffect, useState } from 'react';
import { productsApi } from '../api/endpoints';
import BottomSheet from '../components/BottomSheet';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from '../context/NetworkStatusContext';
import { formatCurrency } from '../utils/formatters';

const EMPTY_FORM = {
  brand: 'ASUS',
  name: '',
  category: 'components',
  price: '',
  stock: '10',
  description: '',
  imageUrl: ''
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const controller = new AbortController();
    productsApi
      .list({ limit: 100 }, controller.signal)
      .then(({ data }) => setProducts(Array.isArray(data) ? data : data?.items || []))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setForm({
      brand: product.brand || '',
      name: product.name || '',
      category: product.category || 'components',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? 0),
      description: product.description || '',
      imageUrl: product.imageUrl || ''
    });
    setSheetOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setFeedback(null);
    try {
      const { data } = await productsApi.uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
      setFeedback({ type: 'success', text: 'Photo uploaded to Supabase Storage.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (editingId) {
        const { data } = await productsApi.update(editingId, form);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? data : p)));
        setFeedback({ type: 'success', text: 'Product updated.' });
      } else {
        const { data } = await productsApi.create(form);
        setProducts((prev) => [data, ...prev]);
        setFeedback({ type: 'success', text: 'New product added.' });
      }
      setSheetOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.brand} ${product.name}?`)) return;
    try {
      await productsApi.remove(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setFeedback({ type: 'success', text: 'Product deleted.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  return (
    <section aria-labelledby="admin-heading">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h1 id="admin-heading" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
          Product Manager
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isOnline}
            onClick={openCreateModal}
          >
            + Add
          </button>
          <button type="button" className="btn btn-outline" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card" style={{ fontSize: '0.875rem' }}>
        Signed in as <strong>{user?.email}</strong> ({user?.role})
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      {loading ? (
        <p>Loading inventory...</p>
      ) : (
        products.map((item) => (
          <article key={item.id} className="card">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <img
                src={item.imageUrl || '/icons/icon-192x192.png'}
                alt={`${item.brand} ${item.name}`}
                style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', background: '#eef2f7' }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/icons/icon-192x192.png';
                }}
              />
              <div style={{ flex: 1 }}>
                <span className="badge badge-accent">{item.brand}</span>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>{item.name}</div>
                <div style={{ fontSize: '0.875rem', color: '#1d4ed8', fontWeight: 800 }}>
                  {formatCurrency(item.price)} • Stock: {item.stock}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                disabled={!isOnline}
                onClick={() => openEditModal(item)}
              >
                Edit / Photo
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={!isOnline}
                onClick={() => handleDeleteProduct(item)}
                aria-label={`Delete ${item.brand} ${item.name}`}
              >
                Delete
              </button>
            </div>
          </article>
        ))
      )}

      <BottomSheet
        open={sheetOpen}
        title={editingId ? 'Edit Hardware Product' : 'Add Hardware Product'}
        onClose={() => setSheetOpen(false)}
      >
        <form onSubmit={handleSaveProduct}>
          <div className="form-group">
            <label htmlFor="prod-photo" className="form-label">
              Upload Real Product Photo (JPG/PNG/WebP)
            </label>
            <input
              id="prod-photo"
              type="file"
              accept="image/*"
              className="form-input"
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
            />
            {uploadingPhoto && <span style={{ fontSize: '0.8125rem', color: '#1d4ed8' }}>Uploading photo...</span>}
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Preview"
                style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '10px', marginTop: '6px' }}
              />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="prod-img" className="form-label">Or Image URL</label>
            <input
              id="prod-img"
              type="text"
              className="form-input"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="prod-brand" className="form-label">Brand</label>
            <input
              id="prod-brand"
              className="form-input"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prod-name" className="form-label">Model / Product Name</label>
            <input
              id="prod-name"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prod-cat" className="form-label">Category</label>
            <select
              id="prod-cat"
              className="form-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="components">PC Parts & Components</option>
              <option value="laptops">Laptops</option>
              <option value="monitors">Monitors</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="prod-price" className="form-label">Price (PHP)</label>
            <input
              id="prod-price"
              type="number"
              className="form-input"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prod-stock" className="form-label">Stock Quantity</label>
            <input
              id="prod-stock"
              type="number"
              className="form-input"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prod-desc" className="form-label">Specifications / Description</label>
            <textarea
              id="prod-desc"
              rows={2}
              className="form-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={saving || uploadingPhoto}>
            {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      </BottomSheet>
    </section>
  );
}