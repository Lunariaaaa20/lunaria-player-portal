"use client";

import Link from "next/link";
import { useState } from "react";

const ADMIN_PASSWORD = "lunaria-admin";

const initialForm = {
  item_name: "",
  category: "General Goods",
  price_value: "",
  currency_type: "Silver",
  availability: "Available",
  location: "",
  description: "",
};

const categories = [
  "Currency Rule",
  "Food",
  "Snack",
  "Drink",
  "General Goods",
  "Blacksmith",
  "Blacksmith Service",
  "Service",
  "Travel Service",
  "Material",
  "Loot Exchange",
];

const currencies = ["Silver", "Bronze", "Gold", "Mixed"];

const availabilityOptions = [
  "Available",
  "Unavailable",
  "Limited",
  "Approval Required",
  "Restricted",
  "Seasonal",
  "Event Only",
];

export default function AdminEconomyPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadItems(currentPassword = password) {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/economy", {
      headers: {
        "x-admin-password": currentPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal memuat economy items.");
      setLoading(false);
      return;
    }

    setItems(result.items || []);
    setLoading(false);
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setUnlocked(true);
      setLoginMessage("");
      await loadItems(password);
      return;
    }

    setLoginMessage("Password salah.");
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setMessage("");

    setForm({
      item_name: item.item_name || "",
      category: item.category || "General Goods",
      price_value: item.price_value || "",
      currency_type: item.currency_type || "Silver",
      availability: item.availability || "Available",
      location: item.location || "",
      description: item.description || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const method = editingId ? "PATCH" : "POST";

    const response = await fetch("/api/admin/economy", {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal menyimpan economy item.");
      setLoading(false);
      return;
    }

    setMessage(editingId ? "Economy item berhasil diupdate." : "Economy item berhasil ditambahkan.");
    setEditingId(null);
    setForm(initialForm);
    await loadItems();
  }

  async function deleteItem(item) {
    const confirmed = window.confirm(`Hapus item "${item.item_name}"?`);
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/economy", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id: item.id }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal menghapus item.");
      setLoading(false);
      return;
    }

    if (editingId === item.id) {
      cancelEdit();
    }

    setMessage(`Item "${item.item_name}" berhasil dihapus.`);
    await loadItems();
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Economy Admin</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/economy">Economy System</Link>
          <Link href="/rules">Rules & Guide</Link>
          <Link href="/admin">Quest Admin</Link>
          <Link href="/admin/economy">Economy Admin</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>ECONOMY ADMIN</h1>
          <p>Tambah, edit, dan hapus data harga resmi Lunaria.</p>
        </section>

        {!unlocked ? (
          <section className="section admin-lock">
            <h2>Admin Access</h2>

            <form className="admin-form" onSubmit={handleLogin}>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  required
                />
              </label>

              <button className="admin-submit" type="submit">
                Unlock Economy Admin
              </button>

              {loginMessage && <p className="admin-message">{loginMessage}</p>}
            </form>
          </section>
        ) : (
          <>
            <section className="section">
              <div className="admin-section-header">
                <h2>{editingId ? "Edit Economy Item" : "Create Economy Item"}</h2>

                {editingId && (
                  <button className="admin-secondary" type="button" onClick={cancelEdit}>
                    Cancel Edit
                  </button>
                )}
              </div>

              <form className="admin-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    Item Name
                    <input
                      value={form.item_name}
                      onChange={(e) => updateField("item_name", e.target.value)}
                      placeholder="Contoh: Hunter’s Stew"
                      required
                    />
                  </label>

                  <label>
                    Category
                    <select
                      value={form.category}
                      onChange={(e) => updateField("category", e.target.value)}
                    >
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Price / Value
                    <input
                      value={form.price_value}
                      onChange={(e) => updateField("price_value", e.target.value)}
                      placeholder="Contoh: 3S 50B"
                      required
                    />
                  </label>

                  <label>
                    Currency
                    <select
                      value={form.currency_type}
                      onChange={(e) => updateField("currency_type", e.target.value)}
                    >
                      {currencies.map((currency) => (
                        <option key={currency}>{currency}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Availability
                    <select
                      value={form.availability}
                      onChange={(e) => updateField("availability", e.target.value)}
                    >
                      {availabilityOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Location
                    <input
                      value={form.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      placeholder="Contoh: The Golden Barrel"
                      required
                    />
                  </label>
                </div>

                <label>
                  Description
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Deskripsi item, fungsi, atau aturan harga..."
                    rows="4"
                  />
                </label>

                <button className="admin-submit" type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update Item" : "Save Item"}
                </button>

                {message && <p className="admin-message">{message}</p>}
              </form>
            </section>

            <section className="section">
              <div className="admin-section-header">
                <h2>Manage Economy Items</h2>

                <button
                  className="admin-secondary"
                  type="button"
                  onClick={() => loadItems()}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh List"}
                </button>
              </div>

              <div className="admin-list">
                {items.length === 0 ? (
                  <p className="muted">Belum ada item yang dimuat.</p>
                ) : (
                  items.map((item) => (
                    <div className="admin-list-item" key={item.id}>
                      <div>
                        <strong>{item.item_name}</strong>
                        <p>
                          {item.category} • {item.price_value} • {item.currency_type} • {item.availability} • {item.location}
                        </p>
                      </div>

                      <div className="admin-actions">
                        <button
                          className="admin-secondary"
                          type="button"
                          onClick={() => startEdit(item)}
                          disabled={loading}
                        >
                          Edit
                        </button>

                        <button
                          className="admin-danger"
                          type="button"
                          onClick={() => deleteItem(item)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
