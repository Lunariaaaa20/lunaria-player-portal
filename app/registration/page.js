"use client";

import Link from "next/link";
import { useState } from "react";

const initialForm = {
  player_name: "",
  character_name: "",
  race: "",
  pathway: "Warrior",
  skill_1_name: "",
  skill_1_description: "",
  skill_2_name: "",
  skill_2_description: "",
  inventory: "",
};

const pathwayOptions = ["Warrior", "Mystic", "Shadow", "Nature"];

export default function CharacterRegistrationPage() {
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

    const response = await fetch("/api/characters/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Registration failed.");
      setLoading(false);
      return;
    }

    setMessage("Registrasi karakter berhasil dikirim. Tunggu approval admin.");
    setSuccess(true);
    setForm(initialForm);
    setLoading(false);
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Character Registration</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/registration">Character Registration</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/profile">Character Profile</Link>
          <Link href="/id-card">ID Card</Link>
          <Link href="/cosmetic-shop">Cosmetic Shop</Link>
<Link href="/admin">Admin Panel</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>CHARACTER REGISTRATION</h1>
          <p>
            Daftarkan karakter baru Lunaria. Semua pendaftaran masuk sebagai Pending
            dan harus disetujui admin sebelum tampil di Adventurer Registry.
          </p>
        </section>

        <section className="section">
          <h2>Registration Form</h2>

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
                Race
                <input
                  value={form.race}
                  onChange={(e) => updateField("race", e.target.value)}
                  placeholder="Contoh: Human, Elf, Nekojin"
                  required
                />
              </label>

              <label>
                Pathway
                <select
                  value={form.pathway}
                  onChange={(e) => updateField("pathway", e.target.value)}
                >
                  {pathwayOptions.map((pathway) => (
                    <option key={pathway}>{pathway}</option>
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
                  placeholder="Nama skill pertama"
                  required
                />
              </label>

              <label>
                Skill 2 Name
                <input
                  value={form.skill_2_name}
                  onChange={(e) => updateField("skill_2_name", e.target.value)}
                  placeholder="Nama skill kedua"
                  required
                />
              </label>
            </div>

            <label>
              Skill 1 Description
              <textarea
                value={form.skill_1_description}
                onChange={(e) => updateField("skill_1_description", e.target.value)}
                placeholder="Jelaskan efek, durasi, batasan, cooldown, dan risiko skill pertama..."
                rows="5"
                required
              />
            </label>

            <label>
              Skill 2 Description
              <textarea
                value={form.skill_2_description}
                onChange={(e) => updateField("skill_2_description", e.target.value)}
                placeholder="Jelaskan efek, durasi, batasan, cooldown, dan risiko skill kedua..."
                rows="5"
                required
              />
            </label>

            <label>
              Starting Inventory
              <textarea
                value={form.inventory}
                onChange={(e) => updateField("inventory", e.target.value)}
                placeholder="Opsional. Contoh: • Small Bag&#10;• Simple Dagger&#10;• Water Flask"
                rows="4"
              />
            </label>

            <div className="registration-note">
              <strong>Default Registration Rule</strong>
              <p>
                Karakter baru otomatis masuk sebagai Initiate, currency 0G / 0S / 0B,
                dan status Pending sampai admin melakukan approval.
              </p>
            </div>

            <button className="admin-submit" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Character Registration"}
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
