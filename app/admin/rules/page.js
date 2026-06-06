"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "lunaria-admin";

const initialForm = {
  rule_title: "",
  category: "Quest Rule",
  access: "Public",
  priority: "High",
  status: "Active",
  summary: "",
  full_rule: "",
};

const categories = [
  "Rank System",
  "Pathway System",
  "Character Rule",
  "Quest Rule",
  "Reward Rule",
  "Inventory Rule",
  "Economy Rule",
  "Combat Rule",
  "Community Rule",
  "Story Rule",
  "Admin Rule",
];

const accessOptions = ["Public", "Admin Only", "Hidden"];
const priorityOptions = ["Core Rule", "High", "Medium", "Low"];
const statusOptions = ["Active", "Draft", "Archived"];

export default function AdminRulesPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filteredRules = rules.filter((rule) => {
    const keyword = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !keyword ||
      rule.rule_title?.toLowerCase().includes(keyword) ||
      rule.category?.toLowerCase().includes(keyword) ||
      rule.status?.toLowerCase().includes(keyword) ||
      rule.priority?.toLowerCase().includes(keyword);

    const matchesCategory =
      categoryFilter === "All" || rule.category === categoryFilter;

    const matchesStatus =
      statusFilter === "All" || rule.status === statusFilter;

    const matchesPriority =
      priorityFilter === "All" || rule.priority === priorityFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter("All");
    setStatusFilter("All");
    setPriorityFilter("All");
  }

  async function loadRules(currentPassword = password) {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/rules", {
      headers: {
        "x-admin-password": currentPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal memuat rules.");
      setLoading(false);
      return;
    }

    setRules(result.rules || []);
    setLoading(false);
  }

  useEffect(() => {
    const savedPassword = window.localStorage.getItem("lunaria_admin_password");

    if (savedPassword === ADMIN_PASSWORD) {
      setPassword(savedPassword);
      setUnlocked(true);
      loadRules(savedPassword);
    }
  }, []);

  function logoutAdmin() {
    window.localStorage.removeItem("lunaria_admin_password");
    setUnlocked(false);
    setPassword("");
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem("lunaria_admin_password", password);
      setUnlocked(true);
      setLoginMessage("");
      await loadRules(password);
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

  function startEdit(rule) {
    setEditingId(rule.id);
    setMessage("");

    setForm({
      rule_title: rule.rule_title || "",
      category: rule.category || "Quest Rule",
      access: rule.access || "Public",
      priority: rule.priority || "High",
      status: rule.status || "Active",
      summary: rule.summary || "",
      full_rule: rule.full_rule || "",
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

    const response = await fetch("/api/admin/rules", {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal menyimpan rule.");
      setLoading(false);
      return;
    }

    setMessage(editingId ? "Rule berhasil diupdate." : "Rule berhasil ditambahkan.");
    setEditingId(null);
    setForm(initialForm);
    await loadRules();
  }

  async function deleteRule(rule) {
    const confirmed = window.confirm(`Hapus rule "${rule.rule_title}"?`);
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/rules", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id: rule.id }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal menghapus rule.");
      setLoading(false);
      return;
    }

    if (editingId === rule.id) {
      cancelEdit();
    }

    setMessage(`Rule "${rule.rule_title}" berhasil dihapus.`);
    await loadRules();
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Rules Admin</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/economy">Economy System</Link>
          <Link href="/rules">Rules & Guide</Link>
          <Link href="/admin">Admin Dashboard</Link>
          <Link href="/admin/characters">Character Admin</Link>
          <Link href="/admin/quests">Quest Admin</Link>
          <Link href="/admin/economy">Economy Admin</Link>
          <Link href="/admin/rules">Rules Admin</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>RULES ADMIN</h1>
          <p>Tambah, edit, dan hapus aturan resmi Lunaria.</p>
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
                Unlock Rules Admin
              </button>

              {loginMessage && <p className="admin-message">{loginMessage}</p>}
            </form>
          </section>
        ) : (
          <>
            <div className="admin-top-actions">
              <Link className="admin-secondary" href="/admin">
                Back to Admin Dashboard
              </Link>

              <button className="admin-danger" type="button" onClick={logoutAdmin}>
                Logout Admin
              </button>
            </div>

            <section className="section">
              <div className="admin-section-header">
                <h2>{editingId ? "Edit Rule" : "Create Rule"}</h2>

                {editingId && (
                  <button className="admin-secondary" type="button" onClick={cancelEdit}>
                    Cancel Edit
                  </button>
                )}
              </div>

              <form className="admin-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    Rule Title
                    <input
                      value={form.rule_title}
                      onChange={(e) => updateField("rule_title", e.target.value)}
                      placeholder="Contoh: Quest Result Rule"
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
                    Access
                    <select
                      value={form.access}
                      onChange={(e) => updateField("access", e.target.value)}
                    >
                      {accessOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Priority
                    <select
                      value={form.priority}
                      onChange={(e) => updateField("priority", e.target.value)}
                    >
                      {priorityOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Status
                    <select
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  Summary
                  <textarea
                    value={form.summary}
                    onChange={(e) => updateField("summary", e.target.value)}
                    placeholder="Ringkasan aturan..."
                    rows="4"
                    required
                  />
                </label>

                <label>
                  Full Rule
                  <textarea
                    value={form.full_rule}
                    onChange={(e) => updateField("full_rule", e.target.value)}
                    placeholder="Isi aturan lengkap..."
                    rows="6"
                    required
                  />
                </label>

                <button className="admin-submit" type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update Rule" : "Save Rule"}
                </button>

                {message && <p className="admin-message">{message}</p>}
              </form>
            </section>

            <section className="section">
              <div className="admin-section-header">
                <h2>Manage Rules</h2>

                <button
                  className="admin-secondary"
                  type="button"
                  onClick={() => loadRules()}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh List"}
                </button>
              </div>

              <div className="admin-filter-panel">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, category, priority, or status..."
                />

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option>All</option>
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All</option>
                  {statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option>All</option>
                  {priorityOptions.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>

                <button className="admin-secondary" type="button" onClick={clearFilters}>
                  Clear Filter
                </button>
              </div>

              <p className="muted">
                Showing {filteredRules.length} of {rules.length} rules.
              </p>

              <div className="admin-list">
                {filteredRules.length === 0 ? (
                  <p className="muted">Tidak ada rule yang cocok dengan filter.</p>
                ) : (
                  filteredRules.map((rule) => (
                    <div className="admin-list-item" key={rule.id}>
                      <div>
                        <strong>{rule.rule_title}</strong>
                        <p>
                          {rule.category} • {rule.access} • {rule.priority} • {rule.status}
                        </p>
                      </div>

                      <div className="admin-actions">
                        <button
                          className="admin-secondary"
                          type="button"
                          onClick={() => startEdit(rule)}
                          disabled={loading}
                        >
                          Edit
                        </button>

                        <button
                          className="admin-danger"
                          type="button"
                          onClick={() => deleteRule(rule)}
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
