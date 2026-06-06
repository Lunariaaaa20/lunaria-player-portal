"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

function buildIdCard(character) {
  return `╔══════════════════════╗
       LUNARIA ID CARD
╚══════════════════════╝

Player Name: ${character.player_name}
Character Name: ${character.character_name}
Race: ${character.race}

Guild Rank: ${character.guild_rank}
Pathway: ${character.pathway}

Primary Skills:
1. ${character.skill_1_name}
   ${character.skill_1_description}

2. ${character.skill_2_name}
   ${character.skill_2_description}

Inventory:
${character.inventory || "-"}

Currency:
${character.gold || 0}G / ${character.silver || 0}S / ${character.bronze || 0}B

Registered Guild:
${character.registered_guild}

Status: ${character.status}`;
}

export default function RegistryPage() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [rankFilter, setRankFilter] = useState("All");
  const [pathwayFilter, setPathwayFilter] = useState("All");

  const rankOptions = ["All", "Initiate", "Seeker", "Warden", "Arbiter", "High Council"];
  const pathwayOptions = ["All", "Warrior", "Mystic", "Shadow", "Nature"];

  const filteredCharacters = characters.filter((character) => {
    const keyword = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !keyword ||
      character.player_name?.toLowerCase().includes(keyword) ||
      character.character_name?.toLowerCase().includes(keyword) ||
      character.race?.toLowerCase().includes(keyword) ||
      character.guild_rank?.toLowerCase().includes(keyword) ||
      character.pathway?.toLowerCase().includes(keyword);

    const matchesRank = rankFilter === "All" || character.guild_rank === rankFilter;
    const matchesPathway = pathwayFilter === "All" || character.pathway === pathwayFilter;

    return matchesSearch && matchesRank && matchesPathway;
  });

  async function loadCharacters() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("status", "Active")
      .order("character_name", { ascending: true });

    if (error) {
      setMessage(error.message || "Gagal memuat Adventurer Registry.");
      setLoading(false);
      return;
    }

    setCharacters(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCharacters();
  }, []);

  async function copyIdCard(character) {
    const text = buildIdCard(character);
    await navigator.clipboard.writeText(text);
    setMessage(`ID Card "${character.character_name}" berhasil disalin.`);
  }

  function clearFilters() {
    setSearchQuery("");
    setRankFilter("All");
    setPathwayFilter("All");
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Adventurer Registry</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/economy">Economy System</Link>
          <Link href="/rules">Rules & Guide</Link>
          <Link href="/admin">Admin Panel</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>ADVENTURER REGISTRY</h1>
          <p>
            Daftar karakter aktif Lunaria yang sudah tercatat resmi di Adventurer’s Guild of Valenford.
          </p>
        </section>

        <section className="section">
          <div className="admin-section-header">
            <h2>Registered Adventurers</h2>

            <button className="admin-secondary" type="button" onClick={loadCharacters} disabled={loading}>
              {loading ? "Loading..." : "Refresh Registry"}
            </button>
          </div>

          <div className="admin-filter-panel">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search character, player, race, rank, or pathway..."
            />

            <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)}>
              {rankOptions.map((rank) => (
                <option key={rank}>{rank}</option>
              ))}
            </select>

            <select value={pathwayFilter} onChange={(e) => setPathwayFilter(e.target.value)}>
              {pathwayOptions.map((pathway) => (
                <option key={pathway}>{pathway}</option>
              ))}
            </select>

            <button className="admin-secondary" type="button" onClick={clearFilters}>
              Clear Filter
            </button>
          </div>

          {message && <p className="admin-message">{message}</p>}

          <p className="muted">
            Showing {filteredCharacters.length} of {characters.length} active characters.
          </p>

          {loading ? (
            <p className="muted">Memuat registry...</p>
          ) : filteredCharacters.length === 0 ? (
            <p className="muted">Belum ada karakter aktif yang terdaftar.</p>
          ) : (
            <div className="registry-grid">
              {filteredCharacters.map((character) => (
                <article className="registry-card" key={character.id}>
                  <div className="registry-card-header">
                    <div>
                      <h3>{character.character_name}</h3>
                      <p>{character.player_name}</p>
                    </div>

                    <span>{character.guild_rank}</span>
                  </div>

                  <div className="registry-meta">
                    <div>
                      <strong>Race</strong>
                      <span>{character.race}</span>
                    </div>
                    <div>
                      <strong>Pathway</strong>
                      <span>{character.pathway}</span>
                    </div>
                    <div>
                      <strong>Currency</strong>
                      <span>
                        {character.gold || 0}G / {character.silver || 0}S / {character.bronze || 0}B
                      </span>
                    </div>
                    <div>
                      <strong>Status</strong>
                      <span>{character.status}</span>
                    </div>
                  </div>

                  <div className="registry-skills">
                    <strong>Primary Skills</strong>
                    <p>
                      1. {character.skill_1_name}<br />
                      2. {character.skill_2_name}
                    </p>
                  </div>

                  <button className="admin-secondary" type="button" onClick={() => copyIdCard(character)}>
                    Copy ID Card
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
