"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const initialForm = {
  service_type: "Custom Order",
  equipment_name: "",
  equipment_type: "Weapon",
  tier: "Basic",
  required_rank: "Initiate",
  material: "",
  description: "",
  effect_name: "",
  effect_detail: "",
  effect_limit: "",
  effect_weakness: "",
  customer_note: "",
};

const tierOptions = [
  { value: "Basic", label: "Basic — Initiate" },
  { value: "Elite", label: "Elite — Seeker" },
  { value: "Special", label: "Special — Warden" },
  { value: "Epic", label: "Epic — Arbiter" },
  { value: "Legend", label: "Legend — High Council" },
];


const rankPower = {
  Initiate: 1,
  Seeker: 2,
  Warden: 3,
  Arbiter: 4,
  "High Council": 5,
};

const tierRequirement = {
  Basic: "Initiate",
  Elite: "Seeker",
  Special: "Warden",
  Epic: "Arbiter",
  Legend: "High Council",
};

const tierAccessNote = {
  Basic: "Available",
  Elite: "Available if Seeker+",
  Special: "Requires Admin Approval",
  Epic: "Event/Admin Only",
  Legend: "Story/Major Event Only",
};

const priceGuide = {
  Basic: {
    Weapon: "5S–25S",
    Armor: "10S–40S",
    Repair: "2S–10S",
  },
  Elite: {
    Weapon: "40S–120S",
    Armor: "45S–150S",
    Repair: "8S–30S",
  },
  Special: {
    Weapon: "130S–300S",
    Armor: "150S–350S",
    Repair: "25S–90S",
  },
  Epic: {
    Weapon: "400S–800S",
    Armor: "450S–900S",
    Repair: "100S–300S",
  },
  Legend: {
    Weapon: "1G+",
    Armor: "1G+",
    Repair: "Admin Only",
  },
};

const rankByTier = {
  Basic: "Initiate",
  Elite: "Seeker",
  Special: "Warden",
  Epic: "Arbiter",
  Legend: "High Council",
};

