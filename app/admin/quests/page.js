"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";

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
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [quests, setQuests] = useState([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageMessage, setManageMessage] = useState("");

  async function loadQuests(currentPassword = password) {
    setManageLoading(true);
    setManageMessage("");

    const response = await fetch("/api/admin/quests", {
      headers: {
        "x-admin-password": currentPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setManageMessage(result.error || "Gagal memuat quest.");
      setManageLoading(false);
      return;
    }

    setQuests(result.quests || []);
    setManageLoading(false);
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setUnlocked(true);
      setLoginMessage("");
      await loadQuests(password);
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

  function startEdit(quest) {
    setEditingId(quest.id);
    setMessage("");

    setForm({
      title: quest.title || "",
      rank: quest.rank || "Common",
      type: quest.type || "Action",
      mode: quest.mode || "Solo",
      location: quest.location || "",
      status: quest.status || "Available",
      objective: quest.objective || "",
      monster_target: quest.monster_target || "",
      reward: quest.reward || "",
      possible_loot: quest.possible_loot || "",
      description: quest.description || "",
      admin_notes: quest.admin_notes || "",
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

    if (editingId) {
      const response = await fetch("/api/admin/quests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          id: editingId,
          ...form,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Gagal update quest.");
        setLoading(false);
        return;
      }

      setMessage("Quest berhasil diupdate. Quest Board akan ikut berubah.");
      setEditingId(null);
      setForm(initialForm);
      setLoading(false);
      await loadQuests();
      return;
    }

    const { error } = await supabase.from("quests").insert([form]);

    if (error) {
      setMessage(`Gagal menyimpan quest: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("Quest berhasil disimpan. Data akan muncul di Quest Board.");
    setForm(initialForm);
    setLoading(false);
    await loadQuests();
  }

  async function deleteQuest(quest) {
    const confirmed = window.confirm(`Hapus quest "${quest.title}"?`);

    if (!confirmed) return;

    setManageLoading(true);
    setManageMessage("");

    const response = await fetch("/api/admin/quests", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id: quest.id }),
    });

    const result = await response.json();

    if (!response.ok) {
      setManageMessage(result.error || "Gagal menghapus quest.");
      setManageLoading(false);
      return;
    }

    if (editingId === quest.id) {
      cancelEdit();
    }

    setManageMessage(`Quest "${quest.title}" berhasil dihapus.`);
    await loadQuests();
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
          <>
            <section className="section">
              <div className="admin-section-header">
                <h2>{editingId ? "Edit Quest" : "Create New Quest"}</h2>

                {editingId && (
                  <button
                    className="admin-secondary"
                    type="button"
                    onClick={cancelEdit}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

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
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update Quest"
                    : "Save Quest"}
                </button>

                {message && <p className="admin-message">{message}</p>}
              </form>
            </section>

            <section className="section">
              <div className="admin-section-header">
                <h2>Manage Existing Quests</h2>
                <button
                  className="admin-secondary"
                  type="button"
                  onClick={() => loadQuests()}
                  disabled={manageLoading}
                >
                  {manageLoading ? "Loading..." : "Refresh List"}
                </button>
              </div>

              {manageMessage && <p className="admin-message">{manageMessage}</p>}

              <div className="admin-list">
                {quests.length === 0 ? (
                  <p className="muted">Belum ada quest yang dimuat.</p>
                ) : (
                  quests.map((quest) => (
                    <div className="admin-list-item" key={quest.id}>
                      <div>
                        <strong>{quest.title}</strong>
                        <p>
                          {quest.rank} • {quest.type} • {quest.mode} • {quest.location} • {quest.status}
                        </p>
                      </div>

                      <div className="admin-actions">
                        <button
                          className="admin-secondary"
                          type="button"
                          onClick={() => startEdit(quest)}
                          disabled={manageLoading}
                        >
                          Edit
                        </button>

                        <button
                          className="admin-danger"
                          type="button"
                          onClick={() => deleteQuest(quest)}
                          disabled={manageLoading}
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
