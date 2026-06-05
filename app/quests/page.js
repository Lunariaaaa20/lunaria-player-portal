import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const rankOrder = ["Common", "Uncommon", "Dangerous", "Special"];

export default async function QuestsPage() {
  const { data, error } = await supabase
    .from("quests")
    .select("title, rank, type, mode, location, status, objective, monster_target, reward, possible_loot, description, admin_notes, created_at")
    .order("rank", { ascending: true })
    .order("title", { ascending: true });

  const quests = data || [];

  const groupedQuests = rankOrder
    .map((rank) => ({
      rank,
      quests: quests.filter((quest) => quest.rank === rank),
    }))
    .filter((group) => group.quests.length > 0);

  const uncategorizedQuests = quests.filter(
    (quest) => !rankOrder.includes(quest.rank)
  );

  if (uncategorizedQuests.length > 0) {
    groupedQuests.push({
      rank: "Other",
      quests: uncategorizedQuests,
    });
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Quest Board</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/character-registration">Character Registration</Link>
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
          <p>Daftar misi resmi Lunaria berdasarkan rank, mode, lokasi, risiko, objektif, reward, dan possible loot.</p>
        </section>

        <section className="section">
          <h2>Available Quests</h2>

          {error && <p>Gagal mengambil data quests: {error.message}</p>}

          <div className="category-summary">
            {groupedQuests.map((group) => (
              <a key={group.rank} href={`#${group.rank}`}>
                {group.rank} <span>{group.quests.length}</span>
              </a>
            ))}
          </div>

          <div className="quest-groups">
            {groupedQuests.map((group) => (
              <section className="quest-group" id={group.rank} key={group.rank}>
                <div className="group-header">
                  <h3>{group.rank} Quest</h3>
                  <span>{group.quests.length} quests</span>
                </div>

                <div className="quest-card-grid">
                  {group.quests.map((quest) => (
                    <article className="quest-card" key={quest.title}>
                      <div className="quest-card-top">
                        <h4>{quest.title}</h4>
                        <span className="badge">{quest.status}</span>
                      </div>

                      <div className="quest-badges">
                        <span>{quest.rank}</span>
                        <span>{quest.type}</span>
                        <span>{quest.mode}</span>
                        <span>{quest.location}</span>
                      </div>

                      {quest.description && (
                        <p className="quest-description">{quest.description}</p>
                      )}

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
              </section>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
