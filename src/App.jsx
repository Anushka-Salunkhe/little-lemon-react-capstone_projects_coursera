import { useEffect, useMemo, useState } from "react";
import { menuItems } from "./data/menu.js";
import { ArrowRight, CalendarDays, Check, ChefHat, Clock3, CookingPot, Leaf, MapPin, Minus, Plus, ShoppingBag, Utensils, X } from "lucide-react";

const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const times = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
const money = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
const formatTime = (time) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export default function App() {
  const [page, setPage] = useState("home");
  const [cart, setCart] = useState({});
  const [category, setCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [form, setForm] = useState({ date: localToday(), time: "18:00", guests: "2", occasion: "Birthday", name: "", email: "", phone: "", requests: "" });
  const [availability, setAvailability] = useState({ tables: [], loading: false, error: "" });
  const [errors, setErrors] = useState({});
  const [booking, setBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const categories = ["All", "Starters", "Mains", "Desserts", "Drinks"];
  const filteredMenu = useMemo(() => category === "All" ? menuItems : menuItems.filter(item => item.category === category), [category]);
  const cartItems = menuItems.filter(item => cart[item.id] > 0).map(item => ({ ...item, quantity: cart[item.id] }));
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (page !== "booking" || !form.date || !form.time || !form.guests) return;
    const controller = new AbortController();
    setAvailability(current => ({ ...current, loading: true, error: "" }));
    fetch(`/api/availability?date=${encodeURIComponent(form.date)}&time=${encodeURIComponent(form.time)}&guests=${encodeURIComponent(form.guests)}`, { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not check table availability.");
        setAvailability({ tables: data.availableTables, loading: false, error: "" });
      })
      .catch(error => {
        if (error.name !== "AbortError") setAvailability({ tables: [], loading: false, error: "Could not connect to the booking server. Check that npm run dev is running." });
      });
    return () => controller.abort();
  }, [page, form.date, form.time, form.guests]);

  function navigate(next) {
    setPage(next);
    setNotice("");
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function changeQuantity(id, delta) {
    setCart(current => {
      const next = Math.max(0, Math.min(20, (current[id] || 0) + delta));
      return { ...current, [id]: next };
    });
    setNotice("");
  }
  function updateField(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: "" }));
    setBooking(null);
  }
  async function submitBooking(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.date || form.date < localToday()) nextErrors.date = "Choose today or a future date.";
    if (!form.time) nextErrors.time = "Choose a time.";
    if (!form.name.trim()) nextErrors.name = "Enter the name for the reservation.";
    if (!form.email.trim()) nextErrors.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (form.phone && !/^[+()\d\s-]{7,20}$/.test(form.phone)) nextErrors.phone = "Enter a valid phone number or leave it blank.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBookingLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guests: Number(form.guests) })
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.error || "We couldn't confirm this table. Please choose another time.");
        const refresh = await fetch(`/api/availability?date=${encodeURIComponent(form.date)}&time=${encodeURIComponent(form.time)}&guests=${encodeURIComponent(form.guests)}`);
        const current = await refresh.json();
        setAvailability({ tables: current.availableTables || [], loading: false, error: "" });
        return;
      }
      setBooking(data.booking);
      setNotice("");
      setAvailability(current => ({ ...current, tables: current.tables.filter(table => table.tableId !== data.booking.tableId) }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setNotice("Booking server unavailable. Start the app with npm run dev and try again.");
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <a href="#home" className="brand" onClick={e => { e.preventDefault(); navigate("home"); }} aria-label="Little Lemon home">
          <span className="brand-lemon">🍋</span><span className="brand-text"><strong>Little Lemon</strong><small>MEDITERRANEAN KITCHEN</small></span>
        </a>
        <nav className="nav" aria-label="Main navigation">
          <button className={page === "home" ? "nav-link active" : "nav-link"} onClick={() => navigate("home")}>Home</button>
          <button className={page === "menu" ? "nav-link active" : "nav-link"} onClick={() => navigate("menu")}>Menu</button>
          <button className={page === "booking" ? "nav-link active" : "nav-link"} onClick={() => navigate("booking")}>Book Table</button>
          <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Open basket, ${cartCount} items`}><ShoppingBag size={18}/><span>Basket</span><b>{cartCount}</b></button>
        </nav>
      </header>

      <main>
        {page === "home" && <HomePage onMenu={() => navigate("menu")} onBooking={() => navigate("booking")} />}
        {page === "menu" && <section className="menu-page page-wrap">
          <div className="page-heading"><div><p className="eyebrow">MADE FRESH, MADE WITH LOVE</p><h1>Our Menu</h1><p>Sunshine on a plate, with a little Mediterranean magic.</p></div><button className="button button-dark" onClick={() => setCartOpen(true)}><ShoppingBag size={17}/> View basket ({cartCount})</button></div>
          <div className="category-tabs" role="group" aria-label="Filter menu by category">
            {categories.map(item => <button key={item} className={category === item ? "category-tab selected" : "category-tab"} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="menu-grid">
            {filteredMenu.map(item => <MenuCard key={item.id} item={item} quantity={cart[item.id] || 0} onChange={delta => changeQuantity(item.id, delta)} />)}
          </div>
          {cartCount > 0 && <div className="cart-summary"><div><strong>{cartCount} item{cartCount === 1 ? "" : "s"} in your basket</strong><span>{money(cartTotal)}</span></div><button className="button button-yellow" onClick={() => setCartOpen(true)}>Review basket <ArrowRight size={16}/></button></div>}
        </section>}
        {page === "booking" && <section className="booking-page page-wrap">
          {booking ? <div className="booking-success">
            <div className="success-mark"><Check size={34}/></div><p className="eyebrow">RESERVATION CONFIRMED</p><h1>Your table is waiting, {booking.name}!</h1><p className="success-lead">Thanks for choosing Little Lemon. Your reservation has been saved by the booking server.</p>
            <div className="reference-card"><span>Booking reference</span><strong>{booking.reference}</strong><button className="text-button" onClick={() => navigator.clipboard?.writeText(booking.reference)}>Copy reference</button></div>
            <div className="booking-details"><div><CalendarDays/><span><small>Date</small><strong>{booking.date}</strong></span></div><div><Clock3/><span><small>Time</small><strong>{formatTime(booking.time)}</strong></span></div><div><Utensils/><span><small>Guests</small><strong>{booking.guests}</strong></span></div><div><MapPin/><span><small>Table</small><strong>Table {booking.tableId}</strong></span></div></div>
            <p className="small-note">Demo project: booking data is stored in the local API's JSON file. No email or SMS is sent.</p>
            <button className="button button-dark" onClick={() => { setBooking(null); setForm(current => ({ ...current, name: "", email: "", phone: "", requests: "" })); navigate("booking"); }}>Make another booking</button>
          </div> : <div className="booking-layout">
            <div className="booking-aside"><p className="eyebrow">SAVE YOUR SEAT</p><h1>Good food.<br/><em>Good company.</em></h1><p>Book a table for your next catch-up, date night or family dinner. We'll have a little sunshine ready.</p>
              <div className="aside-fact"><Clock3/><span><strong>Dinner service</strong><small>Daily, 5:00 PM – 9:00 PM</small></span></div>
              <div className="aside-fact"><CookingPot/><span><strong>Made to be shared</strong><small>Tables for 1–10 guests</small></span></div>
              <div className="aside-fact"><Leaf/><span><strong>Dietary needs?</strong><small>Add a note in special requests.</small></span></div>
              <div className="availability-note"><span className="live-dot"/><span>Live table availability<br/><small>Availability updates from the booking API.</small></span></div>
            </div>
            <form className="booking-form" onSubmit={submitBooking} noValidate>
              <div className="form-title"><div><p className="eyebrow">A PLACE AT OUR TABLE</p><h2>Book your table</h2></div><span className="form-icon"><CalendarDays/></span></div>
              <p className="form-subtitle">Fields marked * are required.</p>
              {notice && <div className="alert alert-error" role="alert"><X size={18}/><span>{notice}</span></div>}
              <div className="form-grid">
                <Field label="Date" name="date" error={errors.date}><input id="date" name="date" type="date" min={localToday()} value={form.date} onChange={updateField} required aria-invalid={!!errors.date}/></Field>
                <Field label="Time" name="time" error={errors.time}><select id="time" name="time" value={form.time} onChange={updateField} required>{times.map(time => <option key={time} value={time}>{formatTime(time)}</option>)}</select></Field>
                <Field label="Guests" name="guests"><select id="guests" name="guests" value={form.guests} onChange={updateField}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "guest" : "guests"}</option>)}</select></Field>
                <Field label="Occasion" name="occasion"><select id="occasion" name="occasion" value={form.occasion} onChange={updateField}><option>Birthday</option><option>Anniversary</option><option>Date night</option><option>Business meal</option><option>Family dinner</option><option>Other</option></select></Field>
                <Field label="Full name *" name="name" error={errors.name}><input id="name" name="name" autoComplete="name" value={form.name} onChange={updateField} placeholder="Your full name" required aria-invalid={!!errors.name}/></Field>
                <Field label="Email address *" name="email" error={errors.email}><input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} placeholder="you@example.com" required aria-invalid={!!errors.email}/></Field>
                <Field label="Phone (optional)" name="phone" error={errors.phone}><input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={updateField} placeholder="+91 98765 43210" aria-invalid={!!errors.phone}/></Field>
                <Field label="Special requests (optional)" name="requests" wide><textarea id="requests" name="requests" rows="3" maxLength="300" value={form.requests} onChange={updateField} placeholder="Dietary needs, accessibility requests…"/></Field>
              </div>
              <div className={`availability-box ${availability.tables.length === 0 && !availability.loading ? "unavailable" : ""}`} aria-live="polite">
                {availability.loading ? <><span className="spinner"/> Checking available tables…</> : availability.error ? <span>{availability.error}</span> : availability.tables.length > 0 ? <><Check size={17}/><span><strong>{availability.tables.length} table option{availability.tables.length === 1 ? "" : "s"} available</strong><small>For {form.guests} guest(s) at {formatTime(form.time)} on {form.date}</small></span></> : <><X size={17}/><span><strong>No suitable tables available</strong><small>Try another date or time to find an open table.</small></span></>}
              </div>
              <button className="button button-yellow submit-booking" type="submit" disabled={bookingLoading || availability.loading || availability.tables.length === 0 || !!availability.error}>{bookingLoading ? "Confirming…" : <>Confirm reservation <ArrowRight size={17}/></>}</button>
              <p className="form-footnote">Your details are used only for this demo reservation. Do not enter sensitive information.</p>
            </form>
          </div>}
        </section>}
      </main>

      <footer className="footer"><a className="footer-logo" href="#home" onClick={e => { e.preventDefault(); navigate("home"); }}>🍋 Little Lemon</a><span>Fresh flavours. Warm moments.</span><span>© {new Date().getFullYear()} Little Lemon · React capstone demo</span></footer>

      {cartOpen && <div className="drawer-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setCartOpen(false); }}>
        <aside className="cart-drawer" aria-label="Your basket" aria-modal="true" role="dialog">
          <div className="drawer-head"><div><p className="eyebrow">A LITTLE SOMETHING DELICIOUS</p><h2>Your basket</h2></div><button className="icon-button" aria-label="Close basket" onClick={() => setCartOpen(false)}><X/></button></div>
          {cartItems.length === 0 ? <div className="empty-cart"><span>🥗</span><h3>Your basket is looking fresh</h3><p>Add something delicious from our menu.</p><button className="button button-dark" onClick={() => navigate("menu")}>Explore menu</button></div> : <>
            <div className="drawer-items">{cartItems.map(item => <div className="drawer-item" key={item.id}><img src={item.image} alt={item.name}/><div className="drawer-item-info"><strong>{item.name}</strong><span>{money(item.price)} each</span><QuantityControl quantity={item.quantity} onMinus={() => changeQuantity(item.id, -1)} onPlus={() => changeQuantity(item.id, 1)} label={item.name}/></div><b>{money(item.price * item.quantity)}</b></div>)}</div>
            <div className="drawer-bottom"><div className="total-line"><span>Subtotal</span><strong>{money(cartTotal)}</strong></div><p>Taxes and service charges, if applicable, are not included in this demo.</p><button className="button button-yellow" onClick={() => { setCartOpen(false); navigate("booking"); }}>Continue to book a table <ArrowRight size={17}/></button><button className="text-button clear-cart" onClick={() => setCart({})}>Clear basket</button></div>
          </>}
        </aside>
      </div>}
    </div>
  );
}

function HomePage({ onMenu, onBooking }) {
  return <div className="home-page">
    <section className="hero"><div className="hero-content"><p className="eyebrow">A NEIGHBOURHOOD MEDITERRANEAN KITCHEN</p><h1>Little Lemon</h1><h2>A little zest.<br/>A lot of heart.</h2><p>Fresh ingredients, sun-soaked flavours and a warm welcome at every table. Come hungry, leave happy.</p><div className="hero-actions"><button className="button button-yellow" onClick={onBooking}>Book a table <ArrowRight size={17}/></button><button className="button button-outline" onClick={onMenu}>Explore our menu</button></div><div className="hero-rating"><span>★★★★★</span><small>Made with love, served with sunshine</small></div></div>
      <div className="hero-photo"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=90" alt="Fresh Mediterranean salad with colourful seasonal ingredients"/><div className="photo-badge"><span>🍋</span><strong>Fresh, always.</strong><small>Good food brings us together.</small></div></div>
    </section>
    <section className="welcome-strip"><div><span className="strip-icon"><ChefHat/></span><span><strong>Made fresh daily</strong><small>Seasonal ingredients</small></span></div><div><span className="strip-icon"><Leaf/></span><span><strong>Something for everyone</strong><small>Veggie-friendly favourites</small></span></div><div><span className="strip-icon"><Clock3/></span><span><strong>Your evening, your way</strong><small>Book a time that suits you</small></span></div></section>
    <section className="home-specials"><div className="section-heading"><div><p className="eyebrow">A FEW HOUSE FAVOURITES</p><h2>Made to make you smile</h2><p>Good things, made with fresh ingredients and a little extra love.</p></div><button className="button button-dark" onClick={onMenu}>View full menu <ArrowRight size={16}/></button></div><div className="special-grid">{menuItems.filter(item => ["greek-salad", "pasta", "lemon-cake"].includes(item.id)).map(item => <article className="special-card" key={item.id}><img src={item.image} alt={item.name}/><div><span className="special-tag">{item.tag}</span><h3>{item.name}</h3><p>{item.description}</p><strong>{money(item.price)}</strong></div></article>)}</div></section>
    <section className="story-band"><div><p className="eyebrow">OUR LITTLE PHILOSOPHY</p><h2>Gather around something good.</h2><p>At Little Lemon, a meal is more than what’s on the plate. It’s the conversation that runs late, the birthday candle, and the extra bite you just have to share.</p><button className="button button-yellow" onClick={onBooking}>Find your table <ArrowRight size={16}/></button></div><div className="story-quote">“A good meal is a memory in the making.”<span>— The Little Lemon team</span></div></section>
  </div>;
}

function MenuCard({ item, quantity, onChange }) {
  return <article className="menu-card"><div className="menu-image"><img src={item.image} alt={item.name} loading="lazy"/><span className="menu-tag">{item.tag}</span></div><div className="menu-card-body"><div className="menu-card-title"><h2>{item.name}</h2><strong>{money(item.price)}</strong></div><p>{item.description}</p><div className="menu-card-bottom"><span className="menu-category">{item.category}</span><QuantityControl quantity={quantity} onMinus={() => onChange(-1)} onPlus={() => onChange(1)} label={item.name}/></div></div></article>;
}
function QuantityControl({ quantity, onMinus, onPlus, label }) {
  return <div className="quantity-control" aria-label={`${label} quantity`}><button type="button" onClick={onMinus} disabled={quantity === 0} aria-label={`Remove one ${label}`}><Minus size={14}/></button><output aria-live="polite">{quantity}</output><button type="button" onClick={onPlus} disabled={quantity >= 20} aria-label={`Add one ${label}`}><Plus size={14}/></button></div>;
}
function Field({ label, name, error, wide, children }) {
  return <div className={`field ${wide ? "wide" : ""}`}><label htmlFor={name}>{label}</label>{children}{error && <span className="field-error" id={`${name}-error`}>{error}</span>}</div>;
}