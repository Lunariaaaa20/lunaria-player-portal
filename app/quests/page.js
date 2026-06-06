"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function QuestsPage() {
  const [quests, setQuests] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [selectedCharacterByQuest, setSelectedCharacterByQuest] = useState({});
  const [partyByQuest, setPartyByQuest] = useState({});
  const [noteByQuest, setNoteByQuest] = useState({});

  const [rankFilter, setRankFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");

  const rankOrder = ["Common", "Uncommon", "Dangerous", "Special"];

  const groupedQuests = rankOrder.reduce((acc, rank) => {
    acc[rank] = quests.filter((quest) => {
      const matchesRank = rankFilter === "All" || quest.rank === rankFilter;
      const matchesType = typeFilter === "All" || quest.type === typeFilter;
      const matchesMode = modeFilter === "All" || quest.mode === modeFilter;

      return quest.rank === rank && matchesRank && matchesType && matchesMode;
    });

    return acc;
  }, {});

  async function loadData() {
    setLoading(true);
    setMessage("");

    const [questsResult, charactersResult] = await Promise.all([
      supabase
        .from("quests")
        .select("*")
        .eq("status", "Available")
        .order("created_at", { ascending: false }),
      supabase
        .from("characters")
        .select("id,player_name,character_name,guild_rank,status")
        .eq("status", "Active")
        .order("character_name", { ascending: true }),
    ]);

    if (questsResult.error) {
      setMessage(questsResult.error.message || "Gagal memuat quest.");
      setLoading(false);
      return;
    }

    if (charactersResult.error) {
      setMessage(charactersResult.error.message || "Gagal memuat character.");
      setLoading(false);
      return;
    }

    setQuests(questsResult.data || []);
    setCharacters(charactersResult.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateSelectedCharacter(questId, characterId) {
    setSelectedCharacterByQuest((current) => ({
      ...current,
      [questId]: characterId,
    }));
  }

  function updateParty(questId, value) {
    setPartyByQuest((current) => ({
      ...current,
      [questId]: value,
    }));
  }

  function updateNote(questId, value) {
    setNoteByQuest((current) => ({
      ...current,
      [questId]: value,
    }));
  }

  async function takeQuest(quest) {
    const characterId = selectedCharacterByQuest[quest.id] || "";
    const partyMembers = partyByQuest[quest.id] || "";
    const applicationNote = noteByQuest[quest.id] || "";

    if (!characterId) {
      window.alert("Pilih character dulu sebelum Take Quest.");
      return;
    }

    if ((quest.mode === "Duo" || quest.mode === "Party") && !partyMembers.trim()) {
      window.alert(`Quest ${quest.mode} wajib isi party members.`);
      return;
    }

    const confirmed = window.confirm(`Ajukan Take Quest "${quest.title}"?`);
    if (!confirmed) return;

    setMessage("");

    const response = await fetch("/api/quest-applications/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        character_id: characterId,
        quest_id: quest.id,
        party_members: partyMembers,
        application_note: applicationNote,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error || "Gagal mengajukan Take Quest.";
      setMessage(errorMessage);
      window.alert(errorMessage);
      return;
    }

    const successMessage = `Take Quest "${quest.title}" berhasil diajukan. Tunggu approval admin.`;
    setMessage(successMessage);
    window.alert(successMessage);

    setSelectedCharacterByQuest((current) => ({ ...current, [quest.id]: "" }));
    setPartyByQuest((current) => ({ ...current, [quest.id]: "" }));
    setNoteByQuest((current) => ({ ...current, [quest.id]: "" }));
  }

  function clearFilters() {
    setRankFilter("All");
    setTypeFilter("All");
    setModeFilter("All");
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Quest Board</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/registration">Character Registration</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/quest-report">Quest Report</Link>
          <Link href="/economy">Economy System</Link>
          <Link href="/rules">Rules & Guide</Link>
          <Link href="/admin">Admin Panel</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>QUEST BOARD</h1>
          <p>
            Daftar quest aktif Lunaria. Player dapat mengajukan Take Quest dan menunggu approval admin sebelum menjalankan quest.
          </p>
        </section>

        <section className="section">
          <div className="admin-section-header">
            <h2>Available Quests</h2>

            <button className="admin-secondary" type="button" onClick={loadData} disabled={loading}>
              {loading ? "Loading..." : "Refresh Board"}
            </button>
          </div>

          <div className="admin-filter-panel">
            <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)}>
              <option>All</option>
              {rankOrder.map((rank) => (
                <option key={rank}>{rank}</option>
              ))}
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option>All</option>
              <option>Action</option>
              <option>Santai</option>
            </select>

            <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
              <option>All</option>
              <option>Solo</option>
              <option>Duo</option>
              <option>Party</option>
            </select>

            <button className="admin-secondary" type="button" onClick={clearFilters}>
              Clear Filter
            </button>
          </div>

          {message && <p className="admin-message">{message}</p>}

          {loading ? (
            <p className="muted">Memuat quest...</p>
          ) : quests.length === 0 ? (
            <p className="muted">Belum ada quest Available.</p>
          ) : (
            rankOrder.map((rank) => {
              const items = groupedQuests[rank] || [];

              if (rankFilter !== "All" && rankFilter !== rank) return null;
              if (items.length === 0) return null;

              return (
                <div className="quest-category" key={rank} id={rank}>
                  <h2>{rank} Quest</h2>
                  <p className="muted">{items.length} quests</p>

                  <div className="quest-list">
                    {items.map((quest) => (
                      <article className="quest-card" key={quest.id}>
                        <div className="quest-card-header">
                          <div>
                            <h3>{quest.title}</h3>
                            <p>
                              {quest.rank} • {quest.type} • {quest.mode} • {quest.location}
                            </p>
                          </div>

                          <span>{quest.status}</span>
                        </div>

                        <p>{quest.description}</p>

                        <div className="report-block">
                          <strong>Objective</strong>
                          <p>{quest.objective}</p>
                        </div>

                        <div className="report-block">
                          <strong>Monster / Target</strong>
                          <p>{quest.monster}</p>
                        </div>

                        <div className="report-block">
                          <strong>Reward</strong>
                          <p>{quest.reward}</p>
                        </div>

                        <div className="report-block">
                          <strong>Possible Loot</strong>
                          <p>{quest.possible_loot}</p>
                        </div>

                        <div className="take-quest-panel">
                          <strong>Take Quest Application</strong>

                          <select
                            value={selectedCharacterByQuest[quest.id] || ""}
                            onChange={(e) => updateSelectedCharacter(quest.id, e.target.value)}
                          >
                            <option value="">Select Active Character</option>
                            {characters.map((character) => (
                              <option key={character.id} value={character.id}>
                                {character.character_name} — {character.player_name} — {character.guild_rank}
                              </option>
                            ))}
                          </select>

                          {(quest.mode === "Duo" || quest.mode === "Party") && (
                            <textarea
                              value={partyByQuest[quest.id] || ""}
                              onChange={(e) => updateParty(quest.id, e.target.value)}
                              placeholder="Party members wajib diisi. Contoh: Rei, Aeltheria"
                              rows="3"
                            />
                          )}

                          <textarea
                            value={noteByQuest[quest.id] || ""}
                            onChange={(e) => updateNote(quest.id, e.target.value)}
                            placeholder="Application note opsional. Contoh: rencana pendek, partner, atau alasan ambil quest."
                            rows="3"
                          />

                          <button
                            className="admin-submit"
                            type="button"
                            onClick={() => takeQuest(quest)}
                          >
                            Take Quest
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
