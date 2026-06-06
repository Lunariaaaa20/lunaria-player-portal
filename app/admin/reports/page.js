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
const characterRankOptions = ["", "Initiate", "Seeker", "Warden", "Arbiter", "High Council"];

function parsePartyIds(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminReportsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [reports, setReports] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [rankFilter, setRankFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");

  const [notesById, setNotesById] = useState({});
  const [distributionById, setDistributionById] = useState({});

  const characterById = characters.reduce((acc, character) => {
    acc[character.id] = character;
    return acc;
  }, {});

  const applicationById = applications.reduce((acc, application) => {
    acc[application.id] = application;
    return acc;
  }, {});

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

  function buildDefaultDistribution(report, loadedCharacters = characters, loadedApplications = applications) {
    const loadedCharacterById = loadedCharacters.reduce((acc, character) => {
      acc[character.id] = character;
      return acc;
    }, {});

    const loadedApplicationById = loadedApplications.reduce((acc, application) => {
      acc[application.id] = application;
      return acc;
    }, {});

    if (Array.isArray(report.reward_distribution) && report.reward_distribution.length > 0) {
      return report.reward_distribution.map((entry) => ({
        character_id: entry.character_id || "",
        character_name: entry.character_name || loadedCharacterById[entry.character_id]?.character_name || "",
        gold: entry.gold || 0,
        silver: entry.silver || 0,
        bronze: entry.bronze || 0,
        inventory: entry.inventory || "",
        rank: entry.rank || "",
      }));
    }

    const application = loadedApplicationById[report.quest_application_id];
    const ids = [];

    if (report.character_id) ids.push(report.character_id);
    if (application?.character_id && !ids.includes(application.character_id)) {
      ids.push(application.character_id);
    }

    for (const partyId of parsePartyIds(application?.party_member_ids)) {
      if (!ids.includes(partyId)) ids.push(partyId);
    }

    if (ids.length === 0 && report.character_id) {
      ids.push(report.character_id);
    }

    return ids.map((id) => ({
      character_id: id,
      character_name: loadedCharacterById[id]?.character_name || "",
      gold: 0,
      silver: 0,
      bronze: 0,
      inventory: "",
      rank: "",
    }));
  }

  async function loadAll(currentPassword = password) {
    setLoading(true);
    setMessage("");

    const [reportsResponse, charactersResponse, applicationsResponse] = await Promise.all([
      fetch("/api/admin/reports", {
        headers: { "x-admin-password": currentPassword },
      }),
      fetch("/api/admin/characters", {
        headers: { "x-admin-password": currentPassword },
      }),
      fetch("/api/admin/applications", {
        headers: { "x-admin-password": currentPassword },
      }),
    ]);

    const reportsResult = await reportsResponse.json();
    const charactersResult = await charactersResponse.json();
    const applicationsResult = await applicationsResponse.json();

    if (!reportsResponse.ok) {
      setMessage(reportsResult.error || "Gagal memuat quest reports.");
      setLoading(false);
      return;
    }

    const nextReports = reportsResult.reports || [];
    const nextCharacters = charactersResponse.ok ? charactersResult.characters || [] : [];
    const nextApplications = applicationsResponse.ok ? applicationsResult.applications || [] : [];

    setReports(nextReports);
    setCharacters(nextCharacters);
    setApplications(nextApplications);

    const nextNotes = {};
    const nextDistribution = {};

    for (const report of nextReports) {
      nextNotes[report.id] = report.admin_notes || "";
      nextDistribution[report.id] = buildDefaultDistribution(report, nextCharacters, nextApplications);
    }

    setNotesById(nextNotes);
    setDistributionById(nextDistribution);
    setLoading(false);
  }

  useEffect(() => {
    const savedPassword = window.localStorage.getItem("lunaria_admin_password");

    if (savedPassword === ADMIN_PASSWORD) {
      setPassword(savedPassword);
      setUnlocked(true);
      loadAll(savedPassword);
    }
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem("lunaria_admin_password", password);
      setUnlocked(true);
      setLoginMessage("");
      await loadAll(password);
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

  function updateDistribution(reportId, index, field, value) {
    setDistributionById((current) => {
      const currentRows = current[reportId] || [];
      const nextRows = currentRows.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        if (field === "character_id") {
          return {
            ...row,
            character_id: value,
            character_name: characterById[value]?.character_name || "",
          };
        }

        return {
          ...row,
          [field]: value,
        };
      });

      return {
        ...current,
        [reportId]: nextRows,
      };
    });
  }

  function addDistributionRow(reportId) {
    setDistributionById((current) => ({
      ...current,
      [reportId]: [
        ...(current[reportId] || []),
        {
          character_id: "",
          character_name: "",
          gold: 0,
          silver: 0,
          bronze: 0,
          inventory: "",
          rank: "",
        },
      ],
    }));
  }

  function removeDistributionRow(reportId, index) {
    setDistributionById((current) => ({
      ...current,
      [reportId]: (current[reportId] || []).filter((_, rowIndex) => rowIndex !== index),
    }));
  }

  function getPartyDisplay(report) {
    const application = applicationById[report.quest_application_id];
    if (!application) return report.character_name || "-";

    const partyNames = parsePartyIds(application.party_member_ids)
      .map((id) => characterById[id]?.character_name)
      .filter(Boolean);

    return [application.character_name, ...partyNames].filter(Boolean).join(" + ");
  }

  async function updateReportStatus(report, nextStatus) {
    const distribution = distributionById[report.id] || [];

    if (nextStatus === "Approved") {
      const validRows = distribution.filter((row) => row.character_id);

      if (validRows.length === 0) {
        window.alert("Reward Distribution kosong. Pilih minimal 1 character target.");
        return;
      }

      const duplicateIds = validRows
        .map((row) => row.character_id)
        .filter((id, index, arr) => arr.indexOf(id) !== index);

      if (duplicateIds.length > 0) {
        window.alert("Ada Character Target yang dobel di Reward Distribution.");
        return;
      }
    }

    const confirmed = window.confirm(
      `Ubah status report "${report.quest_title}" menjadi ${nextStatus}?`
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const normalizedDistribution = distribution
      .filter((row) => row.character_id)
      .map((row) => ({
        character_id: row.character_id,
        character_name: row.character_name || characterById[row.character_id]?.character_name || "",
        gold: Number(row.gold || 0),
        silver: Number(row.silver || 0),
        bronze: Number(row.bronze || 0),
        inventory: row.inventory || "",
        rank: row.rank || "",
      }));

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
        reward_distribution: normalizedDistribution,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error || "Gagal update report.";
      setMessage(errorMessage);
      window.alert(errorMessage);
      setLoading(false);
      return;
    }

    const successMessage =
      nextStatus === "Approved"
        ? `Report "${report.quest_title}" approved. Reward Distribution sudah masuk ke ID Card.`
        : `Report "${report.quest_title}" diupdate menjadi ${nextStatus}.`;

    setMessage(successMessage);
    window.alert(successMessage);

    await loadAll();
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
          <Link href="/admin/applications">Applications Admin</Link>
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
            Review laporan quest, validasi hasil RP, dan approve reward langsung ke ID Card semua anggota.
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
                  onClick={() => loadAll()}
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
                  filteredReports.map((report) => {
                    const distribution = distributionById[report.id] || [];

                    return (
                      <article className="report-card" key={report.id}>
                        <div className="report-card-header">
                          <div>
                            <h3>{report.quest_title}</h3>
                            <p>{getPartyDisplay(report)}</p>
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
                          <strong>Injury / Condition Report</strong>
                          <p>{report.injury_report || report.condition_report || "-"}</p>
                        </div>

                        <div className="report-block">
                          <strong>Proof Link / Evidence</strong>
                          <p>{report.proof_link || "-"}</p>
                        </div>

                        <div className="report-block">
                          <strong>Loot Claim</strong>
                          <p>{report.loot_claim || report.reward_request || "-"}</p>
                        </div>

                        <div className="reward-distribution-panel">
                          <div className="admin-section-header">
                            <h4>Reward Distribution</h4>
                            <button
                              className="admin-secondary"
                              type="button"
                              onClick={() => addDistributionRow(report.id)}
                              disabled={report.status === "Approved"}
                            >
                              Add Character
                            </button>
                          </div>

                          {distribution.length === 0 ? (
                            <p className="muted">Belum ada character target.</p>
                          ) : (
                            distribution.map((row, index) => (
                              <div className="reward-row" key={`${report.id}-${index}`}>
                                <label>
                                  Character Target
                                  <select
                                    value={row.character_id || ""}
                                    onChange={(e) =>
                                      updateDistribution(report.id, index, "character_id", e.target.value)
                                    }
                                    disabled={report.status === "Approved"}
                                  >
                                    <option value="">Select Character</option>
                                    {characters.map((character) => (
                                      <option key={character.id} value={character.id}>
                                        {character.character_name} — {character.player_name} — {character.guild_rank}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label>
                                  Gold
                                  <input
                                    type="number"
                                    min="0"
                                    value={row.gold || 0}
                                    onChange={(e) =>
                                      updateDistribution(report.id, index, "gold", e.target.value)
                                    }
                                    disabled={report.status === "Approved"}
                                  />
                                </label>

                                <label>
                                  Silver
                                  <input
                                    type="number"
                                    min="0"
                                    value={row.silver || 0}
                                    onChange={(e) =>
                                      updateDistribution(report.id, index, "silver", e.target.value)
                                    }
                                    disabled={report.status === "Approved"}
                                  />
                                </label>

                                <label>
                                  Bronze
                                  <input
                                    type="number"
                                    min="0"
                                    value={row.bronze || 0}
                                    onChange={(e) =>
                                      updateDistribution(report.id, index, "bronze", e.target.value)
                                    }
                                    disabled={report.status === "Approved"}
                                  />
                                </label>

                                <label>
                                  Rank Update
                                  <select
                                    value={row.rank || ""}
                                    onChange={(e) =>
                                      updateDistribution(report.id, index, "rank", e.target.value)
                                    }
                                    disabled={report.status === "Approved"}
                                  >
                                    <option value="">No Change</option>
                                    {characterRankOptions.filter(Boolean).map((rank) => (
                                      <option key={rank}>{rank}</option>
                                    ))}
                                  </select>
                                </label>

                                <label className="reward-inventory-field">
                                  Inventory / Loot
                                  <textarea
                                    value={row.inventory || ""}
                                    onChange={(e) =>
                                      updateDistribution(report.id, index, "inventory", e.target.value)
                                    }
                                    rows="3"
                                    placeholder="Contoh: • Ember Horn Chip x1"
                                    disabled={report.status === "Approved"}
                                  />
                                </label>

                                <button
                                  className="admin-danger"
                                  type="button"
                                  onClick={() => removeDistributionRow(report.id, index)}
                                  disabled={report.status === "Approved"}
                                >
                                  Remove
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        <label className="report-note-field">
                          Admin Notes
                          <textarea
                            value={notesById[report.id] || ""}
                            onChange={(e) => updateNote(report.id, e.target.value)}
                            rows="3"
                            placeholder="Catatan review admin..."
                            disabled={report.status === "Approved"}
                          />
                        </label>

                        <div className="admin-actions report-actions">
                          <button
                            className="admin-secondary"
                            type="button"
                            onClick={() => updateReportStatus(report, "Approved")}
                            disabled={loading || report.status === "Approved"}
                          >
                            Approve + Apply Distribution
                          </button>

                          <button
                            className="admin-secondary"
                            type="button"
                            onClick={() => updateReportStatus(report, "Needs Revision")}
                            disabled={loading || report.status === "Approved"}
                          >
                            Needs Revision
                          </button>

                          <button
                            className="admin-danger"
                            type="button"
                            onClick={() => updateReportStatus(report, "Rejected")}
                            disabled={loading || report.status === "Approved"}
                          >
                            Reject
                          </button>

                          <button
                            className="admin-danger"
                            type="button"
                            onClick={() => updateReportStatus(report, "Archived")}
                            disabled={loading || report.status === "Approved"}
                          >
                            Archive
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
