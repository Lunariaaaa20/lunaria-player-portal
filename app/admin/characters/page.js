"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "lunaria-admin";

const initialForm = {
  player_name: "",
  character_name: "",
  race: "",
  guild_rank: "Initiate",
  pathway: "Warrior",
  skill_1_name: "",
  skill_1_description: "",
  skill_2_name: "",
  skill_2_description: "",
  inventory: "",
  gold: 0,
  silver: 0,
  bronze: 0,
  registered_guild: "Adventurer’s Guild of Valenford",
  status: "Pending",
  admin_notes: "",
};

const rankOptions = ["Initiate", "Seeker", "Warden", "Arbiter", "High Council"];
const pathwayOptions = ["Warrior", "Mystic", "Shadow", "Nature"];
const statusOptions = ["Pending", "Active", "Rejected", "Suspended", "Archived"];

function buildIdCard(character) {
  return `╔══════════════════════╗
       LUNARIA ID CARD
╚══════════════════════╝

Player Name: ${character.player_name}
Character Name: ${character.character_name}
Race: ${character.race}

Guild Rank: ${character.guild_rank}
Pathway: ${character.pathway}

Primary Skills:
1. ${character.skill_1_name}
   ${character.skill_1_description}

2. ${character.skill_2_name}
   ${character.skill_2_description}

Inventory:
${character.inventory || "-"}

Currency:
${character.gold || 0}G / ${character.silver || 0}S / ${character.bronze || 0}B

Registered Guild:
${character.registered_guild}

Status: ${character.status}`;
}

