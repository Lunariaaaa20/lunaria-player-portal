import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const categoryOrder = [
  "Rank System",
  "Pathway System",
  "Character Rule",
  "Quest Rule",
  "Reward Rule",
  "Inventory Rule",
  "Economy Rule",
  "Combat Rule",
  "Community Rule",
  "Story Rule",
  "Admin Rule",
];

export default async function RulesPage() {
  const { data, error } = await supabase
    .from("rules")
    .select("rule_title, category, access, priority, status, summary, full_rule")
    .eq("access", "Public")
    .order("category", { ascending: true })
    .order("rule_title", { ascending: true });

  const rules = data || [];

  const groupedRules = categoryOrder
    .map((category) => ({
      category,
      rules: rules.filter((rule) => rule.category === category),
    }))
    .filter((group) => group.rules.length > 0);

  const uncategorizedRules = rules.filter(
    (rule) => !categoryOrder.includes(rule.category)
  );

  if (uncategorizedRules.length > 0) {
    groupedRules.push({
      category: "Other",
      rules: uncategorizedRules,
    });
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Rules & Guide</div>

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
          <h1>RULES & GUIDE</h1>
          <p>Aturan resmi rank, pathway, quest result, reward, inventory, combat, dan sistem komunitas Lunaria.</p>
        </section>

        <section className="section">
          <h2>Public Rules</h2>

          {error && <p>Gagal mengambil data rules: {error.message}</p>}

          <div className="category-summary">
            {groupedRules.map((group) => (
              <a key={group.category} href={`#${group.category.replaceAll(" ", "-")}`}>
                {group.category} <span>{group.rules.length}</span>
              </a>
            ))}
          </div>

          <div className="rule-groups">
            {groupedRules.map((group) => (
              <section
                className="rule-group"
                id={group.category.replaceAll(" ", "-")}
                key={group.category}
              >
                <div className="group-header">
                  <h3>{group.category}</h3>
                  <span>{group.rules.length} rules</span>
                </div>

                <div className="rule-card-grid">
                  {group.rules.map((rule) => (
                    <article className="rules-card" key={rule.rule_title}>
                      <div className="rule-card-top">
                        <h4>{rule.rule_title}</h4>
                        <span className="badge">{rule.status}</span>
                      </div>

                      <div className="rule-badges">
                        <span>{rule.category}</span>
                        <span>{rule.priority}</span>
                        <span>{rule.access}</span>
                      </div>

                      <p className="rule-summary">{rule.summary}</p>

                      {rule.full_rule && (
                        <p className="rule-full">{rule.full_rule}</p>
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
