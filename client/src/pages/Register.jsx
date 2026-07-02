import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "../components/Logo.jsx";
import "./Register.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await register(name, email, password);
      navigate("/organizer");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Logo size={36} dark />
          </div>
          <h1 className="register-title">Create your account</h1>
          <p className="register-sub">Set up your organizer profile and workspace.</p>
        </div>

        {error && <div className="register-error">{error}</div>}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-field">
            <label className="mq-field-label" style={{ color: "var(--gray-300)" }} htmlFor="name">
              ORGANIZER NAME
            </label>
            <input
              id="name"
              type="text"
              className="mq-input register-input"
              placeholder="e.g. Rina Kessler"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoComplete="name"
            />
          </div>

          <div className="register-field">
            <label className="mq-field-label" style={{ color: "var(--gray-300)" }} htmlFor="email">
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              className="mq-input register-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              autoComplete="email"
            />
          </div>

          <div className="register-field">
            <label className="mq-field-label" style={{ color: "var(--gray-300)" }} htmlFor="password">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              className="mq-input register-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="mq-btn mq-btn--primary mq-btn--full" disabled={submitting}>
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="register-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
