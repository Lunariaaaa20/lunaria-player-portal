"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const initialForm = {
  quest_application_id: "",
  result_summary: "",
  proof_link: "",
  injury_report: "",
  loot_claim: "",
};

export default function QuestReportPage() {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function loadApprovedApplications() {
    setLoadingApplications(true);
    setMessage("");

    const response = await fetch("/api/quest-applications/approved");
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal memuat approved quest applications.");
      setLoadingApplications(false);
      return;
    }

    setApplications(result.applications || []);
    setLoadingApplications(false);
  }

  useEffect(() => {
    loadApprovedApplications();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "quest_application_id") {
      const application = applications.find((item) => item.id === value) || null;
      setSelectedApplication(application);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    const response = await fetch("/api/quest-reports/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Quest report failed.");
      setLoading(false);
      return;
    }

    setMessage("Laporan quest berhasil dikirim dari Approved Quest. Tunggu review admin.");
    setSuccess(true);
    setForm(initialForm);
    setSelectedApplication(null);
    setLoading(false);
    await loadApprovedApplications();
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Quest Report</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/registration">Character Registration</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/quest-report">Quest Report</Link>
          <Link href="/economy">Economy System</Link>
          <Link href="/rules">Rules & Guide</Link>
          <Link href="/admin">Admin Panel</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>QUEST REPORT</h1>
          <p>
            Laporkan quest yang sudah di-approve admin. Data quest dan karakter otomatis
            diambil dari Take Quest Application.
          </p>
        </section>

        <section className="section">
          <div className="admin-section-header">
            <h2>Report Form</h2>

            <button
              className="admin-secondary"
              type="button"
              onClick={loadApprovedApplications}
              disabled={loadingApplications}
            >
              {loadingApplications ? "Loading..." : "Refresh Approved Quest"}
            </button>
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              Approved Quest
              <select
                value={form.quest_application_id}
                onChange={(e) => updateField("quest_application_id", e.target.value)}
                required
              >
                <option value="">Select Approved / Ongoing Quest</option>
                {applications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.quest_title} — {application.character_name} — {application.quest_rank} — {application.quest_mode}
                  </option>
                ))}
              </select>
            </label>

            {selectedApplication && (
              <div className="auto-report-preview">
                <strong>Auto-Filled Quest Data</strong>

                <div className="registry-meta">
                  <div>
                    <strong>Player</strong>
                    <span>{selectedApplication.player_name}</span>
                  </div>
                  <div>
                    <strong>Character</strong>
                    <span>{selectedApplication.character_name}</span>
                  </div>
                  <div>
                    <strong>Quest Title</strong>
                    <span>{selectedApplication.quest_title}</span>
                  </div>
                  <div>
                    <strong>Rank / Mode</strong>
                    <span>
                      {selectedApplication.quest_rank} / {selectedApplication.quest_mode}
                    </span>
                  </div>
                  <div>
                    <strong>Location</strong>
                    <span>{selectedApplication.quest_location || "-"}</span>
                  </div>
                  <div>
                    <strong>Application Status</strong>
                    <span>{selectedApplication.status}</span>
                  </div>
                </div>
              </div>
            )}

            <label>
              Result Summary
              <textarea
                value={form.result_summary}
                onChange={(e) => updateField("result_summary", e.target.value)}
                placeholder="Isi hasil akhir quest: objective selesai/gagal, kejadian penting, keputusan party, dan konsekuensi RP."
                rows="6"
                required
              />
            </label>

            <label>
              Injury / Condition Report
              <textarea
                value={form.injury_report}
                onChange={(e) => updateField("injury_report", e.target.value)}
                placeholder="Isi kondisi karakter setelah quest: luka, stamina, racun, trauma, item rusak, atau efek lain."
                rows="4"
              />
            </label>

            <label>
              Proof Link / Evidence
              <input
                value={form.proof_link}
                onChange={(e) => updateField("proof_link", e.target.value)}
                placeholder="Link screenshot, chat log, atau bukti RP jika ada"
              />
            </label>

            <label>
              Loot Claim
              <textarea
                value={form.loot_claim}
                onChange={(e) => updateField("loot_claim", e.target.value)}
                placeholder="Tulis loot yang diklaim dari quest. Admin tetap menentukan reward final."
                rows="4"
              />
            </label>

            <div className="registration-note">
              <strong>Quest Report Rule</strong>
              <p>
                Data quest dan karakter otomatis dari Take Quest yang sudah di-approve.
                Player hanya perlu mengisi hasil, bukti, kondisi, dan loot claim.
              </p>
            </div>

            <button className="admin-submit" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Quest Report"}
            </button>

            {message && (
              <p className={success ? "admin-message is-success" : "admin-message"}>
                {message}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
