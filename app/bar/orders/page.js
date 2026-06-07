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

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
}

export default function BarOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [workerCharacterId, setWorkerCharacterId] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/bar/orders");
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Gagal memuat order bar.");
        return;
      }

      setOrders(result.orders || []);
      setCharacters(result.characters || []);

      if (!workerCharacterId && result.characters?.length) {
        setWorkerCharacterId(result.characters[0].id);
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

  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const selectedWorker = useMemo(
    () => characters.find((character) => character.id === workerCharacterId),
    [characters, workerCharacterId]
  );

  async function processOrder(order, action) {
    if (action === "take" && !workerCharacterId) {
      window.alert("Pilih worker dulu.");
      return;
    }

    const label = action === "take" ? "ambil" : "selesaikan";
    const confirmed = window.confirm(`Yakin ingin ${label} order ${order.order_code}?`);

    if (!confirmed) return;

    setProcessingId(order.id);
    setMessage("");

    try {
      const response = await fetch("/api/bar/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          order_id: order.id,
          worker_character_id: workerCharacterId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        window.alert(result.error || "Gagal memproses order.");
        setMessage(result.error || "Gagal memproses order.");
        return;
      }

      setMessage(result.message || "Order berhasil diproses.");
      await loadData();
    } catch (error) {
      window.alert(error.message || "Gagal memproses order.");
      setMessage(error.message || "Gagal memproses order.");
    } finally {
      setProcessingId("");
    }
  }

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <p className="eyebrow">GOLDEN BARREL WORKER INBOX</p>
        <h1>Bar Orders</h1>
        <p className="muted">
          Halaman untuk bartender mengambil pesanan, menyelesaikan pesanan, dan menerima komisi.
        </p>

        <div className="shop-actions">
          <Link className="admin-secondary" href="/bar">
            Back to Bar
          </Link>
          <Link className="admin-secondary" href="/">
            Back to Home
          </Link>
        </div>
      </section>

      <section className="shop-panel">
        <h2>Worker Control</h2>

        {loading ? (
          <p className="muted">Memuat order...</p>
        ) : (
          <>
            <label className="shop-label">
              Worker Character
              <select
                value={workerCharacterId}
                onChange={(event) => setWorkerCharacterId(event.target.value)}
              >
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.character_name} — {character.player_name}
                  </option>
                ))}
              </select>
            </label>

            {selectedWorker && (
              <div className="shop-balance-card">
                <span>Selected Worker</span>
                <strong>{selectedWorker.character_name}</strong>
                <p>
                  Balance:{" "}
                  {formatCurrency(
                    Number(selectedWorker.gold || 0) * 100000 +
                      Number(selectedWorker.silver || 0) * 100 +
                      Number(selectedWorker.bronze || 0)
                  )}
                </p>
              </div>
            )}

            <label className="shop-label">
              Status Filter
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Taken">Taken</option>
                <option value="Completed">Completed</option>
                <option value="All">All</option>
              </select>
            </label>
          </>
        )}

        {message && <p className="shop-message">{message}</p>}
      </section>

      <section className="shop-menu">
        <h2>Orders</h2>

        {filteredOrders.length === 0 ? (
          <p className="muted">Tidak ada order untuk filter ini.</p>
        ) : (
          <div className="bar-order-list">
            {filteredOrders.map((order) => (
              <article className="bar-order-card" key={order.id}>
                <div className="bar-order-header">
                  <div>
                    <h3>{order.order_code}</h3>
                    <p>
                      {order.item_name} x{order.quantity || 1} • {order.category} • {formatCurrency(order.price_bronze)}
                    </p>
                  </div>

                  <span className={`status-pill status-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>

                <div className="bar-order-details">
                  <p><strong>Customer:</strong> {order.buyer?.character_name || "-"}</p>
                  <p><strong>Worker:</strong> {order.worker?.character_name || "Belum diambil"}</p>
                  <p><strong>Quantity:</strong> {order.quantity || 1}</p>
                  <p><strong>Unit Price:</strong> {formatCurrency(order.unit_price_bronze || order.price_bronze)}</p>
                  <p><strong>Total Price:</strong> {formatCurrency(order.price_bronze)}</p>
                  <p><strong>Commission:</strong> {formatCurrency(order.commission_bronze)}</p>
                  <p><strong>Note:</strong> {order.order_note || "-"}</p>
                  <p><strong>Created:</strong> {formatDate(order.created_at)}</p>
                </div>

                <div className="bar-order-actions">
                  {order.status === "Pending" && (
                    <button
                      type="button"
                      onClick={() => processOrder(order, "take")}
                      disabled={processingId === order.id}
                    >
                      {processingId === order.id ? "Processing..." : "Take Order"}
                    </button>
                  )}

                  {order.status === "Taken" && (
                    <button
                      type="button"
                      onClick={() => processOrder(order, "complete")}
                      disabled={processingId === order.id}
                    >
                      {processingId === order.id ? "Processing..." : "Complete Order"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
