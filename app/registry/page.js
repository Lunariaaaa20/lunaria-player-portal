"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getRankTheme, getPathwayTheme } from "../../lib/visualTheme";

function formatTextBlock(value) {
  if (!value || String(value).trim() === "") return "-";
  return String(value).trim();
}

function formatCurrency(character) {
  return `${Number(character.gold || 0)}G / ${Number(character.silver || 0)}S / ${Number(character.bronze || 0)}B`;
}

function buildIdCard(character) {
  return `╔══════════════════════╗
𓂃 𝐋𝐔𝐍𝐀𝐑𝐈𝐀 𝐈𝐃 𝐂𝐀𝐑𝐃 𓂃
╚══════════════════════╝

Name : ${character.character_name || "-"}
Player : ${character.player_name || "-"}
Race : ${character.race || "-"}
Guild Rank : ${character.guild_rank || "-"}
Pathway : ${character.pathway || "-"}
Status : ${character.status || "-"}

━━━━━━━━━━━━━━━━━━
Currency :
${formatCurrency(character)}

━━━━━━━━━━━━━━━━━━
Primary Skills :
1. ${character.skill_1_name || "-"}
${character.skill_1_description ? `   ${character.skill_1_description}` : ""}

2. ${character.skill_2_name || "-"}
${character.skill_2_description ? `   ${character.skill_2_description}` : ""}

━━━━━━━━━━━━━━━━━━
Inventory :
${formatTextBlock(character.inventory)}

━━━━━━━━━━━━━━━━━━
Completed Missions :
${formatTextBlock(character.completed_quests)}

Registered Guild :
Adventurer's Guild of Valenford`;
}

