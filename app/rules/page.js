import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const { data, error } = await supabase
      .from("rules")
          .select("rule_title, category, access, priority, status, summary, full_rule")
              .eq("access", "Public")
                  .order("rule_title", { ascending: true });
}
                    return (
                        <div className="page">
                              <aside className="sidebar">
                                      <div className="logo">LUNARIA</div>
                                              <div className="subtitle">Rules & Guide</div>

                                                      <nav className="nav">
                                                                <Link href="/">Home</Link>
                                                                          <Link href="/adventurers">Adventurer Registry</Link>
                                                                                    <Link href="/quests">Quest Board</Link>
                                                                                              <Link href="/register">Character Registration</Link>
                                                                                                        <Link href="/quest-report">Quest Report</Link>
                                                                                                                  <Link href="/reward-claim">Reward Claim</Link>
                                                                                                                            <Link href="/economy">Economy System</Link>
                                                                                                                                      <Link href="/rules">Rules & Guide</Link>
                                                                                                                                                <Link href="/admin">Admin Panel</Link>
                                                                                                                                                        </nav>
                                                                                                                                                              </aside>

                                                                                                                                                                    <main className="main">
                                                                                                                                                                            <section className="hero">
                                                                                                                                                                                      <h1>RULES & GUIDE</h1>
                                                                                                                                                                                                <p>
                                                                                                                                                                                                            Aturan resmi rank, pathway, quest result, reward, inventory,
                                                                                                                                                                                                                        combat, dan sistem komunitas Lunaria.
                                                                                                                                                                                                                                  </p>
                                                                                                                                                                                                                                          </section>

                                                                                                                                                                                                                                                  <section className="section">
                                                                                                                                                                                                                                                            <h2>Public Rules</h2>

                                                                                                                                                                                                                                                                      {error && <p>Gagal mengambil data rules.</p>}

                                                                                                                                                                                                                                                                                <div className="grid">
                                                                                                                                                                                                                                                                                            {(data || []).map((rule) => (
                                                                                                                                                                                                                                                                                                          <div className="card" key={rule.rule_title}>
                                                                                                                                                                                                                                                                                                                          <h3>{rule.rule_title}</h3>
                                                                                                                                                                                                                                                                                                                                          <p><span className="badge">{rule.category}</span></p>
                                                                                                                                                                                                                                                                                                                                                          <p><strong>Priority:</strong> {rule.priority}</p>
                                                                                                                                                                                                                                                                                                                                                                          <p>{rule.summary}</p>
                                                                                                                                                                                                                                                                                                                                                                                          <p style={{ marginTop: "12px" }}>{rule.full_rule}</p>
                                                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                                                                    ))}
                                                                                                                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                      </section>
                                                                                                                                                                                                                                                                                                                                                                                                                                            </main>
                                                                                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                                                                                                                                                  