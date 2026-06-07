"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function InventoryPage() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCharacters() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/shop/data?location=Merchant%E2%80%99s%20Lane");
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Gagal memuat character.");
        return;
      }

      const activeCharacters = result.characters || [];
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

  async function loadInventory(characterId) {
    if (!characterId) return;

    setInventoryLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/characters/inventory?character_id=${characterId}`);
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Gagal memuat inventory.");
        setItems([]);
        return;
      }

      setItems(result.items || []);
    } catch (error) {
      setMessage(error.message || "Gagal memuat inventory.");
      setItems([]);
    } finally {
      setInventoryLoading(false);
    }
  }

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    if (selectedCharacterId) {
      loadInventory(selectedCharacterId);
    }
  }, [selectedCharacterId]);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  const totalItems = useMemo(() => {
    return items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  }, [items]);

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <p className="eyebrow">LUNARIA INVENTORY SYSTEM</p>
        <h1>Character Inventory</h1>
        <p className="muted">
          Halaman untuk melihat item character yang tersimpan otomatis dari pembelian Merchant’s Lane.
        </p>

        <div className="shop-actions">
          <Link className="admin-secondary" href="/merchant">
            Open Merchant’s Lane
          </Link>
          <Link className="admin-secondary" href="/">
            Back to Home
          </Link>
        </div>
      </section>

      <section className="shop-panel">
        <h2>Character</h2>

        {loading ? (
          <p className="muted">Memuat character...</p>
        ) : (
          <>
            <label className="shop-label">
              Select Character
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
              <div className="shop-balance-card">
                <span>Selected Character</span>
                <strong>{selectedCharacter.character_name}</strong>
                <p>
                  {selectedCharacter.guild_rank} • {selectedCharacter.pathway} • {selectedCharacter.status}
                </p>
              </div>
            )}
          </>
        )}

        {message && <p className="shop-message">{message}</p>}
      </section>

      <section className="shop-menu">
        <h2>Inventory</h2>

        {inventoryLoading ? (
          <p className="muted">Memuat inventory...</p>
        ) : items.length === 0 ? (
          <p className="muted">Inventory character ini masih kosong.</p>
        ) : (
          <>
            <div className="shop-balance-card">
              <span>Total Stored Items</span>
              <strong>{totalItems}</strong>
              <p>{items.length} jenis item tersimpan.</p>
            </div>

            <div className="inventory-grid">
              {items.map((item) => (
                <article className="inventory-card" key={item.id}>
                  <div>
                    <h3>{item.item_name}</h3>
                    <p>{item.item_type} • {item.source}</p>
                  </div>

                  <strong>x{item.quantity}</strong>

                  {item.notes && <p className="muted">{item.notes}</p>}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
