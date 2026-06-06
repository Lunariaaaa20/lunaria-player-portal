"use client";

import Link from "next/link";
import { useState } from "react";

const initialForm = {
  player_name: "",
  character_name: "",
  quest_title: "",
  quest_rank: "Common",
  quest_mode: "Solo",
  quest_location: "",
  result_summary: "",
  proof_link: "",
  reward_request: "",
};

const rankOptions = ["Common", "Uncommon", "Dangerous", "Special"];
const modeOptions = ["Solo", "Duo", "Party"];

export default function QuestReportPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

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

    setMessage("Laporan quest berhasil dikirim. Tunggu review admin.");
    setSuccess(true);
    setForm(initialForm);
    setLoading(false);
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
            Laporkan quest yang sudah selesai. Laporan akan masuk sebagai Pending Review
            dan menunggu validasi admin.
          </p>
        </section>

        <section className="section">
          <h2>Report Form</h2>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Player Name
                <input
                  value={form.player_name}
                  onChange={(e) => updateField("player_name", e.target.value)}
                  placeholder="Nama player / nama WA"
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
                Quest Title
                <input
                  value={form.quest_title}
                  onChange={(e) => updateField("quest_title", e.target.value)}
                  placeholder="Contoh: Thornback Trail"
                  required
                />
              </label>

              <label>
                Quest Location
                <input
                  value={form.quest_location}
                  onChange={(e) => updateField("quest_location", e.target.value)}
                  placeholder="Contoh: Whispering Woods"
                />
              </label>

              <label>
                Quest Rank
                <select
                  value={form.quest_rank}
                  onChange={(e) => updateField("quest_rank", e.target.value)}
                >
                  {rankOptions.map((rank) => (
                    <option key={rank}>{rank}</option>
                  ))}
                </select>
              </label>

              <label>
                Quest Mode
                <select
                  value={form.quest_mode}
                  onChange={(e) => updateField("quest_mode", e.target.value)}
                >
                  {modeOptions.map((mode) => (
                    <option key={mode}>{mode}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Result Summary
              <textarea
                value={form.result_summary}
                onChange={(e) => updateField("result_summary", e.target.value)}
                placeholder="Ringkas hasil quest: berhasil/gagal, kejadian penting, luka/risiko, loot yang ditemukan, dan konsekuensi RP."
                rows="6"
                required
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
              Reward Request
              <textarea
                value={form.reward_request}
                onChange={(e) => updateField("reward_request", e.target.value)}
                placeholder="Opsional. Tulis reward/loot yang diklaim berdasarkan quest."
                rows="4"
              />
            </label>

            <div className="registration-note">
              <strong>Quest Report Rule</strong>
              <p>
                Laporan quest tidak otomatis memberi reward. Admin akan review hasil RP,
                validasi objective, lalu menentukan status laporan.
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
