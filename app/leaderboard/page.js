import Link from "next/link";
import { supabase } from "../../lib/supabase";

const rankWeight = {
  "High Council": 5,
  Arbiter: 4,
  Warden: 3,
  Seeker: 2,
  Initiate: 1,
};

function formatCurrency(character) {
  const gold = Number(character.gold || 0);
  const silver = Number(character.silver || 0);
  const bronze = Number(character.bronze || 0);

  const parts = [];
  if (gold) parts.push(`${gold}G`);
  if (silver) parts.push(`${silver}S`);
  if (bronze) parts.push(`${bronze}B`);

  return parts.length ? parts.join(" ") : "0B";
}

function getPoints(character) {
  const basePoints = Number(character.leaderboard_points || 0);
  const quests = Number(character.completed_quests || 0);
  const rankBonus = rankWeight[character.guild_rank] || 0;

  return basePoints + quests * 10 + rankBonus * 25;
}

export default async function LeaderboardPage() {
  const { data: characters, error } = await supabase
    .from("characters")
    .select("*")
    .eq("status", "Active");

  const rankedCharacters = (characters || [])
    .map((character) => ({
      ...character,
      total_score: getPoints(character),
    }))
    .sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      if ((b.completed_quests || 0) !== (a.completed_quests || 0)) {
        return (b.completed_quests || 0) - (a.completed_quests || 0);
      }
      return (a.character_name || "").localeCompare(b.character_name || "");
    });

  const topThree = rankedCharacters.slice(0, 3);
  const rest = rankedCharacters.slice(3);

  return (
    <main className="portal-home">
      <section className="portal-hero leaderboard-hero">
        <p className="eyebrow">LUNARIA PRESTIGE BOARD</p>
        <h1>TOP LEADERBOARD</h1>
        <p className="hero-copy">
          Ranking resmi karakter aktif Lunaria berdasarkan point, completed quest,
          guild rank, dan kontribusi karakter dalam sistem roleplay.
        </p>

        <div className="shop-actions">
          <Link className="admin-secondary" href="/">
            Back to Home
          </Link>
          <Link className="admin-secondary" href="/registry">
            Adventurer Registry
          </Link>
        </div>
      </section>

      {error && (
        <section className="portal-section">
          <p className="shop-message">Gagal memuat leaderboard: {error.message}</p>
        </section>
      )}

      <section className="portal-section">
        <p className="eyebrow">HIGHEST PRESTIGE</p>
        <h2>Top Adventurers</h2>
        <p className="muted">
          Karakter dengan skor tertinggi tampil sebagai wajah utama perkembangan Lunaria.
        </p>

        {topThree.length ? (
          <div className="leaderboard-podium">
            {topThree.map((character, index) => (
              <article
                key={character.id}
                className={`leaderboard-card top-${index + 1}`}
              >
                <div className="leaderboard-rank">#{index + 1}</div>
                <div>
                  <p className="eyebrow">{character.guild_rank || "Unranked"}</p>
                  <h3><span className={character.equipped_effect_class || ""}>
                    {character.character_name}
                  </span></h3>
                  <p className="muted">
                    {character.player_name} • {character.race || "-"} • {character.pathway || "-"}
                  </p>
                </div>
                <div className="leaderboard-score">
                  <span>Total Score</span>
                  <strong>{character.total_score}</strong>
                </div>
                <div className="leaderboard-meta">
                  <span>Quest: {character.completed_quests || 0}</span>
                  <span>Currency: {formatCurrency(character)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Belum ada karakter aktif untuk leaderboard.</p>
        )}
      </section>

      <section className="portal-section">
        <p className="eyebrow">FULL RANKING</p>
        <h2>Adventurer Standings</h2>

        <div className="leaderboard-list">
          {rest.length ? (
            rest.map((character, index) => (
              <article key={character.id} className="leaderboard-row">
                <div className="leaderboard-row-rank">#{index + 4}</div>
                <div className="leaderboard-row-main">
                  <strong>{character.character_name}</strong>
                  <span>
                    {character.guild_rank || "Unranked"} • {character.pathway || "-"} • {character.status || "-"}
                  </span>
                </div>
                <div className="leaderboard-row-score">
                  <strong>{character.total_score}</strong>
                  <span>{character.completed_quests || 0} Quest</span>
                </div>
              </article>
            ))
          ) : (
            <p className="muted">Belum ada ranking tambahan.</p>
          )}
        </div>
      </section>
    </main>
  );
}
