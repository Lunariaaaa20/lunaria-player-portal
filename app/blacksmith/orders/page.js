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

function parseSilverToBronze(value) {
  const numberValue = Number(value || 0);
  if (Number.isNaN(numberValue)) return 0;
  return Math.floor(numberValue * 100);
}

export default function BlacksmithOrdersPage() {
  const [characters, setCharacters] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Pending Pricing");
  const [priceInputs, setPriceInputs] = useState({});
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");

  async function loadCharacters() {
    const response = await fetch("/api/shop/data?location=Merchant%E2%80%99s%20Lane");
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal memuat character.");
      return;
    }

    const activeCharacters = result.characters || [];
    setCharacters(activeCharacters);

    if (!selectedWorkerId && activeCharacters.length) {
      setSelectedWorkerId(activeCharacters[0].id);
    }
  }

  async function loadOrders() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/blacksmith/orders?status=${encodeURIComponent(statusFilter)}`);
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Gagal memuat blacksmith orders.");
        setOrders([]);
        return;
      }

      setOrders(result.orders || []);
    } catch (error) {
      setMessage(error.message || "Gagal memuat blacksmith orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const selectedWorker = useMemo(
    () => characters.find((character) => character.id === selectedWorkerId),
    [characters, selectedWorkerId]
  );

  async function runAction(order, action) {
    if (!selectedWorkerId) {
      window.alert("Pilih worker character dulu.");
      return;
    }

    const body = {
      action,
      order_id: order.id,
      worker_character_id: selectedWorkerId,
    };

    if (action === "set_price") {
      const silverValue = priceInputs[order.id];

      if (!silverValue) {
        window.alert("Isi harga final dalam Silver dulu.");
        return;
      }

      body.price_bronze = parseSilverToBronze(silverValue);
    }

    const confirmed = window.confirm(`Proses ${action} untuk ${order.order_code}?`);
    if (!confirmed) return;

    setActionLoadingId(order.id);
    setMessage("");

    try {
      const response = await fetch("/api/blacksmith/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(action === "admin_approve" ? { "x-admin-password": adminPassword } : {}),
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        window.alert(result.error || "Action gagal.");
        setMessage(result.error || "Action gagal.");
        return;
      }

      setMessage(result.message || "Action berhasil.");
      await loadOrders();
    } catch (error) {
      window.alert(error.message || "Action gagal.");
      setMessage(error.message || "Action gagal.");
    } finally {
      setActionLoadingId("");
    }
  }

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <p className="eyebrow">BLACKSMITH WORKER INBOX</p>
        <h1>Blacksmith Orders</h1>
        <p className="muted">
          Halaman worker/admin untuk mengambil order, menetapkan harga final, menyelesaikan order, dan menerima komisi.
        </p>

        <div className="shop-actions">
          <Link className="admin-secondary" href="/blacksmith">
            Back to Blacksmith
          </Link>
          <Link className="admin-secondary" href="/">
            Back to Home
          </Link>
        </div>
      </section>

      <section className="shop-panel">
        <h2>Worker Control</h2>

        <label className="shop-label">
          Worker Character
          <select
            value={selectedWorkerId}
            onChange={(event) => setSelectedWorkerId(event.target.value)}
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
              {selectedWorker.guild_rank} • {selectedWorker.pathway} • {selectedWorker.status}
            </p>
          </div>
        )}

        <label className="shop-label">
          Status Filter
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="Pending Pricing">Pending Pricing</option>
            <option value="Pending Admin Approval">Pending Admin Approval</option>
            <option value="Taken">Taken</option>
            <option value="Priced">Priced</option>
            <option value="Completed">Completed</option>
            <option value="All">All</option>
          </select>
        </label>

        <label className="shop-label">
          Admin Password
          <input
            type="password"
            value={adminPassword}
            onChange={(event) => setAdminPassword(event.target.value)}
            placeholder="Untuk approve Special order"
          />
        </label>

        {message && <p className="shop-message">{message}</p>}
      </section>

      <section className="shop-menu">
        <h2>Orders</h2>

        {loading ? (
          <p className="muted">Memuat order...</p>
        ) : orders.length === 0 ? (
          <p className="muted">Tidak ada blacksmith order untuk filter ini.</p>
        ) : (
          <div className="blacksmith-order-list">
            {orders.map((order) => (
              <article className="blacksmith-order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <h3>{order.order_code}</h3>
                    <p>
                      {order.equipment_name} • {order.equipment_type} • {order.tier}
                    </p>
                  </div>
                  <span className="status-pill">{order.status}</span>
                </div>

                <div className="order-detail-grid">
                  <p><strong>Customer:</strong> {order.customer_name}</p>
                  <p><strong>Worker:</strong> {order.worker_name}</p>
                  <p><strong>Service:</strong> {order.service_type}</p>
                  <p><strong>Required Rank:</strong> {order.required_rank}</p>
                  <p><strong>Material:</strong> {order.material || "-"}</p>
                  <p><strong>Price:</strong> {order.price_bronze ? formatCurrency(order.price_bronze) : "Belum ditentukan"}</p>
                  <p><strong>Commission:</strong> {order.commission_bronze ? formatCurrency(order.commission_bronze) : "-"}</p>
                  <p><strong>Condition:</strong> {order.condition_status}</p>
                </div>

                {order.description && (
                  <p className="muted">
                    <strong>Desc:</strong> {order.description}
                  </p>
                )}

                {order.effect_name && (
                  <p className="muted">
                    <strong>Effect:</strong> {order.effect_name} — {order.effect_detail || "-"}
                  </p>
                )}

                {order.admin_note && (
                  <p className="muted">
                    <strong>Admin Note:</strong> {order.admin_note}
                  </p>
                )}

                <div className="blacksmith-actions">
                  {order.status === "Pending Admin Approval" && (
                    <button
                      type="button"
                      onClick={() => runAction(order, "admin_approve")}
                      disabled={actionLoadingId === order.id}
                    >
                      Approve Special Order
                    </button>
                  )}

                  {(order.status === "Pending Pricing" || order.status === "Pending") && (
                    <button
                      type="button"
                      onClick={() => runAction(order, "take")}
                      disabled={actionLoadingId === order.id}
                    >
                      Take Order
                    </button>
                  )}

                  {order.status === "Taken" && (
                    <>
                      <input
                        type="number"
                        min="1"
                        placeholder="Harga final dalam Silver"
                        value={priceInputs[order.id] || ""}
                        onChange={(event) =>
                          setPriceInputs((current) => ({
                            ...current,
                            [order.id]: event.target.value,
                          }))
                        }
                      />

                      <button
                        type="button"
                        onClick={() => runAction(order, "set_price")}
                        disabled={actionLoadingId === order.id}
                      >
                        Set Final Price
                      </button>
                    </>
                  )}

                  {order.status === "Priced" && (
                    <button
                      type="button"
                      onClick={() => runAction(order, "complete")}
                      disabled={actionLoadingId === order.id}
                    >
                      Complete Order
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
