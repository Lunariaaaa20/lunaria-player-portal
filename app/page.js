"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const defaultStats = [
  { label: "Active Adventurers", value: "0", desc: "Data dari Adventurer Registry" },
    { label: "Open Quests", value: "0", desc: "Quest tersedia untuk player" },
      { label: "Pending Reviews", value: "0", desc: "Menunggu approval admin" },
        { label: "Economy Records", value: "3", desc: "Data harga awal" }
        ];

        export default function HomePage() {
  function countCompletedQuests(value) {
    if (!value) return 0;

    if (Array.isArray(value)) {
      return value.filter(Boolean).length;
    }

    const raw = String(value).trim();

    if (!raw) return 0;

    const directNumber = Number(raw);
    if (Number.isFinite(directNumber)) {
      return directNumber;
    }

    return raw
      .split(/\n|,|;/)
      .map((item) => item.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean).length;
  }
          
  const [liveCounts, setLiveCounts] = useState({
    activeAdventurers: 0,
    openQuests: 0,
    pendingReviews: 0,
    economyRecords: 3,
  });

  const [topAdventurers, setTopAdventurers] = useState([]);

  const [tickerNotices, setTickerNotices] = useState([
    "✦ Weekly Aid will be distributed every Solarys.",
    "📜 New quests are available at the Guild Board.",
    "🏆 Top adventurers will be featured every week.",
    "⚙ Developer Notice: Lunaria Portal is entering premium launch phase.",
  ]);

  useEffect(() => {
    async function loadHomeStats() {
      const [
        charactersResult,
        questsResult,
        applicationsResult,
        reportsResult,
        topAdventurersResult,
        reportsLatestResult,
        portalNoticeResult,
      ] = await Promise.all([
        supabase
          .from("characters")
          .select("id", { count: "exact", head: true })
          .eq("status", "Active"),

        supabase
          .from("quests")
          .select("id", { count: "exact", head: true })
          .eq("status", "Available"),

        supabase
          .from("quest_applications")
          .select("id", { count: "exact", head: true })
          .in("status", ["Pending", "Approved", "Ongoing"]),

        supabase
          .from("quest_reports")
          .select("id", { count: "exact", head: true })
          .in("status", ["Pending", "Needs Revision"]),

        supabase
          .from("characters")
          .select("id, player_name, guild_rank, completed_quests")
          .eq("status", "Active")
          .order("completed_quests", { ascending: false, nullsFirst: false })
          .limit(3),

        supabase
          .from("quest_reports")
          .select("id, quest_title, character_name, player_name, status, submitted_at")
          .eq("status", "Completed")
          .order("submitted_at", { ascending: false })
          .limit(3),

        supabase
          .from("portal_notices")
          .select("id, title, message, is_active, created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      setLiveCounts({
        activeAdventurers: charactersResult.count || 0,
        openQuests: questsResult.count || 0,
        pendingReviews: (applicationsResult.count || 0) + (reportsResult.count || 0),
        economyRecords: 3,
      });

      setTopAdventurers(topAdventurersResult.data || []);

      const latestReports = reportsLatestResult.data || [];
      const activeNotice = portalNoticeResult.data?.[0];

      const dynamicNotices = [
        ...latestReports.map((report) => {
          const actor = report.character_name || report.player_name || "An adventurer";
          const quest = report.quest_title || "an official quest";
          return `✦ ${actor} has completed ${quest}.`;
        }),
        "📜 New quests are available at the Guild Board.",
        "🏆 Top adventurers will be featured every week.",
        activeNotice?.message
          ? `⚙ ${activeNotice.title || "Developer Notice"}: ${activeNotice.message}`
          : "⚙ Developer Notice: Lunaria Portal is entering premium launch phase.",
      ];

      setTickerNotices(dynamicNotices);
    }

    loadHomeStats();
  }, []);

  const stats = useMemo(() => [
    {
      label: "Active Adventurers",
      value: String(liveCounts.activeAdventurers),
      desc: "Data dari Adventurer Registry",
    },
    {
      label: "Open Quests",
      value: String(liveCounts.openQuests),
      desc: "Quest tersedia untuk player",
    },
    {
      label: "Pending Reviews",
      value: String(liveCounts.pendingReviews),
      desc: "Menunggu approval admin",
    },
    {
      label: "Economy Records",
      value: String(liveCounts.economyRecords),
      desc: "Data harga aktif",
    },
  ], [liveCounts]);

return (
              <div className="page">
                    <aside className="sidebar">
                            <div className="logo">LUNARIA</div>
                                    <div className="subtitle">Official Player Portal</div>

                                            <nav className="nav">
                                                      <Link href="/">Home</Link>
                                                                <Link href="/registry">Adventurer Registry</Link>
                                                                          <Link href="/quests">Quest Board</Link>
                                                                                    <Link href="/registration">Character Registration</Link>
                                                                                              <Link href="/quest-report">Quest Report</Link>
                                                                                                        <Link href="/reward-claim">Reward Claim</Link>
                                                                                                                  <Link href="/economy">Economy System</Link>
                                                                                                                            <Link href="/rules">Rules & Guide</Link>
                                                                                                                                      <Link href="/admin">Admin Panel</Link>
                                                                                                                                              </nav>
                                                                                                                                                    </aside>

                                                                                                                                                          <main className="main">
          <div className="lunaria-ticker">
            <div className="lunaria-ticker-track">
              {tickerNotices.map((notice, index) => (
                <span key={index}>{notice}</span>
              ))}
            </div>
          </div>

                                                                                                                                                                  <section className="hero">
                                                                                                                                                                            <h1>LUNARIA PLAYER PORTAL</h1>
                                                                                                                                                                                      <p>
                                                                                                                                                                                                  Portal resmi untuk data petualang, quest, laporan misi, klaim reward,
                                                                                                                                                                                                              inventory, currency, economy system, dan rules komunitas roleplay fantasy Lunaria.
                                                                                                                                                                                                                        </p>
                                                                                                                                                                                                                                </section>

                                                                                                                                                                                                                                        <section className="grid">
                                                                                                                                                                                                                                                  {stats.map((item) => (
                                                                                                                                                                                                                                                              <div className="card" key={item.label}>
                                                                                                                                                                                                                                                                            <h3>{item.value}</h3>
                                                                                                                                                                                                                                                                                          <p><strong>{item.label}</strong></p>
                                                                                                                                                                                                                                                                                                        <p>{item.desc}</p>
                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                              ))}
                                                                                                                                                                                                                                                                                                                                      </section>

                                                                                                                                                                                                                                                                                                                                              
          <section className="home-grid">
            <div className="lunaria-notice">
              <h3>Guild Notice Board</h3>
              <p>
                Lunaria Player Portal is now active for adventurer registry, quest reports,
                reward distribution, economy records, and official guild rules.
              </p>
            </div>

            <div className="lunaria-notice">
              <h3>Top Adventurers</h3>
              <div className="lunaria-leaderboard">
              {topAdventurers.length > 0 ? (
                topAdventurers.map((adventurer, index) => (
                  <div className="lunaria-rank-card" key={adventurer.id || index}>
                    <div className="lunaria-rank-medal">{["I", "II", "III"][index]}</div>
                    <div>
                      <strong>{adventurer.player_name || "Unknown Adventurer"}</strong>
                      <p>
                        {adventurer.guild_rank || "Unranked"} • {countCompletedQuests(adventurer.completed_quests)} Completed Missions
                      </p>
                    </div>
                    <span>Top {index + 1}</span>
                  </div>
                ))
              ) : (
                <div className="lunaria-rank-card">
                  <div className="lunaria-rank-medal">—</div>
                  <div>
                    <strong>No ranked adventurer yet</strong>
                    <p>Complete quests to enter the weekly board.</p>
                  </div>
                  <span>Pending</span>
                </div>
              )}
            </div>
          </div>
        </section>

<section className="section">
                                                                                                                                                                                                                                                                                                                                                        <h2>Quick Access</h2>
                                                                                                                                                                                                                                                                                                                                                                  <div className="grid">
                                                                                                                                                                                                                                                                                                                                                                              <Link className="card" href="/registration">
                                                                                                                                                                                                                                                                                                                                                                                            <h3>Registrasi Karakter</h3>
                                                                                                                                                                                                                                                                                                                                                                                                          <p>Daftarkan karakter baru untuk masuk review admin.</p>
                                                                                                                                                                                                                                                                                                                                                                                                                      </Link>
                                                                                                                                                                                                                                                                                                                                                                                                                                  <Link className="card" href="/quest-report">
                                                                                                                                                                                                                                                                                                                                                                                                                                                <h3>Laporan Quest</h3>
                                                                                                                                                                                                                                                                                                                                                                                                                                                              <p>Laporkan quest selesai dengan bukti RP.</p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </Link>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Link className="card" href="/reward-claim">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <h3>Klaim Reward</h3>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <p>Ajukan klaim uang, loot, atau hadiah story.</p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </Link>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <Link className="card" href="/admin">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <h3>Admin Panel</h3>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <p>Review pending submission dari player.</p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </Link>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </section>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </main>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                }