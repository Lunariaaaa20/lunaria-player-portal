import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const { data, error } = await supabase
    .from("rules")
    .select("rule_title, category, access, priority, status, summary, full_rule")
    .eq("access", "Public")
    .order("rule_title", { ascending: true });

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Rules & Guide</div>

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
          <h1>RULES & GUIDE</h1>
          <p>Aturan resmi rank, pathway, quest result, reward, inventory, combat, dan sistem komunitas Lunaria.</p>
        </section>

        <section className="section">
          <h2>Public Rules</h2>

          {error && <p>Gagal mengambil data rules: {error.message}</p>}

          <div className="grid">
            {(data || []).map((rule) => (
              <article className="card" key={rule.rule_title}>
                <h3>{rule.rule_title}</h3>
                <span className="badge">{rule.category}</span>
                <p><strong>Priority:</strong> {rule.priority}</p>
                <p>{rule.summary}</p>
                <p>{rule.full_rule}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
