"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildIdCard } from "../../lib/idCard";

export default function IdCardPage() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadCharacters();
  }, []);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  const idCardText = selectedCharacter ? buildIdCard(selectedCharacter) : "";

  async function copyIdCard() {
    if (!idCardText) return;

    await navigator.clipboard.writeText(idCardText);
    setMessage(`ID Card ${selectedCharacter.character_name || "-"} berhasil disalin.`);
  }

  return (
    <main className="portal-home">
      <section className="portal-hero">
        <p className="eyebrow">LUNARIA OFFICIAL IDENTIFICATION</p>
        <h1>ID CARD</h1>
        <p className="hero-copy">
          Lihat dan salin ID Card resmi karakter aktif Lunaria untuk digunakan di roleplay,
          laporan quest, dan administrasi guild.
        </p>

        <div className="shop-actions">
          <Link className="admin-secondary" href="/">
            Back to Home
          </Link>
          <Link className="admin-secondary" href="/registry">
            Adventurer Registry
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
              <div className={`id-card-preview-shell ${selectedCharacter.equipped_border_class || ""}`}>
                <div className="id-card-preview-header">
                  <div>
                    <p className="eyebrow">ACTIVE ID CARD</p>
                    <h2 className={selectedCharacter.equipped_effect_class || ""}>
                      {selectedCharacter.character_name}
                    </h2>
                  </div>

                  <button className="admin-primary" onClick={copyIdCard}>
                    Copy ID Card
                  </button>
                </div>

                <pre className="id-card-preview">{idCardText}</pre>
              </div>
            )}
          </>
        ) : (
          <p className="muted">Belum ada character aktif.</p>
        )}

        {message && <p className="shop-message">{message}</p>}
      </section>
    </main>
  );
}
