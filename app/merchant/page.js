"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function formatCurrency(totalBronze) {
  const safeTotal = Math.max(0, Number(totalBronze || 0));
  const gold = Math.floor(safeTotal / 100000);
  const silver = Math.floor((safeTotal % 100000) / 100);
  const bronze = safeTotal % 100;

  const parts = [];
  if (gold) parts.push(`${gold}G`);
  if (silver) parts.push(`${silver}S`);
  if (bronze) parts.push(`${bronze}B`);

  return parts.length ? parts.join(" ") : "0B";
}

function characterBalance(character) {
  if (!character) return "0B";

  const total =
    Number(character.gold || 0) * 100000 +
    Number(character.silver || 0) * 100 +
    Number(character.bronze || 0);

  return formatCurrency(total);
}

export default function MerchantPage() {
  const [characters, setCharacters] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState("");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState(null);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/shop/data?location=Merchant%E2%80%99s%20Lane");
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Gagal memuat Merchant’s Lane.");
        return;
      }

      setCharacters(result.characters || []);
      setItems(result.items || []);

      if (!selectedCharacterId && result.characters?.length) {
        setSelectedCharacterId(result.characters[0].id);
      }
    } catch (error) {
      setMessage(error.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  function getItemQuantity(itemId) {
    const rawValue = quantities[itemId];

    if (rawValue === "" || rawValue === undefined || rawValue === null) {
      return 1;
    }

    return Math.max(1, Math.min(20, Number(rawValue || 1)));
  }

  function updateItemQuantity(itemId, value) {
    if (value === "") {
      setQuantities((current) => ({
        ...current,
        [itemId]: "",
      }));
      return;
    }

    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return;

    const quantity = Math.max(1, Math.min(20, numberValue));

    setQuantities((current) => ({
      ...current,
      [itemId]: String(quantity),
    }));
  }

  async function buyItem(item) {
    if (!selectedCharacterId) {
      window.alert("Pilih character dulu.");
      return;
    }

    const quantity = getItemQuantity(item.id);
    const totalPrice = Number(item.price_bronze || 0) * quantity;

    const confirmed = window.confirm(`Beli ${item.name} x${quantity} seharga ${formatCurrency(totalPrice)}?`);
    if (!confirmed) return;

    setBuyingId(item.id);
    setMessage("");
    setReceipt(null);

    try {
      const response = await fetch("/api/merchant/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          character_id: selectedCharacterId,
          item_id: item.id,
          quantity,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        window.alert(result.error || "Pembelian gagal.");
        setMessage(result.error || "Pembelian gagal.");
        return;
      }

      setReceipt(result.item);
      setMessage(result.message || "Pembelian berhasil.");
      await loadData();
    } catch (error) {
      window.alert(error.message || "Pembelian gagal.");
      setMessage(error.message || "Pembelian gagal.");
    } finally {
      setBuyingId("");
    }
  }

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <p className="eyebrow">LUNARIA MARKET SYSTEM</p>
        <h1>Merchant’s Lane</h1>
        <p className="muted">
          Beli perlengkapan umum. Item dari Merchant’s Lane masuk ke inventory character secara otomatis.
        </p>

        <div className="shop-actions">
          <Link className="admin-secondary" href="/">
            Back to Home
          </Link>
        </div>
      </section>

      <section className="shop-panel">
        <h2>Buyer</h2>

        {loading ? (
          <p className="muted">Memuat data...</p>
        ) : (
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
              <div className="shop-balance-card">
                <span>Current Balance</span>
                <strong>{characterBalance(selectedCharacter)}</strong>
                <p>
                  {selectedCharacter.guild_rank} • {selectedCharacter.pathway} • {selectedCharacter.status}
                </p>
              </div>
            )}
          </>
        )}

        {message && <p className="shop-message">{message}</p>}
      </section>

      {receipt && (
        <section className="shop-ticket">
          <h2>Merchant Receipt</h2>
          <div className="ticket-box">
            <p><strong>Item:</strong> {receipt.name} x{receipt.quantity}</p>
            <p><strong>Unit Price:</strong> {receipt.unit_price}</p>
            <p><strong>Total Price:</strong> {receipt.total_price}</p>
            <p><strong>Status:</strong> Added to Inventory</p>
          </div>
        </section>
      )}

      <section className="shop-menu">
        <h2>General Goods</h2>

        <div className="shop-grid">
          {items.map((item) => (
            <article className="shop-item-card" key={item.id}>
              <div>
                <h4>{item.name}</h4>
                <p>{item.category}</p>
              </div>

              <strong>{formatCurrency(item.price_bronze)}</strong>

              <label className="shop-qty">
                Qty
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={quantities[item.id] ?? 1}
                  onChange={(event) => updateItemQuantity(item.id, event.target.value)}
                />
              </label>

              <button
                type="button"
                onClick={() => buyItem(item)}
                disabled={loading || buyingId === item.id}
              >
                {buyingId === item.id ? "Buying..." : "Buy"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
