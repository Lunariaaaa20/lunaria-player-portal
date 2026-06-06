"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "lunaria-admin";

const statusOptions = [
  "Pending Review",
  "Approved",
  "Rejected",
  "Needs Revision",
  "Archived",
];

const rankOptions = ["Common", "Uncommon", "Dangerous", "Special"];
const modeOptions = ["Solo", "Duo", "Party"];

export default function AdminReportsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [rankFilter, setRankFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");

  const [notesById, setNotesById] = useState({});

  const filteredReports = reports.filter((report) => {
    const keyword = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !keyword ||
      report.player_name?.toLowerCase().includes(keyword) ||
      report.character_name?.toLowerCase().includes(keyword) ||
      report.quest_title?.toLowerCase().includes(keyword) ||
      report.quest_location?.toLowerCase().includes(keyword) ||
      report.status?.toLowerCase().includes(keyword);

    const matchesStatus = statusFilter === "All" || report.status === statusFilter;
    const matchesRank = rankFilter === "All" || report.quest_rank === rankFilter;
    const matchesMode = modeFilter === "All" || report.quest_mode === modeFilter;

    return matchesSearch && matchesStatus && matchesRank && matchesMode;
  });

  async function loadReports(currentPassword = password) {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/reports", {
      headers: {
        "x-admin-password": currentPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal memuat quest reports.");
      setLoading(false);
      return;
    }

    setReports(result.reports || []);

    const nextNotes = {};
    for (const report of result.reports || []) {
      nextNotes[report.id] = report.admin_notes || "";
    }
    setNotesById(nextNotes);

    setLoading(false);
  }

  useEffect(() => {
    const savedPassword = window.localStorage.getItem("lunaria_admin_password");

    if (savedPassword === ADMIN_PASSWORD) {
      setPassword(savedPassword);
      setUnlocked(true);
      loadReports(savedPassword);
    }
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem("lunaria_admin_password", password);
      setUnlocked(true);
      setLoginMessage("");
      await loadReports(password);
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

  function updateNote(reportId, value) {
    setNotesById((current) => ({
      ...current,
      [reportId]: value,
    }));
  }

  async function updateReportStatus(report, nextStatus) {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        id: report.id,
        status: nextStatus,
        admin_notes: notesById[report.id] || "",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal update report.");
      setLoading(false);
      return;
    }

    setMessage(`Report "${report.quest_title}" diupdate menjadi ${nextStatus}.`);
    await loadReports();
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Reports Admin</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/registration">Character Registration</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/quest-report">Quest Report</Link>
          <Link href="/economy">Economy System</Link>
          <Link href="/rules">Rules & Guide</Link>
          <Link href="/admin">Admin Dashboard</Link>
          <Link href="/admin/characters">Character Admin</Link>
          <Link href="/admin/reports">Reports Admin</Link>
          <Link href="/admin/quests">Quest Admin</Link>
          <Link href="/admin/economy">Economy Admin</Link>
          <Link href="/admin/rules">Rules Admin</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>QUEST REPORT ADMIN</h1>
          <p>
            Review laporan quest player, validasi hasil RP, dan tentukan status laporan.
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
                Unlock Reports Admin
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
                <h2>Manage Quest Reports</h2>

                <button
                  className="admin-secondary"
                  type="button"
                  onClick={() => loadReports()}
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
                Showing {filteredReports.length} of {reports.length} reports.
              </p>

              <div className="report-list">
                {filteredReports.length === 0 ? (
                  <p className="muted">Belum ada report yang cocok dengan filter.</p>
                ) : (
                  filteredReports.map((report) => (
                    <article className="report-card" key={report.id}>
                      <div className="report-card-header">
                        <div>
                          <h3>{report.quest_title}</h3>
                          <p>
                            {report.character_name} • {report.player_name}
                          </p>
                        </div>

                        <span>{report.status}</span>
                      </div>

                      <div className="registry-meta">
                        <div>
                          <strong>Rank</strong>
                          <span>{report.quest_rank}</span>
                        </div>
                        <div>
                          <strong>Mode</strong>
                          <span>{report.quest_mode}</span>
                        </div>
                        <div>
                          <strong>Location</strong>
                          <span>{report.quest_location || "-"}</span>
                        </div>
                        <div>
                          <strong>Submitted</strong>
                          <span>
                            {report.submitted_at
                              ? new Date(report.submitted_at).toLocaleString()
                              : "-"}
                          </span>
                        </div>
                      </div>

                      <div className="report-block">
                        <strong>Result Summary</strong>
                        <p>{report.result_summary}</p>
                      </div>

                      <div className="report-block">
                        <strong>Proof Link / Evidence</strong>
                        <p>{report.proof_link || "-"}</p>
                      </div>

                      <div className="report-block">
                        <strong>Reward Request</strong>
                        <p>{report.reward_request || "-"}</p>
                      </div>

                      <label className="report-note-field">
                        Admin Notes
                        <textarea
                          value={notesById[report.id] || ""}
                          onChange={(e) => updateNote(report.id, e.target.value)}
                          rows="3"
                          placeholder="Catatan review admin..."
                        />
                      </label>

                      <div className="admin-actions report-actions">
                        <button
                          className="admin-secondary"
                          type="button"
                          onClick={() => updateReportStatus(report, "Approved")}
                          disabled={loading}
                        >
                          Approve
                        </button>

                        <button
                          className="admin-secondary"
                          type="button"
                          onClick={() => updateReportStatus(report, "Needs Revision")}
                          disabled={loading}
                        >
                          Needs Revision
                        </button>

                        <button
                          className="admin-danger"
                          type="button"
                          onClick={() => updateReportStatus(report, "Rejected")}
                          disabled={loading}
                        >
                          Reject
                        </button>

                        <button
                          className="admin-danger"
                          type="button"
                          onClick={() => updateReportStatus(report, "Archived")}
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
