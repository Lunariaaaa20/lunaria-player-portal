"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

const ADMIN_PASSWORD = "lunaria-admin";

const initialForm = {
  title: "",
  rank: "Common",
  type: "Action",
  mode: "Solo",
  location: "",
  status: "Available",
  objective: "",
  monster_target: "",
  reward: "",
  possible_loot: "",
  description: "",
  admin_notes: "",
};

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleLogin(event) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setUnlocked(true);
      setLoginMessage("");
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

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("quests").insert([form]);

    if (error) {
      setMessage(`Gagal menyimpan quest: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("Quest berhasil disimpan. Data akan muncul di Quest Board.");
    setForm(initialForm);
    setLoading(false);
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Admin Panel</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/character-registration">Character Registration</Link>
          <Link href="/quest-report">Quest Report</Link>
          <Link href="/reward-claim">Reward Claim</Link>
          <Link href="/economy">Economy System</Link>
          <Link href="/rules">Rules & Guide</Link>
          <Link href="/admin">Admin Panel</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>ADMIN PANEL</h1>
          <p>Panel pengelolaan data Lunaria. Akses dibatasi untuk admin.</p>
        </section>

        {!unlocked ? (
          <section className="section admin-lock">
            <h2>Admin Access</h2>
            <p>Masukkan password admin untuk membuka form pengelolaan quest.</p>

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
                Unlock Admin Panel
              </button>

              {loginMessage && <p className="admin-message">{loginMessage}</p>}
            </form>
          </section>
        ) : (
          <section className="section">
            <h2>Create New Quest</h2>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Quest Title
                  <input
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Contoh: Glowcap Drift"
                    required
                  />
                </label>

                <label>
                  Rank
                  <select
                    value={form.rank}
                    onChange={(e) => updateField("rank", e.target.value)}
                  >
                    <option>Common</option>
                    <option>Uncommon</option>
                    <option>Dangerous</option>
                    <option>Special</option>
                  </select>
                </label>

                <label>
                  Type
                  <select
                    value={form.type}
                    onChange={(e) => updateField("type", e.target.value)}
                  >
                    <option>Action</option>
                    <option>Santai</option>
                  </select>
                </label>

                <label>
                  Mode
                  <select
                    value={form.mode}
                    onChange={(e) => updateField("mode", e.target.value)}
                  >
                    <option>Solo</option>
                    <option>Duo</option>
                    <option>Party</option>
                  </select>
                </label>

                <label>
                  Location
                  <input
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    placeholder="Contoh: Everglow Forest"
                    required
                  />
                </label>

                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                  >
                    <option>Available</option>
                    <option>Ongoing</option>
                    <option>Completed</option>
                    <option>Closed</option>
                    <option>Unavailable</option>
                    <option>Draft</option>
                  </select>
                </label>
              </div>

              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Deskripsi quest..."
                  rows="5"
                  required
                />
              </label>

              <label>
                Objective
                <textarea
                  value={form.objective}
                  onChange={(e) => updateField("objective", e.target.value)}
                  placeholder="Objective quest..."
                  rows="4"
                  required
                />
              </label>

              <label>
                Monster / Target
                <textarea
                  value={form.monster_target}
                  onChange={(e) => updateField("monster_target", e.target.value)}
                  placeholder="Monster, target, atau objek utama quest..."
                  rows="4"
                />
              </label>

              <label>
                Reward
                <textarea
                  value={form.reward}
                  onChange={(e) => updateField("reward", e.target.value)}
                  placeholder="Contoh: 2S–3S"
                  rows="3"
                  required
                />
              </label>

              <label>
                Possible Loot
                <textarea
                  value={form.possible_loot}
                  onChange={(e) => updateField("possible_loot", e.target.value)}
                  placeholder="Loot dan kegunaannya..."
                  rows="4"
                />
              </label>

              <label>
                Admin Notes
                <textarea
                  value={form.admin_notes}
                  onChange={(e) => updateField("admin_notes", e.target.value)}
                  placeholder="Catatan internal admin..."
                  rows="3"
                />
              </label>

              <button className="admin-submit" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Quest"}
              </button>

              {message && <p className="admin-message">{message}</p>}
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
