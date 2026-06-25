/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Attempting login with:", form.email);
      const res = await api.post("/auth/login", form);
      console.log("Login success:", res.data);
      localStorage.setItem("sphere_token", res.data.data.token);
      localStorage.setItem("sphere_user", JSON.stringify(res.data.data.user));
      console.log("Navigating to dashboard...");
      navigate("/dashboard");
    } catch (err: any) {
      console.log("Login failed:", err.response?.status, err.response?.data);
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #c8cfd8; }
        .login-root { display: flex; min-height: 100vh; font-family: 'Barlow', sans-serif; }
        .login-left {
          width: 460px; flex-shrink: 0;
          background: linear-gradient(160deg, #0d1a2a 0%, #0a1e30 50%, #0d2a40 100%);
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 48px; position: relative; overflow: hidden;
        }
        .login-right {
          flex: 1; background: #f4f5f7;
          display: flex; align-items: center; justify-content: center; padding: 48px;
        }
        .grid-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(0,200,224,0.05) 40px),
            repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(0,200,224,0.05) 40px);
        }
        .glow {
          position: absolute; top: 35%; left: 50%; transform: translate(-50%,-50%);
          width: 400px; height: 400px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(0,200,224,0.08) 0%, transparent 70%);
        }
        .form-wrap { width: 100%; max-width: 360px; }
        .input-field {
          width: 100%; padding: 11px 14px; background: #fff;
          border: 1px solid #e2e4e8; border-radius: 8px; font-size: 13px;
          color: #111418; outline: none; transition: border-color 0.15s;
          font-family: 'Barlow', sans-serif;
        }
        .input-field:focus { border-color: #00C8E0; }
        .submit-btn {
          width: 100%; padding: 13px; border-radius: 8px; border: none;
          background: #15202e; color: #fff;
          font-family: 'Barlow Condensed', sans-serif; font-size: 14px;
          font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: background 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .submit-btn:hover:not(:disabled) { background: #1e3448; }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { padding: 32px 24px; }
        }
      `}</style>

      <div className="login-root">

        {/* ── Left brand panel ── */}
        <div className="login-left">
          <div className="grid-overlay" />
          <div className="glow" />

          {/* Logo */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0d1e2e", border: "1.5px solid #00C8E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00C8E0" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "0.06em" }}>
                SPHERE <span style={{ color: "#00C8E0" }}>TECH</span>
              </div>
              <div style={{ fontSize: 9, color: "rgba(200,207,216,0.45)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                CMS Admin
              </div>
            </div>
          </div>

          {/* Headline */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 2, marginBottom: 20, fontSize: 10, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", background: "rgba(0,200,224,0.12)", color: "#00C8E0" }}>
              Content Management
            </div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 44, fontWeight: 700, color: "#fff", lineHeight: 1.12, letterSpacing: "0.01em" }}>
              Rwanda's tech<br />story starts<br />
              <span style={{ color: "#00C8E0" }}>here.</span>
            </h1>
            <p style={{ marginTop: 16, fontSize: 13, color: "rgba(200,207,216,0.55)", lineHeight: 1.7, maxWidth: 300 }}>
              Publish articles, manage videos, and control the look and feel of Sphere Tech — all from one place.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: 36, marginTop: 40 }}>
              {[{ val: "24", label: "Articles" }, { val: "6", label: "Categories" }, { val: "8", label: "Videos" }].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "rgba(200,207,216,0.4)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C8E0" }} />
            <span style={{ fontSize: 11, color: "rgba(200,207,216,0.35)", letterSpacing: "0.05em" }}>
              Sphere Tech Group Ltd · Kigali, Rwanda
            </span>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="login-right">
          <div className="form-wrap">

            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111418", marginBottom: 6, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.02em" }}>
              Sign in
            </h2>
            <p style={{ fontSize: 13, color: "#8a95a3", marginBottom: 32 }}>
              Enter your credentials to access the dashboard
            </p>

            {/* Error */}
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "10px 14px", borderRadius: 8, background: "#fff1f1", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13 }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                Email address
              </label>
              <input
                className="input-field"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@spheretech.rw"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Password
                </label>
                <a href="/forgot-password" style={{ fontSize: 12, color: "#00C8E0", textDecoration: "none", fontWeight: 500 }}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  className="input-field"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8a95a3", padding: 0, display: "flex" }}>
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 20 }}>
              <input type="checkbox" style={{ accentColor: "#00C8E0", width: 14, height: 14 }} />
              <span style={{ fontSize: 13, color: "#4a5568" }}>Keep me signed in</span>
            </label>

            {/* Submit — type button, onClick */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="submit-btn"
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                    <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Signing in...
                </>
              ) : "Sign in →"}
            </button>

            <p style={{ marginTop: 28, textAlign: "center", fontSize: 12, color: "#c8cfd8" }}>
              Having trouble? Contact{" "}
              <a href="mailto:admin@spheretech.rw" style={{ color: "#00C8E0", textDecoration: "none" }}>
                admin@spheretech.rw
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}