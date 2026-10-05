import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setNotAuthorized(false);

    try {
      const { data, error } = await supabase
        .from('allowed_users')
        .select('*')
        .ilike('REGISTERED EMAIL', email.trim())
        .maybeSingle();

      if (error) {
        alert('Supabase API Error: ' + error.message);
        console.error(error);
        return;
      }

      if (data) {
        onLogin({ name: data['CLIENT NAME'] || 'Client', email: data['REGISTERED EMAIL'] });
      } else {
        setNotAuthorized(true);
      }
    } catch (err) {
      console.error('Auth error:', err);
      alert('Connection error: Ensure your Supabase project is active and reachable.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <h2>Client Portal Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="clientEmailInput">Registered Email Address</label>
            <input
              type="email"
              id="clientEmailInput"
              className="full-width"
              placeholder="Enter your registered Email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {notAuthorized && <div className="auth-error">This Email address is not authorized.</div>}
          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'Verifying...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
