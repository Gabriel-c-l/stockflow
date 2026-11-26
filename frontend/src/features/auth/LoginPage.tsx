import { useState, type FormEvent } from 'react';
import { ApiError } from '../../lib/api';
import { stockflowApi } from '../../lib/stockflow-api';
import type { User } from '../../lib/types';

type LoginPageProps = {
  onLogin: (user: User) => void;
};

function InventoryIllustration() {
  return (
    <div className="login-illustration" aria-hidden="true">
      <div className="shelf shelf-top">
        <div className="storage-box box-blue"><i /><i /></div>
        <div className="storage-box box-cyan"><i /><i /></div>
        <div className="storage-box box-violet"><i /><i /></div>
      </div>
      <div className="shelf shelf-bottom">
        <div className="storage-box box-teal"><i /><i /></div>
        <div className="storage-box box-orange"><i /><i /></div>
        <div className="storage-box box-blue box-small"><i /><i /></div>
      </div>
    </div>
  );
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [helpMessage, setHelpMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Informe seu e-mail e sua senha para continuar.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await stockflowApi.login(email.trim(), password);
      onLogin(result.user);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setError('E-mail ou senha inválidos. Confira seus dados e tente novamente.');
      } else if (cause instanceof ApiError && cause.status === 429) {
        setError('Muitas tentativas de acesso. Aguarde um pouco antes de tentar novamente.');
      } else {
        setError(cause instanceof Error ? cause.message : 'Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="Sobre o StockFlow">
        <div className="auth-brand-mark">S</div>
        <div className="auth-brand-copy">
          <h1>Welcome back</h1>
          <p className="auth-brand-subtitle">Sign in to continue to your workspace.</p>
          <div className="auth-brand-message">
            <strong>Everything in its place.</strong>
            <p>Keep inventory, people and operations<br className="desktop-break" /> connected in one workspace.</p>
          </div>
        </div>
        <div className="auth-brand-visual">
          <InventoryIllustration />
        </div>
        <div className="auth-status-card">
          <div>
            <span>Inventory status</span>
            <strong>Healthy and up to date</strong>
          </div>
          <span className="auth-live-pill">LIVE</span>
        </div>
        <span className="auth-brand-footer">STOCKFLOW · INVENTORY MANAGEMENT</span>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-content">
          <header className="auth-form-heading">
            <h2>Sign in</h2>
            <p>Enter your account details below.</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field">
              <span>EMAIL ADDRESS</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
              />
            </label>

            <label className="auth-field">
              <span>PASSWORD</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="auth-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 9 5.1 9 7s-1.1 3.4-3 4.9M6.2 6.2C3.5 7.7 2 10.5 2 12c0 1.9 3.8 7 10 7 1 0 2-.2 2.9-.5" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="2.5" /></svg>
                  )}
                </button>
              </div>
            </label>

            <div className="auth-options">
              <span aria-hidden="true" />
              <button type="button" onClick={() => setHelpMessage('Password recovery is not configured yet. Contact your workspace administrator to reset your password.')}>Forgot password?</button>
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}
            {helpMessage && <div className="auth-help-message" role="status">{helpMessage}</div>}

            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? <><span className="auth-button-spinner" /> Signing in...</> : 'Sign in'}
            </button>
          </form>

          <div className="auth-divider" />
          <div className="auth-account-note">
            <span>New to StockFlow?</span>
            <button type="button" onClick={() => setHelpMessage('Account creation is managed by your workspace administrator. Contact them to request access.')}>Create an account</button>
          </div>
        </div>
        <p className="auth-legal">By continuing, you agree to the Terms of Service and Privacy Policy.</p>
      </section>
    </main>
  );
}
