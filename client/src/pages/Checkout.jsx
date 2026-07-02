import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { ShieldIcon, CheckIcon } from "../components/icons.jsx";
import { api } from "../api/client.js";
import { useCart } from "../context/CartContext.jsx";
import "./Checkout.css";

const HOLD_SECONDS = 9 * 60 + 42;

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [email, setEmail] = useState("amara.okafor@gmail.com");
  const [name, setName] = useState("Amara Okafor");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("09 / 27");
  const [cvc, setCvc] = useState("123");
  const [zip, setZip] = useState("Berlin, DE · 10999");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  if (!cart) {
    return (
      <div className="checkout__empty">
        <div className="mq-state-block">
          <div style={{ fontWeight: 600, fontSize: 16 }}>No tickets selected yet</div>
          <div style={{ fontSize: 13, color: "var(--gray-500)" }}>Pick an event and choose your tickets first.</div>
          <Link to="/discover" className="mq-btn mq-btn--primary" style={{ marginTop: 12 }}>
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cart.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const fee = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + fee) * 100) / 100;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  async function handlePay(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.checkout({
        eventId: cart.event.id,
        buyerName: name,
        buyerEmail: email,
        paymentMethod: "card",
        lines: cart.lines.map((l) => ({ tierId: l.tierId, quantity: l.qty })),
      });
      clearCart();
      navigate(`/wallet?email=${encodeURIComponent(email)}&justPaid=1`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="checkout">
      <div className="checkout__topbar">
        <Logo size={30} dark />
        <div className="checkout__hold">
          <ShieldIcon size={16} color="var(--paid)" strokeWidth={2} />
          Secure checkout · your seat is held for <span className="mono checkout__holdTime">{mm}:{ss}</span>
        </div>
      </div>

      <div className="checkout__body">
        <div className="checkout__form">
          <div style={{ maxWidth: 560 }}>
            <h1 className="checkout__h1">Checkout</h1>

            <div className="checkout__expressRow">
              <div className="checkout__expressBtn checkout__expressBtn--dark"> Pay</div>
              <div className="checkout__expressBtn checkout__expressBtn--light">G Pay</div>
            </div>
            <div className="checkout__divider">
              <span />
              <span className="checkout__dividerText">or pay by card</span>
              <span />
            </div>

            <form onSubmit={handlePay}>
              <div className="checkout__sectionLabel">CONTACT</div>
              <input className="mq-input checkout__input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
              <div className="checkout__contactRow">
                <input className="mq-input" style={{ marginBottom: 0 }} value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                <span className="checkout__contactHint">Tickets sent here</span>
              </div>

              <div className="checkout__sectionLabel" style={{ marginTop: 24 }}>
                PAYMENT
              </div>
              <input className="mq-input checkout__input mono" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required />
              <div className="checkout__cardRow">
                <input className="mq-input mono" value={expiry} onChange={(e) => setExpiry(e.target.value)} required />
                <input className="mq-input mono" value={cvc} onChange={(e) => setCvc(e.target.value)} required />
              </div>
              <input className="mq-input checkout__input" value={zip} onChange={(e) => setZip(e.target.value)} required />

              {error && <div className="checkout__error">{error}</div>}

              <button type="submit" className="mq-btn mq-btn--primary mq-btn--full" style={{ padding: 16, fontSize: 17 }} disabled={submitting}>
                {submitting ? "Processing…" : `Pay €${total.toFixed(2)}`}
              </button>
              <div className="checkout__terms">By paying you agree to Marquee's Terms &amp; refund policy. Powered by Stripe.</div>
            </form>
          </div>
        </div>

        <div className="checkout__summary">
          <div className="checkout__eventRow">
            <div
              className="checkout__eventThumb"
              style={{ background: `linear-gradient(150deg, ${cart.event.heroGradient?.from}, ${cart.event.heroGradient?.to})` }}
            >
              <span>{cart.event.title.toUpperCase()}</span>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 17 }}>{cart.event.title}</div>
              <div className="checkout__eventMeta">
                {new Date(cart.event.date).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })} · {cart.event.doorsTimeLabel}
              </div>
              <div className="checkout__eventMeta">
                {cart.event.venue} · {cart.event.neighborhood}
              </div>
            </div>
          </div>

          <div className="checkout__lines">
            {cart.lines.map((l) => (
              <div key={l.tierId} className="checkout__lineRow">
                <span style={{ color: "var(--gray-600)" }}>
                  {l.qty} × {l.name}
                </span>
                <span className="mono">€{(l.price * l.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="checkout__lineRow">
              <span style={{ color: "var(--gray-600)" }}>Booking fee</span>
              <span className="mono">€{fee.toFixed(2)}</span>
            </div>
            <div className="checkout__promoRow">
              <div className="checkout__promoInput">Promo code</div>
              <span className="checkout__promoApply">Apply</span>
            </div>
          </div>

          <div className="checkout__totalRow">
            <span style={{ fontWeight: 600, fontSize: 17 }}>Total</span>
            <span className="mono" style={{ fontWeight: 700, fontSize: 26 }}>
              €{total.toFixed(2)}
            </span>
          </div>

          <div className="checkout__note">
            <CheckIcon size={22} color="var(--paid)" strokeWidth={2} />
            <div>
              QR tickets arrive by email &amp; in <b>My Tickets</b> the instant payment clears.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