export default function AdminCharactersPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [rankFilter, setRankFilter] = useState("All");
  const [pathwayFilter, setPathwayFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredCharacters = characters.filter((character) => {
    const keyword = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !keyword ||
      character.player_name?.toLowerCase().includes(keyword) ||
      character.character_name?.toLowerCase().includes(keyword) ||
      character.race?.toLowerCase().includes(keyword) ||
      character.guild_rank?.toLowerCase().includes(keyword) ||
      character.pathway?.toLowerCase().includes(keyword) ||
      character.status?.toLowerCase().includes(keyword);

    const matchesRank = rankFilter === "All" || character.guild_rank === rankFilter;
    const matchesPathway = pathwayFilter === "All" || character.pathway === pathwayFilter;
    const matchesStatus = statusFilter === "All" || character.status === statusFilter;

    return matchesSearch && matchesRank && matchesPathway && matchesStatus;
  });

  async function loadCharacters(currentPassword = password) {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/characters", {
      headers: {
        "x-admin-password": currentPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal memuat characters.");
      setLoading(false);
      return;
    }

    setCharacters(result.characters || []);
    setLoading(false);
  }

  useEffect(() => {
    const savedPassword = window.localStorage.getItem("lunaria_admin_password");

    if (savedPassword === ADMIN_PASSWORD) {
      setPassword(savedPassword);
      setUnlocked(true);
      loadCharacters(savedPassword);
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
      await loadCharacters(password);
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

  function startEdit(character) {
    setEditingId(character.id);
    setMessage("");

    setForm({
      player_name: character.player_name || "",
      character_name: character.character_name || "",
      race: character.race || "",
      guild_rank: character.guild_rank || "Initiate",
      pathway: character.pathway || "Warrior",
      skill_1_name: character.skill_1_name || "",
      skill_1_description: character.skill_1_description || "",
      skill_2_name: character.skill_2_name || "",
      skill_2_description: character.skill_2_description || "",
      inventory: character.inventory || "",
      gold: character.gold || 0,
      silver: character.silver || 0,
      bronze: character.bronze || 0,
      registered_guild: character.registered_guild || "Adventurer’s Guild of Valenford",
      status: character.status || "Pending",
      admin_notes: character.admin_notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
  }

  function clearFilters() {
    setSearchQuery("");
    setRankFilter("All");
    setPathwayFilter("All");
    setStatusFilter("All");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const method = editingId ? "PATCH" : "POST";

    const response = await fetch("/api/admin/characters", {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal menyimpan character.");
      setLoading(false);
      return;
    }

    setMessage(editingId ? "Character berhasil diupdate." : "Character berhasil ditambahkan.");
    setEditingId(null);
    setForm(initialForm);
    await loadCharacters();
  }

  async function deleteCharacter(character) {
    const confirmed = window.confirm(`Hapus character "${character.character_name}"?`);
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/characters", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id: character.id }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal menghapus character.");
      setLoading(false);
      return;
    }

    if (editingId === character.id) {
      cancelEdit();
    }

    setMessage(`Character "${character.character_name}" berhasil dihapus.`);
    await loadCharacters();
  }

  async function copyIdCard(character) {
    const text = buildIdCard(character);
    await navigator.clipboard.writeText(text);
    setMessage(`ID Card "${character.character_name}" berhasil disalin.`);
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Character Admin</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/economy">Economy System</Link>
          <Link href="/rules">Rules & Guide</Link>
          <Link href="/admin">Admin Dashboard</Link>
          <Link href="/admin/quests">Quest Admin</Link>
          <Link href="/admin/economy">Economy Admin</Link>
          <Link href="/admin/rules">Rules Admin</Link>
          <Link href="/admin/characters">Character Admin</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>CHARACTER ADMIN</h1>
          <p>Kelola character registration, status karakter, currency, inventory, dan ID Card Lunaria.</p>
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
                Unlock Character Admin
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
                <h2>{editingId ? "Edit Character" : "Create Character"}</h2>

                {editingId && (
                  <button className="admin-secondary" type="button" onClick={cancelEdit}>
                    Cancel Edit
                  </button>
                )}
              </div>

              <form className="admin-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    Player Name
                    <input
                      value={form.player_name}
                      onChange={(e) => updateField("player_name", e.target.value)}
                      placeholder="Nama player"
                      required
                    />
                  </label>

                  <label>
                    Character Name
                    <input
                      value={form.character_name}
                      onChange={(e) => updateField("character_name", e.target.value)}
                      placeholder="Nama karakter"
                      required
                    />
                  </label>

                  <label>
                    Race
                    <input
                      value={form.race}
                      onChange={(e) => updateField("race", e.target.value)}
                      placeholder="Contoh: Human, Elf, Nekojin"
                      required
                    />
                  </label>

                  <label>
                    Guild Rank
                    <select value={form.guild_rank} onChange={(e) => updateField("guild_rank", e.target.value)}>
                      {rankOptions.map((rank) => (
                        <option key={rank}>{rank}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Pathway
                    <select value={form.pathway} onChange={(e) => updateField("pathway", e.target.value)}>
                      {pathwayOptions.map((pathway) => (
                        <option key={pathway}>{pathway}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Status
                    <select value={form.status} onChange={(e) => updateField("status", e.target.value)}>
                      {statusOptions.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    Skill 1 Name
                    <input
                      value={form.skill_1_name}
                      onChange={(e) => updateField("skill_1_name", e.target.value)}
                      placeholder="Nama skill 1"
                      required
                    />
                  </label>

                  <label>
                    Skill 2 Name
                    <input
                      value={form.skill_2_name}
                      onChange={(e) => updateField("skill_2_name", e.target.value)}
                      placeholder="Nama skill 2"
                      required
                    />
                  </label>
                </div>

                <label>
                  Skill 1 Description
                  <textarea
                    value={form.skill_1_description}
                    onChange={(e) => updateField("skill_1_description", e.target.value)}
                    placeholder="Deskripsi skill 1..."
                    rows="4"
                    required
                  />
                </label>

                <label>
                  Skill 2 Description
                  <textarea
                    value={form.skill_2_description}
                    onChange={(e) => updateField("skill_2_description", e.target.value)}
                    placeholder="Deskripsi skill 2..."
                    rows="4"
                    required
                  />
                </label>

                <label>
                  Inventory
                  <textarea
                    value={form.inventory}
                    onChange={(e) => updateField("inventory", e.target.value)}
                    placeholder="Contoh: • Small Bag&#10;• Lantern&#10;• Rope 10m"
                    rows="4"
                  />
                </label>

                <div className="form-grid">
                  <label>
                    Gold
                    <input
                      type="number"
                      min="0"
                      value={form.gold}
                      onChange={(e) => updateField("gold", e.target.value)}
                    />
                  </label>

                  <label>
                    Silver
                    <input
                      type="number"
                      min="0"
                      value={form.silver}
                      onChange={(e) => updateField("silver", e.target.value)}
                    />
                  </label>

                  <label>
                    Bronze
                    <input
                      type="number"
                      min="0"
                      value={form.bronze}
                      onChange={(e) => updateField("bronze", e.target.value)}
                    />
                  </label>
                </div>

                <label>
                  Registered Guild
                  <input
                    value={form.registered_guild}
                    onChange={(e) => updateField("registered_guild", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Admin Notes
                  <textarea
                    value={form.admin_notes}
                    onChange={(e) => updateField("admin_notes", e.target.value)}
                    placeholder="Catatan admin..."
                    rows="3"
                  />
                </label>

                <button className="admin-submit" type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update Character" : "Save Character"}
                </button>

                {message && <p className="admin-message">{message}</p>}
              </form>
            </section>

            <section className="section">
              <div className="admin-section-header">
                <h2>Manage Characters</h2>

                <button
                  className="admin-secondary"
                  type="button"
                  onClick={() => loadCharacters()}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh List"}
                </button>
              </div>

              <div className="admin-filter-panel">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player, character, race, rank, pathway, or status..."
                />

                <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)}>
                  <option>All</option>
                  {rankOptions.map((rank) => (
                    <option key={rank}>{rank}</option>
                  ))}
                </select>

                <select value={pathwayFilter} onChange={(e) => setPathwayFilter(e.target.value)}>
                  <option>All</option>
                  {pathwayOptions.map((pathway) => (
                    <option key={pathway}>{pathway}</option>
                  ))}
                </select>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option>All</option>
                  {statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>

                <button className="admin-secondary" type="button" onClick={clearFilters}>
                  Clear Filter
                </button>
              </div>

              <p className="muted">
                Showing {filteredCharacters.length} of {characters.length} characters.
              </p>

              <div className="admin-list">
                {filteredCharacters.length === 0 ? (
                  <p className="muted">Tidak ada character yang cocok dengan filter.</p>
                ) : (
                  filteredCharacters.map((character) => (
                    <div className="admin-list-item" key={character.id}>
                      <div>
                        <strong>{character.character_name}</strong>
                        <p>
                          {character.player_name} • {character.race} • {character.guild_rank} • {character.pathway} • {character.status}
                        </p>
                      </div>

                      <div className="admin-actions">
                        <button
                          className="admin-secondary"
                          type="button"
                          onClick={() => copyIdCard(character)}
                          disabled={loading}
                        >
                          Copy ID
                        </button>

                        <button
                          className="admin-secondary"
                          type="button"
                          onClick={() => startEdit(character)}
                          disabled={loading}
                        >
                          Edit
                        </button>

                        <button
                          className="admin-danger"
                          type="button"
                          onClick={() => deleteCharacter(character)}
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
