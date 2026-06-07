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

export default function BarPage() {
  const [characters, setCharacters] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [orderingId, setOrderingId] = useState("");
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState(null);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/shop/data?location=The%20Golden%20Barrel");
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Gagal memuat menu bar.");
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

  const groupedItems = useMemo(() => {
    return items.reduce((groups, item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
      return groups;
    }, {});
  }, [items]);

  async function orderItem(item) {
    if (!selectedCharacterId) {
      window.alert("Pilih character dulu.");
      return;
    }

    const confirmed = window.confirm(`Order ${item.name} seharga ${formatCurrency(item.price_bronze)}?`);
    if (!confirmed) return;

    setOrderingId(item.id);
    setMessage("");
    setTicket(null);

    try {
      const response = await fetch("/api/shop/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buyer_character_id: selectedCharacterId,
          item_id: item.id,
          order_note: orderNote || "Tidak ada catatan.",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        window.alert(result.error || "Order gagal.");
        setMessage(result.error || "Order gagal.");
        return;
      }

      setTicket(result.ticket);
      setMessage("Order berhasil dibuat.");
      await loadData();
    } catch (error) {
      window.alert(error.message || "Order gagal.");
      setMessage(error.message || "Order gagal.");
    } finally {
      setOrderingId("");
    }
  }

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <p className="eyebrow">LUNARIA TAVERN SYSTEM</p>
        <h1>The Golden Barrel</h1>
        <p className="muted">
          Order makanan dan minuman untuk roleplay. Pesanan bar tidak masuk inventory;
          sistem hanya membuat order ticket dan memotong saldo character.
        </p>

        <div className="shop-actions">
          <Link className="admin-secondary" href="/">
            Back to Home
          </Link>
        </div>
      </section>

      <section className="shop-panel">
        <h2>Customer</h2>

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

            <label className="shop-label">
              Order Note / RP Position
              <input
                value={orderNote}
                onChange={(event) => setOrderNote(event.target.value)}
                placeholder="Contoh: Meja dekat bar, pojok kiri, lantai dua..."
              />
            </label>
          </>
        )}

        {message && <p className="shop-message">{message}</p>}
      </section>

      {ticket && (
        <section className="shop-ticket">
          <h2>Golden Barrel Order Ticket</h2>
          <div className="ticket-box">
            <p><strong>Order ID:</strong> {ticket.order_code}</p>
            <p><strong>Customer:</strong> {ticket.customer}</p>
            <p><strong>Item:</strong> {ticket.item}</p>
            <p><strong>Price:</strong> {ticket.price}</p>
            <p><strong>Commission:</strong> {ticket.commission}</p>
            <p><strong>Status:</strong> {ticket.status}</p>
            <p><strong>Note:</strong> {ticket.note}</p>
          </div>
          <p className="muted">
            Gunakan ticket ini sebagai tanda pesanan saat roleplay di The Golden Barrel.
          </p>
        </section>
      )}

      <section className="shop-menu">
        <h2>Menu</h2>

        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div className="shop-category" key={category}>
            <h3>{category}</h3>

            <div className="shop-grid">
              {categoryItems.map((item) => (
                <article className="shop-item-card" key={item.id}>
                  <div>
                    <h4>{item.name}</h4>
                    <p>{item.location}</p>
                  </div>

                  <strong>{formatCurrency(item.price_bronze)}</strong>

                  <button
                    type="button"
                    onClick={() => orderItem(item)}
                    disabled={loading || orderingId === item.id}
                  >
                    {orderingId === item.id ? "Ordering..." : "Order"}
                  </button>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
