import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Zap } from 'lucide-react';

const DEMO_EMAIL = 'demo@safelink.app';
const DEMO_PASSWORD = 'Demo@123';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Demo login failed. Please try again or register a new account.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-sm">
      {/* Demo Login Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">👀 Reviewer / Demo Access</p>
        <p className="text-xs text-blue-700 mb-3">
          Click below to instantly explore all features without registering.
        </p>
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={demoLoading || loading}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          {demoLoading ? 'Logging in...' : 'Try Demo — Instant Access'}
        </button>
        <p className="text-xs text-blue-500 mt-2 text-center">
          Email: {DEMO_EMAIL} · Password: {DEMO_PASSWORD}
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-400">or sign in with your account</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emergency-500 focus:ring-emergency-500 p-2 border"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emergency-500 focus:ring-emergency-500 p-2 border"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading || demoLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emergency-600 hover:bg-emergency-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emergency-500 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-emergency-600 hover:text-emergency-500">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
};
