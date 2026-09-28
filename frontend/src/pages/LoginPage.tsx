import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { token, role, user } = res.data.data;
      login(token, role as Role, user);
      if (role === "admin") navigate("/admin");
      else if (role === "doctor") navigate("/doctor");
      else navigate("/patient");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dental-900 via-dental-800 to-mint-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-64 h-64 rounded-full border border-white/5"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              transform: "translate(-50%,-50%)",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 items-center justify-center text-white text-3xl mb-4">
            🦷
          </div>
          <h1 className="font-display font-bold text-3xl text-white">
            Dental Care
          </h1>
          <p className="text-dental-200 text-sm mt-1">Dental Care AI System</p>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8">
          <h2 className="font-display font-bold text-2xl text-surface-900 mb-1">
            Welcome back
          </h2>
          <p className="text-surface-500 text-sm mb-6">
            Sign in to your account to continue
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-surface-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-dental-600 font-semibold hover:text-dental-700"
              >
                Register
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-surface-50 rounded-xl">
            <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
              Demo Accounts
            </p>
            <div className="space-y-1 text-xs text-surface-600">
              <p>
                🔴 <b>Admin:</b> admin@gmail.com / admin123
              </p>
              <p>
                🔵 <b>Doctor:</b> doctor@gmail.com / doctor123
              </p>
              <p>
                🟢 <b>Patient:</b> patient@gmail.com / patient123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
