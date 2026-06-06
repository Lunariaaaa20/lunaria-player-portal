import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const categoryOrder = [
  "Currency Rule",
  "Food",
  "Snack",
  "Drink",
  "General Goods",
  "Blacksmith",
  "Blacksmith Service",
  "Service",
  "Travel Service",
  "Material",
  "Loot Exchange",
];

export default async function EconomyPage() {
  const { data, error } = await supabase
    .from("economy_items")
    .select("item_name, category, price_value, currency_type, availability, location, description")
    .order("category", { ascending: true })
    .order("item_name", { ascending: true });

  const items = data || [];

  const groupedItems = categoryOrder
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);

  const uncategorizedItems = items.filter(
    (item) => !categoryOrder.includes(item.category)
  );

  if (uncategorizedItems.length > 0) {
    groupedItems.push({
      category: "Other",
      items: uncategorizedItems,
    });
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Economy System</div>

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
          <h1>ECONOMY SYSTEM</h1>
          <p>Daftar harga, currency rule, makanan, blacksmith, material, layanan, dan data ekonomi resmi Lunaria.</p>
        </section>

        <section className="section">
          <h2>Economy Records</h2>

          {error && <p>Gagal mengambil data economy: {error.message}</p>}

          <div className="category-summary">
            {groupedItems.map((group) => (
              <a key={group.category} href={`#${group.category.replaceAll(" ", "-")}`}>
                {group.category} <span>{group.items.length}</span>
              </a>
            ))}
          </div>

          <div className="economy-groups">
            {groupedItems.map((group) => (
              <section
                className="economy-group"
                id={group.category.replaceAll(" ", "-")}
                key={group.category}
              >
                <div className="group-header">
                  <h3>{group.category}</h3>
                  <span>{group.items.length} items</span>
                </div>

                <div className="economy-card-grid">
                  {group.items.map((item) => (
                    <article className="economy-category-card" key={item.item_name}>
                      <div className="economy-card-top">
                        <h4>{item.item_name}</h4>
                        <span className="badge">{item.availability}</span>
                      </div>

                      <div className="economy-price">{item.price_value}</div>

                      <div className="economy-meta">
                        <span>{item.currency_type}</span>
                        <span>{item.location}</span>
                      </div>

                      {item.description && <p>{item.description}</p>}
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
