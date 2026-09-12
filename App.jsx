import React, { useState, useEffect, useCallback } from "react";
import { Check, Clock, ShieldCheck, X, Plus, Trash2, LogOut, Search, ChevronRight, Zap, Ban } from "lucide-react";

const SEED_PACKAGES = [
  { id: "p1", uc: 60, price: 14000, popular: false, active: true },
  { id: "p2", uc: 325, price: 69000, popular: false, active: true },
  { id: "p3", uc: 660, price: 138000, popular: true, active: true },
  { id: "p4", uc: 1800, price: 345000, popular: false, active: true },
  { id: "p5", uc: 3850, price: 690000, popular: false, active: true },
  { id: "p6", uc: 8100, price: 1380000, popular: false, active: true },
];

const ADMIN_PASS = "zarba2026";

const STATUS_LABEL = {
  pending: "Kutilmoqda",
  paid: "To'landi",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
};

function fmt(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function genId() {
  return "ZB" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [packages, setPackages] = useState(SEED_PACKAGES);
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState("store");
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [form, setForm] = useState({ pubgId: "", phone: "", payment: "payme" });
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [checkId, setCheckId] = useState("");
  const [checkResult, setCheckResult] = useState(undefined);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [passError, setPassError] = useState(false);
  const [adminTab, setAdminTab] = useState("orders");
  const [newPkg, setNewPkg] = useState({ uc: "", price: "" });
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem("zarba:packages");
      if (p) setPackages(JSON.parse(p));
      else localStorage.setItem("zarba:packages", JSON.stringify(SEED_PACKAGES));
    } catch (e) {}
    try {
      const o = localStorage.getItem("zarba:orders");
      if (o) setOrders(JSON.parse(o));
    } catch (e) {}
    setReady(true);
  }, []);

  const persistPackages = useCallback((next) => {
    setPackages(next);
    try { localStorage.setItem("zarba:packages", JSON.stringify(next)); }
    catch (e) { setSaveError(true); }
  }, []);

  const persistOrders = useCallback((next) => {
    setOrders(next);
    try { localStorage.setItem("zarba:orders", JSON.stringify(next)); }
    catch (e) { setSaveError(true); }
  }, []);

  function selectPkg(pkg) {
    setSelectedPkg(pkg);
    setSubmittedOrder(null);
    setTimeout(() => {
      document.getElementById("zarba-order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (!selectedPkg || !/^\d{6,12}$/.test(form.pubgId) || form.phone.trim().length < 7) return;
    const order = {
      id: genId(),
      uc: selectedPkg.uc,
      price: selectedPkg.price,
      pubgId: form.pubgId.trim(),
      phone: form.phone.trim(),
      payment: form.payment,
      status: "pending",
      createdAt: Date.now(),
    };
    await persistOrders([order, ...orders]);
    setSubmittedOrder(order);
    setSelectedPkg(null);
    setForm({ pubgId: "", phone: "", payment: "payme" });
  }

  function runCheck(e) {
    e.preventDefault();
    const found = orders.find((o) => o.id.toLowerCase() === checkId.trim().toLowerCase());
    setCheckResult(found || null);
  }

  function tryAdminLogin(e) {
    e.preventDefault();
    if (passInput === ADMIN_PASS) { setAdminAuthed(true); setPassError(false); }
    else setPassError(true);
  }

  async function setOrderStatus(id, status) {
    await persistOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  async function addPackage(e) {
    e.preventDefault();
    const uc = parseInt(newPkg.uc, 10);
    const price = parseInt(newPkg.price, 10);
    if (!uc || !price) return;
    await persistPackages([...packages, { id: "p" + Date.now(), uc, price, popular: false, active: true }]);
    setNewPkg({ uc: "", price: "" });
  }

  async function updatePackage(id, patch) {
    await persistPackages(packages.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function removePackage(id) {
    await persistPackages(packages.filter((p) => p.id !== id));
  }

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap');
        .zb-root * { box-sizing: border-box; }
        .zb-root { font-family: 'Manrope', system-ui, sans-serif; color: var(--text); }
        .zb-h { font-family: 'Oswald', system-ui, sans-serif; letter-spacing: 0.01em; }
        .zb-card { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; }
        .zb-btn { font-family: 'Oswald', system-ui, sans-serif; letter-spacing: 0.03em; cursor: pointer; border: none; transition: transform .12s ease, background .15s ease; }
        .zb-btn:active { transform: scale(0.97); }
        .zb-input { background: var(--bg); border: 1px solid var(--line); color: var(--text); border-radius: 4px; font-family: 'Manrope', sans-serif; }
        .zb-input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
        .zb-pkg { cursor: pointer; transition: border-color .15s ease, background .15s ease; }
        .zb-pkg:hover { border-color: var(--accent-dim); }
        .zb-pkg.sel { border-color: var(--accent); background: var(--surface2); }
        .zb-nav-link { cursor: pointer; font-family: 'Oswald', system-ui, sans-serif; letter-spacing: .02em; }
        .zb-nav-link:hover { color: var(--accent); }
        table.zb-table { border-collapse: collapse; width: 100%; }
        table.zb-table th { text-align: left; font-family: 'Oswald', sans-serif; font-weight: 500; color: var(--text-muted); font-size: 12px; padding: 8px 10px; border-bottom: 1px solid var(--line); }
        table.zb-table td { padding: 10px; border-bottom: 1px solid var(--line); font-size: 13px; }
        select.zb-status { background: var(--bg); color: var(--text); border: 1px solid var(--line); border-radius: 4px; padding: 4px 6px; font-family: 'Manrope'; font-size: 12px; }
        ::selection { background: var(--accent); color: #12140F; }
      `}</style>
      <div className="zb-root" style={{ minHeight: "100%" }}>
        {view === "store" ? (
          <Store
            packages={packages.filter((p) => p.active)}
            selectedPkg={selectedPkg}
            onSelect={selectPkg}
            form={form}
            setForm={setForm}
            submittedOrder={submittedOrder}
            onSubmit={submitOrder}
            checkId={checkId}
            setCheckId={setCheckId}
            checkResult={checkResult}
            runCheck={runCheck}
            goAdmin={() => setView("admin")}
          />
        ) : (
          <Admin
            authed={adminAuthed}
            passInput={passInput}
            setPassInput={setPassInput}
            passError={passError}
            tryLogin={tryAdminLogin}
            orders={orders}
            packages={packages}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            setOrderStatus={setOrderStatus}
            newPkg={newPkg}
            setNewPkg={setNewPkg}
            addPackage={addPackage}
            updatePackage={updatePackage}
            removePackage={removePackage}
            logout={() => { setAdminAuthed(false); setPassInput(""); }}
            goStore={() => setView("store")}
          />
        )}
        {saveError && (
          <div style={{ position: "fixed", bottom: 12, left: 12, right: 12, background: "var(--danger)", color: "#fff", padding: "10px 14px", borderRadius: 6, fontSize: 13, textAlign: "center" }}>
            Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.
          </div>
        )}
      </div>
    </div>
  );
}

function Store({ packages, selectedPkg, onSelect, form, setForm, submittedOrder, onSubmit, checkId, setCheckId, checkResult, runCheck, goAdmin }) {
  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--line)" }}>
        <div className="zb-h" style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
          ZARBA<span style={{ color: "var(--accent)" }}>.UC</span>
        </div>
        <nav style={{ display: "flex", gap: 18, fontSize: 13 }}>
          <span className="zb-nav-link" style={{ color: "var(--text-muted)" }} onClick={() => document.getElementById("zarba-packages")?.scrollIntoView({ behavior: "smooth" })}>Paketlar</span>
          <span className="zb-nav-link" style={{ color: "var(--text-muted)" }} onClick={() => document.getElementById("zarba-check")?.scrollIntoView({ behavior: "smooth" })}>Buyurtmani tekshirish</span>
          <span className="zb-nav-link" style={{ color: "var(--text-muted)" }} onClick={goAdmin}>Admin</span>
        </nav>
      </header>

      <section style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", padding: "48px 20px", maxWidth: 980, margin: "0 auto" }}>
        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--accent)", fontSize: 12, fontFamily: "'Oswald'", letterSpacing: ".04em", marginBottom: 10 }}>
            <Zap size={13} /> Bir zumda UC olib beramiz
          </div>
          <h1 className="zb-h" style={{ fontSize: 40, lineHeight: 1.08, fontWeight: 700, margin: "0 0 14px" }}>
            PUBG Mobile hisobingizga UC quyish
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6, maxWidth: 440, margin: "0 0 22px" }}>
            ID raqamingizni kiriting, paketni tanlang, Payme yoki Click orqali to'lang — UC 10-30 daqiqa ichida hisobingizga tushadi.
          </p>
          <button className="zb-btn" style={{ background: "var(--accent)", color: "#161810", padding: "12px 22px", borderRadius: 4, fontSize: 14, fontWeight: 600 }} onClick={() => document.getElementById("zarba-packages")?.scrollIntoView({ behavior: "smooth" })}>
            PAKETNI TANLASH
          </button>
        </div>
        <div style={{ flex: "0 0 200px" }}>
          <DropSVG />
        </div>
      </section>

      <section id="zarba-packages" style={{ padding: "10px 20px 50px", maxWidth: 980, margin: "0 auto" }}>
        <h2 className="zb-h" style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Paketlar</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {packages.map((p) => (
            <div key={p.id} className={"zb-card zb-pkg" + (selectedPkg?.id === p.id ? " sel" : "")} onClick={() => onSelect(p)} style={{ padding: 16, position: "relative" }}>
              {p.popular && (
                <div style={{ position: "absolute", top: -1, right: -1, background: "var(--accent)", color: "#161810", fontSize: 10, fontFamily: "'Oswald'", padding: "3px 8px", borderRadius: "0 5px 0 5px" }}>MASHHUR</div>
              )}
              <div className="zb-h" style={{ fontSize: 22, fontWeight: 600 }}>{fmt(p.uc)} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>UC</span></div>
              <div style={{ marginTop: 8, fontSize: 15, color: "var(--accent)", fontWeight: 600 }}>{fmt(p.price)} so'm</div>
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                Tanlash <ChevronRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="zarba-order-form" style={{ padding: "10px 20px 60px", maxWidth: 560, margin: "0 auto" }}>
        {submittedOrder ? (
          <div className="zb-card" style={{ padding: 22, textAlign: "center" }}>
            <Check size={30} color="var(--accent)" style={{ marginBottom: 8 }} />
            <h3 className="zb-h" style={{ fontSize: 18, marginBottom: 6 }}>Buyurtma qabul qilindi</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
              Buyurtma raqamingiz: <strong style={{ color: "var(--text)" }}>{submittedOrder.id}</strong>. Uni saqlab qo'ying — holatni shu raqam orqali tekshirasiz.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {submittedOrder.payment === "payme" ? "Payme" : "Click"} orqali to'lov havolasi tez orada operator tomonidan yuboriladi.
            </p>
          </div>
        ) : selectedPkg ? (
          <form className="zb-card" onSubmit={onSubmit} style={{ padding: 22 }}>
            <h3 className="zb-h" style={{ fontSize: 18, marginBottom: 4 }}>Buyurtma rasmiylashtirish</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
              Tanlangan: {fmt(selectedPkg.uc)} UC — {fmt(selectedPkg.price)} so'm
            </p>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 5 }}>PUBG Mobile ID</label>
            <input className="zb-input" required pattern="\d{6,12}" placeholder="Masalan: 5123456789" value={form.pubgId} onChange={(e) => setForm({ ...form, pubgId: e.target.value })} style={{ width: "100%", padding: "10px 12px", marginBottom: 14, fontSize: 14 }} />
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 5 }}>Telefon raqam</label>
            <input className="zb-input" required placeholder="+998 90 123 45 67" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: "100%", padding: "10px 12px", marginBottom: 14, fontSize: 14 }} />
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>To'lov usuli</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["payme", "click"].map((m) => (
                <div key={m} onClick={() => setForm({ ...form, payment: m })} className="zb-card" style={{ flex: 1, padding: "10px 0", textAlign: "center", cursor: "pointer", borderColor: form.payment === m ? "var(--accent)" : "var(--line)", background: form.payment === m ? "var(--surface2)" : "var(--surface)" }}>
                  <span className="zb-h" style={{ fontSize: 13, textTransform: "uppercase" }}>{m}</span>
                </div>
              ))}
            </div>
            <button type="submit" className="zb-btn" style={{ width: "100%", background: "var(--accent)", color: "#161810", padding: "12px 0", borderRadius: 4, fontSize: 14, fontWeight: 600 }}>
              BUYURTMANI TASDIQLASH
            </button>
          </form>
        ) : (
          <div className="zb-card" style={{ padding: 22, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Buyurtma berish uchun yuqoridan paket tanlang.
          </div>
        )}
      </section>

      <section id="zarba-check" style={{ padding: "10px 20px 60px", maxWidth: 560, margin: "0 auto" }}>
        <h2 className="zb-h" style={{ fontSize: 20, fontWeight: 600, marginBottom: 14 }}>Buyurtma holatini tekshirish</h2>
        <form className="zb-card" onSubmit={runCheck} style={{ padding: 18, display: "flex", gap: 10 }}>
          <input className="zb-input" placeholder="Buyurtma raqami, masalan ZB4F2A1" value={checkId} onChange={(e) => setCheckId(e.target.value)} style={{ flex: 1, padding: "10px 12px", fontSize: 14 }} />
          <button type="submit" className="zb-btn" style={{ background: "var(--olive)", color: "#fff", padding: "0 16px", borderRadius: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <Search size={14} /> Tekshirish
          </button>
        </form>
        {checkResult !== undefined && (
          <div className="zb-card" style={{ marginTop: 12, padding: 16, fontSize: 13 }}>
            {checkResult ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div>{fmt(checkResult.uc)} UC — {fmt(checkResult.price)} so'm</div>
                  <div style={{ color: "var(--text-muted)", marginTop: 4 }}>ID: {checkResult.pubgId}</div>
                </div>
                <StatusBadge status={checkResult.status} />
              </div>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>Bunday raqamli buyurtma topilmadi.</span>
            )}
          </div>
        )}
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "18px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
        ZARBA.UC — norasmiy top-up xizmati. PUBG Mobile — Krafton Inc. mahsuloti.
      </footer>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { color: "var(--text-muted)", icon: <Clock size={12} /> },
    paid: { color: "var(--accent)", icon: <ShieldCheck size={12} /> },
    delivered: { color: "var(--success)", icon: <Check size={12} /> },
    cancelled: { color: "var(--danger)", icon: <Ban size={12} /> },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: s.color, fontSize: 12, fontFamily: "'Oswald'" }}>
      {s.icon} {STATUS_LABEL[status] || status}
    </span>
  );
}

function DropSVG() {
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", height: "auto" }}>
      <circle cx="100" cy="100" r="88" fill="none" stroke="var(--line)" strokeWidth="1" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="var(--line)" strokeWidth="1" />
      <circle cx="100" cy="100" r="32" fill="none" stroke="var(--olive)" strokeWidth="1.5" />
      <line x1="100" y1="4" x2="100" y2="196" stroke="var(--line)" strokeWidth="1" />
      <line x1="4" y1="100" x2="196" y2="100" stroke="var(--line)" strokeWidth="1" />
      <path d="M100 40 L112 96 L100 160 L88 96 Z" fill="var(--accent)" opacity="0.85" />
      <circle cx="100" cy="96" r="5" fill="#161810" />
      <circle cx="150" cy="60" r="3" fill="var(--olive)" />
      <circle cx="55" cy="140" r="3" fill="var(--olive)" />
    </svg>
  );
}

function Admin(props) {
  const { authed, passInput, setPassInput, passError, tryLogin, orders, packages, adminTab, setAdminTab, setOrderStatus, newPkg, setNewPkg, addPackage, updatePackage, removePackage, logout, goStore } = props;

  if (!authed) {
    return (
      <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <form className="zb-card" onSubmit={tryLogin} style={{ padding: 26, width: "100%", maxWidth: 320 }}>
          <div className="zb-h" style={{ fontSize: 18, marginBottom: 4 }}>Admin panel</div>
          <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 16 }}>Kirish uchun parolni kiriting</p>
          <input className="zb-input" type="password" autoFocus value={passInput} onChange={(e) => setPassInput(e.target.value)} placeholder="Parol" style={{ width: "100%", padding: "10px 12px", marginBottom: 10, fontSize: 14 }} />
          {passError && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>Parol noto'g'ri</div>}
          <button type="submit" className="zb-btn" style={{ width: "100%", background: "var(--accent)", color: "#161810", padding: "11px 0", borderRadius: 4, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>KIRISH</button>
          <div className="zb-nav-link" style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }} onClick={goStore}>Do'konga qaytish</div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
        <div className="zb-h" style={{ fontSize: 18, fontWeight: 700 }}>ZARBA<span style={{ color: "var(--accent)" }}>.UC</span> · Admin</div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="zb-nav-link" style={{ fontSize: 13, color: "var(--text-muted)" }} onClick={goStore}>Do'kon</span>
          <span className="zb-nav-link" style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }} onClick={logout}><LogOut size={13} /> Chiqish</span>
        </div>
      </header>

      <div style={{ display: "flex", gap: 6, padding: "14px 20px 0", maxWidth: 900, margin: "0 auto" }}>
        {["orders", "packages"].map((t) => (
          <button key={t} className="zb-btn" onClick={() => setAdminTab(t)} style={{ background: adminTab === t ? "var(--surface2)" : "transparent", border: "1px solid var(--line)", borderBottom: adminTab === t ? "1px solid var(--surface2)" : "1px solid var(--line)", color: adminTab === t ? "var(--accent)" : "var(--text-muted)", padding: "8px 16px", borderRadius: "4px 4px 0 0", fontSize: 13 }}>
            {t === "orders" ? "Buyurtmalar" : "Paketlar"}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px 40px", maxWidth: 900, margin: "0 auto" }}>
        {adminTab === "orders" ? (
          <div className="zb-card" style={{ padding: 6, marginTop: -1, borderTopLeftRadius: 0 }}>
            {orders.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Hozircha buyurtmalar yo'q.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="zb-table">
                  <thead>
                    <tr><th>ID</th><th>PUBG ID</th><th>UC</th><th>Narx</th><th>Telefon</th><th>To'lov</th><th>Holat</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.id}</td>
                        <td>{o.pubgId}</td>
                        <td>{fmt(o.uc)}</td>
                        <td>{fmt(o.price)}</td>
                        <td>{o.phone}</td>
                        <td style={{ textTransform: "uppercase" }}>{o.payment}</td>
                        <td>
                          <select className="zb-status" value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)}>
                            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="zb-card" style={{ padding: 18, marginTop: -1, borderTopLeftRadius: 0 }}>
            <div style={{ display: "grid", gap: 10 }}>
              {packages.map((p) => (
                <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
                  <input className="zb-input" type="number" value={p.uc} onChange={(e) => updatePackage(p.id, { uc: parseInt(e.target.value, 10) || 0 })} style={{ width: 90, padding: "6px 8px", fontSize: 13 }} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>UC</span>
                  <input className="zb-input" type="number" value={p.price} onChange={(e) => updatePackage(p.id, { price: parseInt(e.target.value, 10) || 0 })} style={{ width: 120, padding: "6px 8px", fontSize: 13 }} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>so'm</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
                    <input type="checkbox" checked={p.popular} onChange={(e) => updatePackage(p.id, { popular: e.target.checked })} /> mashhur
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
                    <input type="checkbox" checked={p.active} onChange={(e) => updatePackage(p.id, { active: e.target.checked })} /> faol
                  </label>
                  <button className="zb-btn" onClick={() => removePackage(p.id)} style={{ marginLeft: "auto", background: "transparent", color: "var(--danger)", padding: 6 }}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
            <form onSubmit={addPackage} style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
              <input className="zb-input" type="number" placeholder="UC miqdori" value={newPkg.uc} onChange={(e) => setNewPkg({ ...newPkg, uc: e.target.value })} style={{ width: 110, padding: "8px 10px", fontSize: 13 }} />
              <input className="zb-input" type="number" placeholder="Narxi (so'm)" value={newPkg.price} onChange={(e) => setNewPkg({ ...newPkg, price: e.target.value })} style={{ width: 140, padding: "8px 10px", fontSize: 13 }} />
              <button type="submit" className="zb-btn" style={{ background: "var(--accent)", color: "#161810", padding: "8px 14px", borderRadius: 4, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}><Plus size={14} /> Qo'shish</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  app: {
    "--bg": "#12140F",
    "--surface": "#1C2016",
    "--surface2": "#232819",
    "--line": "#31351F",
    "--accent": "#E8A33D",
    "--accent-dim": "#B97E22",
    "--olive": "#6B7A4F",
    "--text": "#F1EDE1",
    "--text-muted": "#9BA187",
    "--danger": "#C0533B",
    "--success": "#7A9B5C",
    background: "var(--bg)",
    minHeight: "100vh",
  },
};
