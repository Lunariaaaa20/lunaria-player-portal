"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function formatCurrency(character) {
  if (!character) return "0B";

  const gold = Number(character.gold || 0);
  const silver = Number(character.silver || 0);
  const bronze = Number(character.bronze || 0);

  const parts = [];
  if (gold) parts.push(`${gold}G`);
  if (silver) parts.push(`${silver}S`);
  if (bronze) parts.push(`${bronze}B`);

  return parts.length ? parts.join(" ") : "0B";
}

function formatPrice(cosmetic) {
  const silver = Number(cosmetic.price_silver || 0);
  const bronze = Number(cosmetic.price_bronze || 0);

  const parts = [];
  if (silver) parts.push(`${silver}S`);
  if (bronze) parts.push(`${bronze}B`);

  return parts.length ? parts.join(" ") : "Free";
}

export default function CosmeticShopPage() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [cosmetics, setCosmetics] = useState([]);
  const [ownedIds, setOwnedIds] = useState([]);
  const [equipped, setEquipped] = useState(null);
  const [activeType, setActiveType] = useState("Border");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
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

  async function loadCosmetics(characterId) {
    if (!characterId) return;

    setMessage("");

    try {
      const response = await fetch(`/api/cosmetics?character_id=${encodeURIComponent(characterId)}`);
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Gagal memuat cosmetic.");
        return;
      }

      setCosmetics(result.cosmetics || []);
      setOwnedIds(result.owned_cosmetic_ids || []);
      setEquipped(result.equipped || null);
    } catch (error) {
      setMessage(error.message || "Gagal memuat cosmetic.");
    }
  }

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    loadCosmetics(selectedCharacterId);
  }, [selectedCharacterId]);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  const filteredCosmetics = cosmetics.filter(
    (cosmetic) => cosmetic.cosmetic_type === activeType
  );

  function isOwned(cosmeticId) {
    return ownedIds.includes(cosmeticId);
  }

  function isEquipped(cosmetic) {
    if (!equipped) return false;

    if (cosmetic.cosmetic_type === "Border") {
      return equipped.border_cosmetic_id === cosmetic.id;
    }

    if (cosmetic.cosmetic_type === "Effect") {
      return equipped.effect_cosmetic_id === cosmetic.id;
    }

    return false;
  }

  async function buyCosmetic(cosmetic) {
    if (!selectedCharacterId) {
      window.alert("Pilih character dulu.");
      return;
    }

    const confirmed = window.confirm(`Beli ${cosmetic.name} seharga ${formatPrice(cosmetic)}?`);
    if (!confirmed) return;

    setProcessingId(cosmetic.id);
    setMessage("");

    try {
      const response = await fetch("/api/cosmetics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          character_id: selectedCharacterId,
          cosmetic_id: cosmetic.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        window.alert(result.error || "Gagal membeli cosmetic.");
        setMessage(result.error || "Gagal membeli cosmetic.");
        return;
      }

      setMessage("Cosmetic berhasil dibeli.");
      await loadCharacters();
      await loadCosmetics(selectedCharacterId);
    } catch (error) {
      window.alert(error.message || "Gagal membeli cosmetic.");
      setMessage(error.message || "Gagal membeli cosmetic.");
    } finally {
      setProcessingId("");
    }
  }

  async function equipCosmetic(cosmetic) {
    setProcessingId(cosmetic.id);
    setMessage("");

    try {
      const response = await fetch("/api/cosmetics/equip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          character_id: selectedCharacterId,
          cosmetic_id: cosmetic.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        window.alert(result.error || "Gagal memasang cosmetic.");
        setMessage(result.error || "Gagal memasang cosmetic.");
        return;
      }

      setMessage("Cosmetic berhasil dipasang.");
      await loadCosmetics(selectedCharacterId);
    } catch (error) {
      window.alert(error.message || "Gagal memasang cosmetic.");
      setMessage(error.message || "Gagal memasang cosmetic.");
    } finally {
      setProcessingId("");
    }
  }

  return (
    <main className="portal-home">
      <section className="portal-hero">
        <p className="eyebrow">LUNARIA PRESTIGE MARKET</p>
        <h1>COSMETIC SHOP</h1>
        <p className="hero-copy">
          Beli border dan name effect premium menggunakan currency karakter.
          Cosmetic yang sudah dimiliki bisa dipasang ke profile dan ID Card.
        </p>

        <div className="shop-actions">
          <Link className="admin-secondary" href="/">
            Back to Home
          </Link>
          <Link className="admin-secondary" href="/profile">
            Profile
          </Link>
        </div>
      </section>

      <section className="portal-section">
        <p className="eyebrow">CUSTOMER</p>
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
              <div className="cosmetic-balance-card">
                <span>Current Balance</span>
                <strong>{formatCurrency(selectedCharacter)}</strong>
                <p>
                  {selectedCharacter.character_name} • {selectedCharacter.guild_rank || "Unranked"} • {selectedCharacter.pathway || "-"}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="muted">Belum ada character aktif.</p>
        )}

        {message && <p className="shop-message">{message}</p>}
      </section>

      <section className="portal-section">
        <div className="cosmetic-tabs">
          <button
            className={activeType === "Border" ? "active" : ""}
            onClick={() => setActiveType("Border")}
          >
            Border
          </button>
          <button
            className={activeType === "Effect" ? "active" : ""}
            onClick={() => setActiveType("Effect")}
          >
            Effect
          </button>
        </div>

        <div className="cosmetic-grid">
          {filteredCosmetics.map((cosmetic) => {
            const owned = isOwned(cosmetic.id);
            const equippedNow = isEquipped(cosmetic);

            return (
              <article key={cosmetic.id} className={`cosmetic-card ${cosmetic.css_class}`}>
                <div className="cosmetic-preview">
                  <span className={cosmetic.cosmetic_type === "Effect" ? cosmetic.css_class : ""}>
                    {cosmetic.preview_text || cosmetic.name}
                  </span>
                </div>

                <p className="eyebrow">{cosmetic.rarity}</p>
                <h3>{cosmetic.name}</h3>
                <p className="muted">{cosmetic.description}</p>

                <div className="cosmetic-card-footer">
                  <strong>{formatPrice(cosmetic)}</strong>

                  {equippedNow ? (
                    <button className="admin-secondary" disabled>
                      Equipped
                    </button>
                  ) : owned ? (
                    <button
                      className="admin-primary"
                      onClick={() => equipCosmetic(cosmetic)}
                      disabled={processingId === cosmetic.id}
                    >
                      {processingId === cosmetic.id ? "Processing..." : "Equip"}
                    </button>
                  ) : (
                    <button
                      className="admin-primary"
                      onClick={() => buyCosmetic(cosmetic)}
                      disabled={processingId === cosmetic.id}
                    >
                      {processingId === cosmetic.id ? "Processing..." : "Buy"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
