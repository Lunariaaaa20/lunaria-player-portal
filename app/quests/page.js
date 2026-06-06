import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const rankOrder = ["Common", "Uncommon", "Dangerous", "Special"];

export default async function QuestBoardPage() {
  const { data: quests, error } = await supabase
    .from("quests")
    .select("*")
    .in("status", ["Available", "Ongoing", "Completed"])
    .order("rank", { ascending: true })
    .order("title", { ascending: true });

  const safeQuests = quests || [];

  const groupedQuests = rankOrder
    .map((rank) => ({
      rank,
      quests: safeQuests.filter((quest) => quest.rank === rank),
    }))
    .filter((group) => group.quests.length > 0);

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Quest Board</div>

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

      <main className="content">
        <section className="hero">
          <h1>QUEST BOARD</h1>
          <p>
            Daftar misi resmi Lunaria berdasarkan rank, mode, lokasi, risiko,
            objektif, reward, dan possible loot.
          </p>
        </section>

        <section className="section">
          <h2>Available Quests</h2>

          {error && (
            <p className="admin-message">
              Gagal memuat quest: {error.message}
            </p>
          )}

          <div className="category-tabs">
            {groupedQuests.map((group) => (
              <a href={`#${group.rank}`} key={group.rank}>
                {group.rank} <span>{group.quests.length}</span>
              </a>
            ))}
          </div>

          {groupedQuests.length === 0 ? (
            <p className="muted">Belum ada quest public yang tersedia.</p>
          ) : (
            groupedQuests.map((group) => (
              <div className="quest-group" id={group.rank} key={group.rank}>
                <div className="group-title-row">
                  <h3>{group.rank} Quest</h3>
                  <span>{group.quests.length} quests</span>
                </div>

                <div className="quest-grid">
                  {group.quests.map((quest) => (
                    <article className="quest-card" key={quest.id}>
                      <div className="quest-card-header">
                        <h4>{quest.title}</h4>
                        <span className="status-pill">{quest.status}</span>
                      </div>

                      <div className="tag-row">
                        <span>{quest.rank}</span>
                        <span>{quest.type}</span>
                        <span>{quest.mode}</span>
                        <span>{quest.location}</span>
                      </div>

                      <p className="quest-description">{quest.description}</p>

                      {quest.objective && (
                        <div className="quest-block">
                          <strong>Objective</strong>
                          <p>{quest.objective}</p>
                        </div>
                      )}

                      {quest.monster_target && (
                        <div className="quest-block">
                          <strong>Monster / Target</strong>
                          <p>{quest.monster_target}</p>
                        </div>
                      )}

                      {quest.reward && (
                        <div className="quest-block">
                          <strong>Reward</strong>
                          <p>{quest.reward}</p>
                        </div>
                      )}

                      {quest.possible_loot && (
                        <div className="quest-block">
                          <strong>Possible Loot</strong>
                          <p>{quest.possible_loot}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
