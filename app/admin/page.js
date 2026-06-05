import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const adminModules = [
  {
    title: "Quest Management",
    href: "/admin/quests",
    status: "Active",
    description:
      "Tambah, edit, hapus, dan kelola status quest Lunaria. Quest Draft tidak tampil di Quest Board public.",
  },
  {
    title: "Economy Management",
    href: "/admin/economy",
    status: "Active",
    description:
      "Tambah, edit, hapus, dan kelola harga item, makanan, blacksmith, layanan, material, dan loot exchange.",
  },
  {
    title: "Rules Management",
    href: "/admin/rules",
    status: "Active",
    description:
      "Tambah, edit, hapus, dan kelola aturan rank, pathway, quest, reward, inventory, combat, dan sistem komunitas.",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Admin Dashboard</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/economy">Economy System</Link>
          <Link href="/rules">Rules & Guide</Link>
          <Link href="/admin">Admin Dashboard</Link>
          <Link href="/admin/quests">Quest Admin</Link>
          <Link href="/admin/economy">Economy Admin</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>ADMIN PANEL</h1>
          <p>
            Dashboard utama pengelolaan sistem Lunaria. Pilih modul kerja admin
            sesuai kebutuhan operasional.
          </p>
        </section>

        <section className="section">
          <h2>Management Modules</h2>

          <div className="admin-module-grid">
            {adminModules.map((module) => (
              <Link
                className={`admin-module-card ${
                  module.status === "Coming Soon" ? "is-disabled" : ""
                }`}
                href={module.status === "Coming Soon" ? "/admin" : module.href}
                key={module.title}
              >
                <div className="admin-module-header">
                  <h3>{module.title}</h3>
                  <span>{module.status}</span>
                </div>

                <p>{module.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
