import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginBoxed = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const credentials = {
    mazzika: { email: 'mazzika@zeko.com', password: 'mazzika123' },
    yatchFestival: { email: 'yatch@zeko.com', password: 'yatch123' },
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const match =
      (email === credentials.mazzika.email && password === credentials.mazzika.password) ||
      (email === credentials.yatchFestival.email && password === credentials.yatchFestival.password);

    if (match) {
      localStorage.setItem('loggedInEmail', email);
      navigate('/zekoDashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  useEffect(() => {
    document.title = 'Login | Zeko';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle,#ccc_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Zeko Client Login</h2>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 mb-1 text-sm">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-md bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. mazzika@zeko.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 text-sm">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-2 rounded-md bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginBoxed;