export default function RegistryPage() {
  const [characters, setCharacters] = useState([]);
  const [filteredCharacters, setFilteredCharacters] = useState([]);
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("All");
  const [pathwayFilter, setPathwayFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadCharacters() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/characters", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal memuat Adventurer Registry.");
      }

      const activeCharacters = (result.characters || []).filter(
        (character) => character.status === "Active"
      );

      setCharacters(activeCharacters);
      setFilteredCharacters(activeCharacters);
    } catch (error) {
      setMessage(error.message || "Gagal memuat Adventurer Registry.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    let next = [...characters];

    if (search.trim()) {
      const keyword = search.trim().toLowerCase();

      next = next.filter((character) => {
        return [
          character.character_name,
          character.player_name,
          character.race,
          character.guild_rank,
          character.pathway,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
    }

    if (rankFilter !== "All") {
      next = next.filter((character) => character.guild_rank === rankFilter);
    }

    if (pathwayFilter !== "All") {
      next = next.filter((character) => character.pathway === pathwayFilter);
    }

    setFilteredCharacters(next);
  }, [search, rankFilter, pathwayFilter, characters]);

  const ranks = useMemo(() => {
    return ["All", ...Array.from(new Set(characters.map((item) => item.guild_rank).filter(Boolean)))];
  }, [characters]);

  const pathways = useMemo(() => {
    return ["All", ...Array.from(new Set(characters.map((item) => item.pathway).filter(Boolean)))];
  }, [characters]);

  async function copyIdCard(character) {
    const card = buildIdCard(character);
    await navigator.clipboard.writeText(card);
    window.alert(`ID Card ${character.character_name} berhasil disalin.`);
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Adventurer Registry</div>

        <nav className="nav">
          <div className="nav-section-title">PUBLIC</div>
          <Link href="/">Home</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/profile">Character Profile</Link>
          <Link href="/id-card">ID Card</Link>
          <Link href="/cosmetic-shop">Cosmetic Shop</Link>
<div className="nav-section-title">PLAYER</div>
          <Link href="/registration">Character Registration</Link>

          <div className="nav-section-title">ADMIN</div>
          <Link href="/admin">Admin Panel</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>ADVENTURER REGISTRY</h1>
          <p>
            Daftar resmi karakter aktif Lunaria yang sudah tercatat di Adventurer&apos;s Guild of Valenford.
          </p>
        </section>

        <section className="section">
          <div className="section-header">
            <div>
              <h2>Registered Adventurers</h2>
              <p>
                Showing {filteredCharacters.length} of {characters.length} active characters.
              </p>
            </div>

            <button className="admin-secondary" type="button" onClick={loadCharacters}>
              Refresh Registry
            </button>
          </div>

          <div className="registry-filter-row">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search character, player, race, rank, pathway..."
            />

            <select value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
              {ranks.map((rank) => (
                <option key={rank}>{rank}</option>
              ))}
            </select>

            <select value={pathwayFilter} onChange={(event) => setPathwayFilter(event.target.value)}>
              {pathways.map((pathway) => (
                <option key={pathway}>{pathway}</option>
              ))}
            </select>

            <button
              className="admin-secondary"
              type="button"
              onClick={() => {
                setSearch("");
                setRankFilter("All");
                setPathwayFilter("All");
              }}
            >
              Clear Filter
            </button>
          </div>

          {message && <p className="admin-message">{message}</p>}

          {loading ? (
            <p className="muted">Loading Adventurer Registry...</p>
          ) : filteredCharacters.length === 0 ? (
            <p className="muted">Belum ada karakter aktif yang cocok dengan filter.</p>
          ) : (
            <div className="registry-card-grid">
              {filteredCharacters.map((character) => {
            const rankVisual = getRankTheme(character.guild_rank);
            const pathwayVisual = getPathwayTheme(character.pathway);

            return (
                <article className={`registry-card ${rankVisual.className}`} key={character.id}>
                  <div className="registry-card-header">
                    <div>
                      <h3>{character.character_name || "-"}</h3>
                      <p>{character.player_name || "-"}</p>
                    </div>

                    <span className={`rank-seal rank-badge ${rankVisual.className}`}>
                    <img src={rankVisual.icon} alt="" className="rank-icon" />
                    {character.guild_rank || "Unranked"}
                  </span>
                  </div>

                  <div className="registry-info-grid">
                    <div className="registry-info-box">
                      <span>Race</span>
                      <strong>{character.race || "-"}</strong>
                    </div>

                    <div className="registry-info-box">
                      <span>Pathway</span>
                      <strong className="pathway-badge">
                    {pathwayVisual.icon && (
                      <img src={pathwayVisual.icon} alt="" className="pathway-icon" />
                    )}
                    {character.pathway || "-"}
                  </strong>
                    </div>

                    <div className="registry-info-box">
                      <span>Currency</span>
                      <strong className="currency-badge">{formatCurrency(character)}</strong>
                    </div>

                    <div className="registry-info-box">
                      <span>Status</span>
                      <strong>{character.status || "-"}</strong>
                    </div>
                  </div>

                  <div className="registry-section">
                    <div className="registry-section-title">Primary Skills</div>
                    <div className="registry-section-content">
                      {`1. ${character.skill_1_name || "-"}${
                        character.skill_1_description ? `\n   ${character.skill_1_description}` : ""
                      }\n\n2. ${character.skill_2_name || "-"}${
                        character.skill_2_description ? `\n   ${character.skill_2_description}` : ""
                      }`}
                    </div>
                  </div>

                  <div className="registry-section">
                    <div className="registry-section-title">Inventory</div>
                    <div className="registry-section-content">{formatTextBlock(character.inventory)}</div>
                  </div>

                  <div className="registry-section">
                    <div className="registry-section-title">Completed Missions</div>
                    <div className="registry-section-content">{formatTextBlock(character.completed_quests)}</div>
                  </div>

                  <div className="registry-actions">
                    <button className="admin-secondary" type="button" onClick={() => copyIdCard(character)}>
                      Copy ID Card
                    </button>
                  </div>
                </article>
              );
            })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
