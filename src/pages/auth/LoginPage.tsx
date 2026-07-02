/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

function SphereLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
  

    const W = 260, H = 260, cx = W / 2, cy = H / 2, R = 98;
    let angle = 0;

    const meridians = 8;
    const parallels = 5;

    const nodes = [
      { lat: 0, lng: 0, r: 7 },
      { lat: 0.4, lng: 1.2, r: 4 },
      { lat: -0.3, lng: -1.0, r: 3 },
      { lat: 0.7, lng: 2.5, r: 3.5 },
      { lat: -0.6, lng: 1.8, r: 3 },
      { lat: 0.2, lng: -2.2, r: 4 },
      { lat: -0.8, lng: -0.5, r: 3 },
      { lat: 0.9, lng: 0.7, r: 2.5 },
    ];

    function project(lat: number, lng: number, rot: number) {
      const x3 = Math.cos(lat) * Math.sin(lng + rot);
      const y3 = Math.sin(lat);
      const z3 = Math.cos(lat) * Math.cos(lng + rot);
      return { sx: cx + R * x3, sy: cy - R * y3, z: z3 };
    }

    function drawGlobe(rot: number) {
      ctx.clearRect(0, 0, W, H);

      // Base sphere
      const grd = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, R + 20);
      grd.addColorStop(0, "rgba(13,30,46,0.7)");
      grd.addColorStop(1, "rgba(10,20,32,0.85)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Rim glow
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,200,224,0.35)";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Meridians
      for (let m = 0; m < meridians; m++) {
        const lng = (m / meridians) * Math.PI * 2;
        const pts: { sx: number; sy: number; z: number }[] = [];
        for (let s = 0; s <= 60; s++) {
          const lat = -Math.PI / 2 + (s / 60) * Math.PI;
          pts.push(project(lat, lng, rot));
        }
        ctx.beginPath();
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)));
        const avgZ = pts.reduce((a, b) => a + b.z, 0) / pts.length;
        ctx.strokeStyle = `rgba(180,210,230,${avgZ > 0 ? 0.35 + 0.2 * avgZ : 0.04 + 0.08 * (1 + avgZ)})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // Parallels
      for (let p = 1; p <= parallels; p++) {
        const lat = -Math.PI / 2 + (p / (parallels + 1)) * Math.PI;
        const pts: { sx: number; sy: number; z: number }[] = [];
        for (let s = 0; s <= 80; s++) {
          pts.push(project(lat, (s / 80) * Math.PI * 2, rot));
        }
        ctx.beginPath();
        pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy)));
        const avgZ = pts.reduce((a, b) => a + b.z, 0) / pts.length;
        ctx.strokeStyle = `rgba(180,210,230,${0.1 + 0.2 * ((avgZ + 1) / 2)})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // Nodes
      nodes
        .map((n) => ({ ...n, ...project(n.lat, n.lng, rot) }))
        .sort((a, b) => a.z - b.z)
        .forEach((n) => {
          if (n.z < -0.2) return;
          const alpha = 0.3 + 0.7 * Math.max(0, n.z);
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, n.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,200,224,${alpha})`;
          ctx.fill();
          if (n.r > 4) {
            ctx.beginPath();
            ctx.arc(n.sx, n.sy, n.r + 3, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0,200,224,${alpha * 0.35})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });

      ctx.restore();

      // Specular shine
      const shine = ctx.createRadialGradient(cx - 30, cy - 34, 2, cx - 20, cy - 24, 55);
      shine.addColorStop(0, "rgba(255,255,255,0.10)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = shine;
      ctx.fill();
    }

    function loop() {
      angle += 0.008;
      drawGlobe(angle);
      animRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} width={260} height={260} />;
}

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
        .globe-bg {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          opacity: 0.22;
          width: 340px; height: 340px;
          display: flex; align-items: center; justify-content: center;
        }
        .globe-bg canvas {
          width: 340px !important;
          height: 340px !important;
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

          {/* Spinning globe in the background */}
          <div className="globe-bg">
            <SphereLogo />
          </div>

          {/* Logo */}
<div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
  {/* Mini spinning globe replacing the circle-dot */}
  <div style={{ width: 36, height: 36, flexShrink: 0 }}>
    <canvas
      ref={(canvas) => {
        if (!canvas || (canvas as any)._globeInit) return;
        (canvas as any)._globeInit = true;
        const ctx = canvas.getContext("2d")!;
        const W = 36, H = 36, cx = 18, cy = 18, R = 15;
        let rot = 0;
        const meridians = 8, parallels = 5;
        const nodes = [
          { lat: 0, lng: 0, r: 2.5 },
          { lat: 0.4, lng: 1.2, r: 1.5 },
          { lat: -0.3, lng: -1.0, r: 1.2 },
          { lat: 0.7, lng: 2.5, r: 1.3 },
          { lat: 0.2, lng: -2.2, r: 1.5 },
        ];
        function project(lat: number, lng: number, r: number) {
          const x3 = Math.cos(lat) * Math.sin(lng + r);
          const y3 = Math.sin(lat);
          const z3 = Math.cos(lat) * Math.cos(lng + r);
          return { sx: cx + R * x3, sy: cy - R * y3, z: z3 };
        }
        function draw() {
          ctx.clearRect(0, 0, W, H);
          // Base
          const grd = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, R + 4);
          grd.addColorStop(0, "rgba(13,30,46,0.9)");
          grd.addColorStop(1, "rgba(10,20,32,0.95)");
          ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
          ctx.fillStyle = grd; ctx.fill();
          // Rim glow
          ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(0,200,224,0.6)"; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
          // Meridians
          for (let m = 0; m < meridians; m++) {
            const lng = (m / meridians) * Math.PI * 2;
            const pts = [];
            for (let s = 0; s <= 40; s++) {
              pts.push(project(-Math.PI / 2 + (s / 40) * Math.PI, lng, rot));
            }
            ctx.beginPath();
            pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy));
            const avgZ = pts.reduce((a, b) => a + b.z, 0) / pts.length;
            ctx.strokeStyle = `rgba(180,210,230,${avgZ > 0 ? 0.35 + 0.2 * avgZ : 0.05})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
          // Parallels
          for (let p = 1; p <= parallels; p++) {
            const lat = -Math.PI / 2 + (p / (parallels + 1)) * Math.PI;
            const pts = [];
            for (let s = 0; s <= 60; s++) pts.push(project(lat, (s / 60) * Math.PI * 2, rot));
            ctx.beginPath();
            pts.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy));
            ctx.strokeStyle = "rgba(180,210,230,0.15)"; ctx.lineWidth = 0.5; ctx.stroke();
          }
          // Nodes
          nodes.map(n => ({ ...n, ...project(n.lat, n.lng, rot) }))
            .sort((a, b) => a.z - b.z)
            .forEach(n => {
              if (n.z < -0.2) return;
              const alpha = 0.3 + 0.7 * Math.max(0, n.z);
              ctx.beginPath(); ctx.arc(n.sx, n.sy, n.r, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(0,200,224,${alpha})`; ctx.fill();
            });
          ctx.restore();
          rot += 0.008;
          requestAnimationFrame(draw);
        }
        draw();
      }}
      width={36}
      height={36}
      style={{ display: "block" }}
    />
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

            {/* Submit */}
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