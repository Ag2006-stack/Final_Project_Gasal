import { useState } from 'react';
import { Link } from 'react-router-dom';
import { aiApi } from '../api/endpoints';
import { IconSparkles } from '../components/Icons';
import ProductCard from '../components/ProductCard';
import { useNetworkStatus } from '../context/NetworkStatusContext';

const MAX_PROMPT_CHARS = 250;

export default function AIAssistant() {
  const { isOnline } = useNetworkStatus();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorState, setErrorState] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || !isOnline) return;

    setLoading(true);
    setErrorState(null);

    try {
      const { data } = await aiApi.discover(cleanPrompt);
      setResult(data);
    } catch (err) {
      if (err.status === 503 || err.code === 'AI_UNAVAILABLE') {
        setErrorState({
          unavailable: true,
          message: 'Spec AI is temporarily unavailable. Use standard catalog search below.'
        });
      } else {
        setErrorState({
          unavailable: false,
          message: err.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="ai-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h1 id="ai-heading" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
          Spec AI Discovery
        </h1>
        <span className="badge badge-accent">AI-Assisted</span>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: '#475569' }}>
        Describe your target resolution, budget, or hardware needs. Prices and stock counts are verified directly from CoreSpec inventory.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label htmlFor="ai-prompt" className="form-label">
            Hardware Request ({prompt.length}/{MAX_PROMPT_CHARS})
          </label>
          <textarea
            id="ai-prompt"
            className="form-input"
            rows={3}
            maxLength={MAX_PROMPT_CHARS}
            placeholder="e.g., 1440p gaming monitor under ₱15,000 or Ryzen CPU and B550 motherboard"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={!isOnline || loading}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-accent btn-block"
          disabled={!isOnline || loading || !prompt.trim()}
        >
          <IconSparkles size={16} />
          <span>{!isOnline ? 'Offline — Spec AI Disabled' : loading ? 'Analyzing Specs...' : 'Find Matching Hardware'}</span>
        </button>
      </form>

      {errorState && (
        <div className="alert alert-warning" role="alert">
          <p style={{ margin: '0 0 8px' }}>{errorState.message}</p>
          {errorState.unavailable && (
            <Link
              to={`/products?q=${encodeURIComponent(prompt.trim())}`}
              className="btn btn-outline"
            >
              Search Catalog Directly
            </Link>
          )}
        </div>
      )}

      {result && (
        <div>
          <div className="card">
            <span className="badge badge-accent" style={{ marginBottom: '6px' }}>AI-Assisted Recommendation</span>
            <p style={{ margin: 0, fontSize: '0.9375rem' }}>{result.summary}</p>
          </div>

          {Array.isArray(result.products) && result.products.length > 0 && (
            <div className="product-grid">
              {result.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}