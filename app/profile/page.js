"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const initialProfile = {
  bio: "",
  age: "",
  appearance: "",
  personality: "",
  quote: "",
  backstory: "",
};

export default function ProfilePage() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCharacters() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/characters");
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Gagal memuat character.");
        return;
      }

      const activeCharacters = (result.characters || result.data || []).filter(
        (character) => (character.status || "").toLowerCase() === "active"
      );

      setCharacters(activeCharacters);

      if (activeCharacters.length) {
        setSelectedCharacterId(activeCharacters[0].id);
      }
    } catch (error) {
      setMessage(error.message || "Gagal memuat character.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile(characterId) {
    if (!characterId) return;

    setMessage("");

    try {
      const response = await fetch(`/api/profile?character_id=${encodeURIComponent(characterId)}`);
      const result = await response.json();

      if (!response.ok) {
        setProfile(initialProfile);
        return;
      }

      setProfile({
        bio: result.profile?.bio || "",
        age: result.profile?.age || "",
        appearance: result.profile?.appearance || "",
        personality: result.profile?.personality || "",
        quote: result.profile?.quote || "",
        backstory: result.profile?.backstory || "",
      });
    } catch {
      setProfile(initialProfile);
    }
  }

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    loadProfile(selectedCharacterId);
  }, [selectedCharacterId]);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  function updateProfile(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!selectedCharacterId) {
      window.alert("Pilih character dulu.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          character_id: selectedCharacterId,
          ...profile,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Gagal menyimpan profile.");
        return;
      }

      setMessage("Profile berhasil disimpan.");
    } catch (error) {
      setMessage(error.message || "Gagal menyimpan profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="portal-home">
      <section className="portal-hero">
        <p className="eyebrow">LUNARIA CHARACTER PROFILE</p>
        <h1>PROFILE</h1>
        <p className="hero-copy">
          Halaman identitas personal karakter. Data resmi seperti rank, pathway,
          currency, dan quest tetap dikontrol admin.
        </p>

        <div className="shop-actions">
          <Link className="admin-secondary" href="/">
            Back to Home
          </Link>
          <Link className="admin-secondary" href="/id-card">
            ID Card
          </Link>
        </div>
      </section>

      <section className="portal-section">
        <p className="eyebrow">CHARACTER SELECTOR</p>
        <h2>Choose Character</h2>

        {loading ? (
          <p className="muted">Memuat character...</p>
        ) : characters.length ? (
          <>
            <label className="shop-label">
              Character
              <select
                value={selectedCharacterId}
                onChange={(event) => setSelectedCharacterId(event.target.value)}
              >
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.character_name} — {character.player_name}
                  </option>
                ))}
              </select>
            </label>

            {selectedCharacter && (
              <div className="profile-display-card">
                <div className="profile-avatar-placeholder">
                  {selectedCharacter.character_name?.slice(0, 1) || "L"}
                </div>

                <div>
                  <p className="eyebrow">Selected Character</p>
                  <h2>{selectedCharacter.character_name}</h2>
                  <p className="muted">
                    {selectedCharacter.guild_rank || "Unranked"} • {selectedCharacter.race || "-"} • {selectedCharacter.pathway || "-"} • {selectedCharacter.status || "-"}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="muted">Belum ada character aktif.</p>
        )}

        {message && <p className="shop-message">{message}</p>}
      </section>

      {selectedCharacter && (
        <section className="portal-section">
          <p className="eyebrow">PROFILE EDITOR</p>
          <h2>Character Lore</h2>

          <form className="profile-form" onSubmit={saveProfile}>
            <label className="shop-label">
              Quote
              <input
                value={profile.quote}
                onChange={(event) => updateProfile("quote", event.target.value)}
                placeholder="Contoh: I walk where moonlight refuses to follow."
              />
            </label>

            <label className="shop-label">
              Age
              <input
                value={profile.age}
                onChange={(event) => updateProfile("age", event.target.value)}
                placeholder="Contoh: 19"
              />
            </label>

            <label className="shop-label">
              Bio
              <textarea
                value={profile.bio}
                onChange={(event) => updateProfile("bio", event.target.value)}
                placeholder="Bio singkat karakter."
              />
            </label>

            <label className="shop-label">
              Appearance
              <textarea
                value={profile.appearance}
                onChange={(event) => updateProfile("appearance", event.target.value)}
                placeholder="Deskripsi penampilan karakter."
              />
            </label>

            <label className="shop-label">
              Personality
              <textarea
                value={profile.personality}
                onChange={(event) => updateProfile("personality", event.target.value)}
                placeholder="Sifat, cara bicara, kebiasaan."
              />
            </label>

            <label className="shop-label">
              Backstory
              <textarea
                value={profile.backstory}
                onChange={(event) => updateProfile("backstory", event.target.value)}
                placeholder="Backstory ringkas karakter."
              />
            </label>

            <button className="admin-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