export default function BlacksmithPage() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState(null);

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

  useEffect(() => {
    loadCharacters();
  }, []);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  const allowedTierOptions = useMemo(() => {
    const characterRank = selectedCharacter?.guild_rank || "Initiate";
    const characterPower = rankPower[characterRank] || 1;

    return tierOptions.filter((tier) => {
      if (tier.value === "Epic" || tier.value === "Legend") return false;

      const requiredRank = tierRequirement[tier.value] || "Initiate";
      const requiredPower = rankPower[requiredRank] || 1;

      return characterPower >= requiredPower;
    });
  }, [selectedCharacter]);

  const currentPriceGuide =
    priceGuide[form.tier]?.[form.equipment_type] ||
    priceGuide[form.tier]?.Weapon ||
    "Admin Pricing";

  useEffect(() => {
    if (!selectedCharacter) return;

    const characterRank = selectedCharacter.guild_rank || "Initiate";
    const characterPower = rankPower[characterRank] || 1;
    const requiredRank = tierRequirement[form.tier] || "Initiate";
    const requiredPower = rankPower[requiredRank] || 1;

    if (form.tier === "Epic" || form.tier === "Legend" || characterPower < requiredPower) {
      setForm((current) => ({
        ...current,
        tier: "Basic",
        required_rank: "Initiate",
      }));
    }
  }, [selectedCharacter, form.tier]);

  function updateForm(field, value) {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "tier") {
        next.required_rank = rankByTier[value] || "";
      }

      return next;
    });
  }

  async function submitOrder(event) {
    event.preventDefault();

    if (!selectedCharacterId) {
      window.alert("Pilih character dulu.");
      return;
    }

    if (!form.equipment_name.trim()) {
      window.alert("Nama equipment wajib diisi.");
      return;
    }

    const confirmed = window.confirm(`Submit blacksmith order untuk ${form.equipment_name}?`);
    if (!confirmed) return;

    setSubmitting(true);
    setMessage("");
    setTicket(null);

    try {
      const response = await fetch("/api/blacksmith/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_character_id: selectedCharacterId,
          ...form,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        window.alert(result.error || "Gagal membuat blacksmith order.");
        setMessage(result.error || "Gagal membuat blacksmith order.");
        return;
      }

      setTicket(result.ticket);
      setMessage(result.message || "Blacksmith order berhasil dibuat.");
      setForm(initialForm);
    } catch (error) {
      window.alert(error.message || "Gagal membuat blacksmith order.");
      setMessage(error.message || "Gagal membuat blacksmith order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <p className="eyebrow">LUNARIA CRAFTING SYSTEM</p>
        <h1>Blacksmith Order</h1>
        <p className="muted">
          Buat pesanan equipment, custom weapon/armor, atau repair. Order masuk ke blacksmith queue untuk diproses worker/admin.
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
          <p className="muted">Memuat character...</p>
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
                <span>Selected Character</span>
                <strong>{selectedCharacter.character_name}</strong>
                <p>
                  {selectedCharacter.guild_rank} • {selectedCharacter.pathway} • {selectedCharacter.status}
                </p>
              </div>
            )}

            <div className="shop-balance-card">
              <span>Blacksmith Rule</span>
              <strong>{form.tier} • {currentPriceGuide}</strong>
              <p>
                Required Rank: {tierRequirement[form.tier]} • {tierAccessNote[form.tier]}
              </p>
            </div>
          </>
        )}

        {message && <p className="shop-message">{message}</p>}
      </section>

      {ticket &&

(
        <section className="shop-ticket">
          <h2>Blacksmith Ticket</h2>
          <div className="ticket-box">
            <p><strong>Order ID:</strong> {ticket.order_code}</p>
            <p><strong>Customer:</strong> {ticket.customer}</p>
            <p><strong>Service:</strong> {ticket.service_type}</p>
            <p><strong>Equipment:</strong> {ticket.equipment_name}</p>
            <p><strong>Type:</strong> {ticket.equipment_type}</p>
            <p><strong>Tier:</strong> {ticket.tier}</p>
            <p><strong>Status:</strong> {ticket.status}</p>
          </div>
          <p className="muted">
            Simpan ticket ini sebagai tanda order blacksmith saat roleplay.
          </p>
        </section>
      )}

      <section className="shop-menu">
        <h2>Equipment Record</h2>

        <form className="blacksmith-form" onSubmit={submitOrder}>
          <div className="form-grid-2">
            <label className="shop-label">
              Service Type
              <select
                value={form.service_type}
                onChange={(event) => updateForm("service_type", event.target.value)}
              >
                <option value="Buy">Buy Ready Equipment</option>
                <option value="Custom Order">Custom Order</option>
                <option value="Repair">Repair</option>
              </select>
            </label>

            <label className="shop-label">
              Equipment Type
              <select
                value={form.equipment_type}
                onChange={(event) => updateForm("equipment_type", event.target.value)}
              >
                <option value="Weapon">Weapon</option>
                <option value="Armor">Armor</option>
                <option value="Repair">Repair</option>
                <option value="Equipment">Equipment</option>
              </select>
            </label>
          </div>

          <label className="shop-label">
            Nama Equipment
            <input
              value={form.equipment_name}
              onChange={(event) => updateForm("equipment_name", event.target.value)}
              placeholder="Contoh: Iron Longsword, Raven Guard Armor..."
            />
          </label>

          <div className="form-grid-2">
            <label className="shop-label">
              Tier
              <select
                value={form.tier}
                onChange={(event) => updateForm("tier", event.target.value)}
              >
                {allowedTierOptions.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="shop-label">
              Syarat Rank
              <input
                value={form.required_rank}
                readOnly
                disabled
                title="Syarat rank dikunci otomatis berdasarkan tier."
              />
            </label>
          </div>

          <label className="shop-label">
            Material
            <input
              value={form.material}
              onChange={(event) => updateForm("material", event.target.value)}
              placeholder="Contoh: Iron Ingot, Beast Hide, Shadow Crystal..."
            />
          </label>

          <label className="shop-label">
            Deskripsi
            <textarea
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Jelaskan bentuk, fungsi, dan style equipment."
            />
          </label>

          <div className="form-grid-2">
            <label className="shop-label">
              Nama Efek
              <input
                value={form.effect_name}
                onChange={(event) => updateForm("effect_name", event.target.value)}
                placeholder="Contoh: Ember Edge"
              />
            </label>

            <label className="shop-label">
              Batas Efek
              <input
                value={form.effect_limit}
                onChange={(event) => updateForm("effect_limit", event.target.value)}
                placeholder="Contoh: 2x per quest"
              />
            </label>
          </div>

          <label className="shop-label">
            Detail Efek
            <textarea
              value={form.effect_detail}
              onChange={(event) => updateForm("effect_detail", event.target.value)}
              placeholder="Jelaskan efek equipment secara singkat."
            />
          </label>

          <label className="shop-label">
            Kelemahan
            <textarea
              value={form.effect_weakness}
              onChange={(event) => updateForm("effect_weakness", event.target.value)}
              placeholder="Contoh: tidak efektif melawan musuh air / menguras stamina."
            />
          </label>

          <label className="shop-label">
            Catatan Customer
            <textarea
              value={form.customer_note}
              onChange={(event) => updateForm("customer_note", event.target.value)}
              placeholder="Catatan tambahan untuk blacksmith/admin."
            />
          </label>

          <button className="primary-action" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Blacksmith Order"}
          </button>
        </form>
      </section>
    </main>
  );
}
