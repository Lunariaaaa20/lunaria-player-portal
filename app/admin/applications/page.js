"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "lunaria-admin";

const statusOptions = [
  "Pending Approval",
  "Approved",
  "Rejected",
  "Ongoing",
  "Completed",
  "Archived",
];

const rankOptions = ["Common", "Uncommon", "Dangerous", "Special"];
const modeOptions = ["Solo", "Duo", "Party"];

export default function AdminApplicationsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [rankFilter, setRankFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");

  const [notesById, setNotesById] = useState({});

  const filteredApplications = applications.filter((application) => {
    const keyword = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !keyword ||
      application.player_name?.toLowerCase().includes(keyword) ||
      application.character_name?.toLowerCase().includes(keyword) ||
      application.quest_title?.toLowerCase().includes(keyword) ||
      application.quest_location?.toLowerCase().includes(keyword) ||
      application.status?.toLowerCase().includes(keyword);

    const matchesStatus = statusFilter === "All" || application.status === statusFilter;
    const matchesRank = rankFilter === "All" || application.quest_rank === rankFilter;
    const matchesMode = modeFilter === "All" || application.quest_mode === modeFilter;

    return matchesSearch && matchesStatus && matchesRank && matchesMode;
  });

  async function loadApplications(currentPassword = password) {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/applications", {
      headers: {
        "x-admin-password": currentPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal memuat quest applications.");
      setLoading(false);
      return;
    }

    setApplications(result.applications || []);

    const nextNotes = {};
    for (const application of result.applications || []) {
      nextNotes[application.id] = application.admin_notes || "";
    }
    setNotesById(nextNotes);

    setLoading(false);
  }

  useEffect(() => {
    const savedPassword = window.localStorage.getItem("lunaria_admin_password");

    if (savedPassword === ADMIN_PASSWORD) {
      setPassword(savedPassword);
      setUnlocked(true);
      loadApplications(savedPassword);
    }
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem("lunaria_admin_password", password);
      setUnlocked(true);
      setLoginMessage("");
      await loadApplications(password);
      return;
    }

    setLoginMessage("Password salah.");
  }

  function logoutAdmin() {
    window.localStorage.removeItem("lunaria_admin_password");
    setUnlocked(false);
    setPassword("");
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("All");
    setRankFilter("All");
    setModeFilter("All");
  }

  function updateNote(applicationId, value) {
    setNotesById((current) => ({
      ...current,
      [applicationId]: value,
    }));
  }

  async function updateApplicationStatus(application, nextStatus) {
    const confirmed = window.confirm(
      `Ubah application "${application.quest_title}" menjadi ${nextStatus}?`
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        id: application.id,
        status: nextStatus,
        admin_notes: notesById[application.id] || "",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error || "Gagal update application.";
      setMessage(errorMessage);
      window.alert(errorMessage);
      setLoading(false);
      return;
    }

    const successMessage = `Application "${application.quest_title}" diupdate menjadi ${nextStatus}.`;
    setMessage(successMessage);
    window.alert(successMessage);

    await loadApplications();
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Applications Admin</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/registration">Character Registration</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/profile">Character Profile</Link>
          <Link href="/id-card">ID Card</Link>
          <Link href="/cosmetic-shop">Cosmetic Shop</Link>
<Link href="/admin">Admin Dashboard</Link>
          <Link href="/admin/characters">Character Admin</Link>
          <Link href="/admin/applications">Applications Admin</Link>
</nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>QUEST APPLICATION ADMIN</h1>
          <p>
            Review request Take Quest player sebelum quest boleh dijalankan.
          </p>
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
                Unlock Applications Admin
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
                <h2>Manage Quest Applications</h2>

                <button
                  className="admin-secondary"
                  type="button"
                  onClick={() => loadApplications()}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh List"}
                </button>
              </div>

              <div className="admin-filter-panel">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player, character, quest, location, or status..."
                />

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option>All</option>
                  {statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>

                <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)}>
                  <option>All</option>
                  {rankOptions.map((rank) => (
                    <option key={rank}>{rank}</option>
                  ))}
                </select>

                <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
                  <option>All</option>
                  {modeOptions.map((mode) => (
                    <option key={mode}>{mode}</option>
                  ))}
                </select>

                <button className="admin-secondary" type="button" onClick={clearFilters}>
                  Clear Filter
                </button>
              </div>

              {message && <p className="admin-message">{message}</p>}

              <p className="muted">
                Showing {filteredApplications.length} of {applications.length} applications.
              </p>

              <div className="report-list">
                {filteredApplications.length === 0 ? (
                  <p className="muted">Belum ada quest application yang cocok dengan filter.</p>
                ) : (
                  filteredApplications.map((application) => (
                    <article className="report-card" key={application.id}>
                      <div className="report-card-header">
                        <div>
                          <h3>{application.quest_title}</h3>
                          <p>
                            {application.character_name} • {application.player_name}
                          </p>
                        </div>

                        <span>{application.status}</span>
                      </div>

                      <div className="registry-meta">
                        <div>
                          <strong>Character Rank</strong>
                          <span>{application.character_rank}</span>
                        </div>
                        <div>
                          <strong>Quest Rank</strong>
                          <span>{application.quest_rank}</span>
                        </div>
                        <div>
                          <strong>Mode</strong>
                          <span>{application.quest_mode}</span>
                        </div>
                        <div>
                          <strong>Location</strong>
                          <span>{application.quest_location || "-"}</span>
                        </div>
                      </div>

                      <div className="report-block">
                        <strong>Party Members</strong>
                        <p>{application.party_members || "-"}</p>
                      </div>

                      <div className="report-block">
                        <strong>Application Note</strong>
                        <p>{application.application_note || "-"}</p>
                      </div>

                      <label className="report-note-field">
                        Admin Notes
                        <textarea
                          value={notesById[application.id] || ""}
                          onChange={(e) => updateNote(application.id, e.target.value)}
                          rows="3"
                          placeholder="Catatan approval admin..."
                        />
                      </label>

                      <div className="admin-actions report-actions">
                        <button
                          className="admin-secondary"
                          type="button"
                          onClick={() => updateApplicationStatus(application, "Approved")}
                          disabled={loading}
                        >
                          Approve
                        </button>

                        <button
                          className="admin-secondary"
                          type="button"
                          onClick={() => updateApplicationStatus(application, "Ongoing")}
                          disabled={loading}
                        >
                          Set Ongoing
                        </button>

                        <button
                          className="admin-secondary"
                          type="button"
                          onClick={() => updateApplicationStatus(application, "Completed")}
                          disabled={loading}
                        >
                          Set Completed
                        </button>

                        <button
                          className="admin-danger"
                          type="button"
                          onClick={() => updateApplicationStatus(application, "Rejected")}
                          disabled={loading}
                        >
                          Reject
                        </button>

                        <button
                          className="admin-danger"
                          type="button"
                          onClick={() => updateApplicationStatus(application, "Archived")}
                          disabled={loading}
                        >
                          Archive
                        </button>
                      </div>
                    </article>
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
