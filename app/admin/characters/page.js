"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "lunaria-admin";

const initialForm = {
  player_name: "",
  character_name: "",
  race: "",
  guild_rank: "Initiate",
  pathway: "Warrior",
  skill_1_name: "",
  skill_1_description: "",
  skill_2_name: "",
  skill_2_description: "",
  inventory: "",
  gold: 0,
  silver: 0,
  bronze: 0,
  registered_guild: "Adventurer’s Guild of Valenford",
  status: "Pending",
  admin_notes: "",
};

const rankOptions = ["Initiate", "Seeker", "Warden", "Arbiter", "High Council"];
const pathwayOptions = ["Warrior", "Mystic", "Shadow", "Nature"];
const statusOptions = ["Pending", "Active", "Rejected", "Suspended", "Archived"];

function buildIdCard(character) {
  return `╔══════════════════════╗
𓆩 𝐋𝐔𝐍𝐀𝐑𝐈𝐀 𝐆𝐔𝐈𝐋𝐃 𝐈𝐃 𓆪
╚══════════════════════╝

━━━━━━━━━━━━━━━━━━
𓂃 𝐏𝐋𝐀𝐘𝐄𝐑 𝐃𝐀𝐓𝐀 𓂃
━━━━━━━━━━━━━━━━━━

Player Name      : ${character.player_name || "-"}
Character Name   : ${character.character_name || "-"}
Race             : ${character.race || "-"}
Status           : ${character.status || "-"}

━━━━━━━━━━━━━━━━━━
𓂃 𝐆𝐔𝐈𝐋𝐃 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 𓂃
━━━━━━━━━━━━━━━━━━

Guild Rank       : ${character.guild_rank || "Unranked"}
Pathway          : ${character.pathway || "-"}
Registered Guild : ${character.registered_guild || "Adventurer’s Guild of Valenford"}

━━━━━━━━━━━━━━━━━━
𓂃 𝐏𝐑𝐈𝐌𝐀𝐑𝐘 𝐒𝐊𝐈𝐋𝐋𝐒 𓂃
━━━━━━━━━━━━━━━━━━

1. ${character.skill_1_name || "-"}
   ${character.skill_1_description || "-"}

2. ${character.skill_2_name || "-"}
   ${character.skill_2_description || "-"}

━━━━━━━━━━━━━━━━━━
𓂃 𝐈𝐍𝐕𝐄𝐍𝐓𝐎𝐑𝐘 𓂃
━━━━━━━━━━━━━━━━━━

${character.inventory || "-"}

━━━━━━━━━━━━━━━━━━
𓂃 𝐂𝐔𝐑𝐑𝐄𝐍𝐂𝐘 𓂃
━━━━━━━━━━━━━━━━━━

Gold   : ${character.gold || 0}G
Silver : ${character.silver || 0}S
Bronze : ${character.bronze || 0}B

━━━━━━━━━━━━━━━━━━
𓂃 𝐑𝐄𝐂𝐎𝐑𝐃 𓂃
━━━━━━━━━━━━━━━━━━

Completed Missions : ${character.completed_quests || "-"}
Last Updated       : -
Issued By          : Adventurer’s Guild of Valenford

━━━━━━━━━━━━━━━━━━
Status: 𝐀𝐂𝐓𝐈𝐕𝐄
`;
}

  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [rankFilter, setRankFilter] = useState("All");
  const [pathwayFilter, setPathwayFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredCharacters = characters.filter((character) => {
    const keyword = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !keyword ||
      character.player_name?.toLowerCase().includes(keyword) ||
      character.character_name?.toLowerCase().includes(keyword) ||
      character.race?.toLowerCase().includes(keyword) ||
      character.guild_rank?.toLowerCase().includes(keyword) ||
      character.pathway?.toLowerCase().includes(keyword) ||
      character.status?.toLowerCase().includes(keyword);

    const matchesRank = rankFilter === "All" || character.guild_rank === rankFilter;
    const matchesPathway = pathwayFilter === "All" || character.pathway === pathwayFilter;
    const matchesStatus = statusFilter === "All" || character.status === statusFilter;

    return matchesSearch && matchesRank && matchesPathway && matchesStatus;
  });

  async function loadCharacters(currentPassword = password) {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/characters", {
      headers: {
        "x-admin-password": currentPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal memuat characters.");
      setLoading(false);
      return;
    }

    setCharacters(result.characters || []);
    setLoading(false);
  }

  useEffect(() => {
    const savedPassword = window.localStorage.getItem("lunaria_admin_password");

    if (savedPassword === ADMIN_PASSWORD) {
      setPassword(savedPassword);
      setUnlocked(true);
      loadCharacters(savedPassword);
    }
  }, []);

  function logoutAdmin() {
    window.localStorage.removeItem("lunaria_admin_password");
    setUnlocked(false);
    setPassword("");
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem("lunaria_admin_password", password);
      setUnlocked(true);
      setLoginMessage("");
      await loadCharacters(password);
      return;
    }

    setLoginMessage("Password salah.");
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEdit(character) {
    setEditingId(character.id);
    setMessage("");

    setForm({
      player_name: character.player_name || "",
      character_name: character.character_name || "",
      race: character.race || "",
      guild_rank: character.guild_rank || "Initiate",
      pathway: character.pathway || "Warrior",
      skill_1_name: character.skill_1_name || "",
      skill_1_description: character.skill_1_description || "",
      skill_2_name: character.skill_2_name || "",
      skill_2_description: character.skill_2_description || "",
      inventory: character.inventory || "",
      gold: character.gold || 0,
      silver: character.silver || 0,
      bronze: character.bronze || 0,
      registered_guild: character.registered_guild || "Adventurer’s Guild of Valenford",
      status: character.status || "Pending",
      admin_notes: character.admin_notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
  }

  function clearFilters() {
    setSearchQuery("");
    setRankFilter("All");
    setPathwayFilter("All");
    setStatusFilter("All");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const method = editingId ? "PATCH" : "POST";

    const response = await fetch("/api/admin/characters", {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal menyimpan character.");
      setLoading(false);
      return;
    }

    setMessage(editingId ? "Character berhasil diupdate." : "Character berhasil ditambahkan.");
    setEditingId(null);
    setForm(initialForm);
    await loadCharacters();
  }

  async function deleteCharacter(character) {
    const confirmed = window.confirm(`Hapus character "${character.character_name}"?`);
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/characters", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id: character.id }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal menghapus character.");
      setLoading(false);
      return;
    }

    if (editingId === character.id) {
      cancelEdit();
    }

    setMessage(`Character "${character.character_name}" berhasil dihapus.`);
    await loadCharacters();
  }

  async function copyIdCard(character) {
    const idCard = buildIdCard(character);
    await navigator.clipboard.writeText(idCard);
    setMessage(`ID Card "${character.character_name}" berhasil disalin.`);
  }


  const idCard = `╔══════════════════════╗
𓆩 𝐋𝐔𝐍𝐀𝐑𝐈𝐀 𝐆𝐔𝐈𝐋𝐃 𝐈𝐃 𓆪
╚══════════════════════╝

━━━━━━━━━━━━━━━━━━
𓂃 𝐏𝐋𝐀𝐘𝐄𝐑 𝐃𝐀𝐓𝐀 𓂃
━━━━━━━━━━━━━━━━━━

Player Name      : ${character.player_name || "-"}
Character Name   : ${character.character_name || "-"}
Race             : ${character.race || "-"}
Status           : ${character.status || "-"}

━━━━━━━━━━━━━━━━━━
𓂃 𝐆𝐔𝐈𝐋𝐃 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 𓂃
━━━━━━━━━━━━━━━━━━

Guild Rank       : ${character.guild_rank || "Unranked"}
Pathway          : ${character.pathway || "-"}
Registered Guild : ${character.registered_guild || "Adventurer’s Guild of Valenford"}

━━━━━━━━━━━━━━━━━━
𓂃 𝐏𝐑𝐈𝐌𝐀𝐑𝐘 𝐒𝐊𝐈𝐋𝐋𝐒 𓂃
━━━━━━━━━━━━━━━━━━

1. ${character.skill_1_name || "-"}
   ${character.skill_1_description || "-"}

2. ${character.skill_2_name || "-"}
   ${character.skill_2_description || "-"}

━━━━━━━━━━━━━━━━━━
𓂃 𝐈𝐍𝐕𝐄𝐍𝐓𝐎𝐑𝐘 𓂃
━━━━━━━━━━━━━━━━━━

${character.inventory || "-"}

━━━━━━━━━━━━━━━━━━
𓂃 𝐂𝐔𝐑𝐑𝐄𝐍𝐂𝐘 𓂃
━━━━━━━━━━━━━━━━━━

Gold   : ${character.gold || 0}G
Silver : ${character.silver || 0}S
Bronze : ${character.bronze || 0}B

━━━━━━━━━━━━━━━━━━
𓂃 𝐑𝐄𝐂𝐎𝐑𝐃 𓂃
━━━━━━━━━━━━━━━━━━

Completed Missions : ${character.completed_quests || "-"}
Last Updated       : -
Issued By          : Adventurer’s Guild of Valenford

━━━━━━━━━━━━━━━━━━
Status: 𝐀𝐂𝐓𝐈𝐕𝐄
`;

export default function AdminCharactersPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [rankFilter, setRankFilter] = useState("All");
  const [pathwayFilter, setPathwayFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredCharacters = characters.filter((character) => {
    const keyword = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !keyword ||
      character.player_name?.toLowerCase().includes(keyword) ||
      character.character_name?.toLowerCase().includes(keyword) ||
      character.race?.toLowerCase().includes(keyword) ||
      character.guild_rank?.toLowerCase().includes(keyword) ||
      character.pathway?.toLowerCase().includes(keyword) ||
      character.status?.toLowerCase().includes(keyword);

    const matchesRank = rankFilter === "All" || character.guild_rank === rankFilter;
    const matchesPathway = pathwayFilter === "All" || character.pathway === pathwayFilter;
    const matchesStatus = statusFilter === "All" || character.status === statusFilter;

    return matchesSearch && matchesRank && matchesPathway && matchesStatus;
  });

  async function loadCharacters(currentPassword = password) {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/characters", {
      headers: {
        "x-admin-password": currentPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal memuat characters.");
      setLoading(false);
      return;
    }

    setCharacters(result.characters || []);
    setLoading(false);
  }

  useEffect(() => {
    const savedPassword = window.localStorage.getItem("lunaria_admin_password");

    if (savedPassword === ADMIN_PASSWORD) {
      setPassword(savedPassword);
      setUnlocked(true);
      loadCharacters(savedPassword);
    }
  }, []);

  function logoutAdmin() {
    window.localStorage.removeItem("lunaria_admin_password");
    setUnlocked(false);
    setPassword("");
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem("lunaria_admin_password", password);
      setUnlocked(true);
      setLoginMessage("");
      await loadCharacters(password);
      return;
    }

    setLoginMessage("Password salah.");
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEdit(character) {
    setEditingId(character.id);
    setMessage("");

    setForm({
      player_name: character.player_name || "",
      character_name: character.character_name || "",
      race: character.race || "",
      guild_rank: character.guild_rank || "Initiate",
      pathway: character.pathway || "Warrior",
      skill_1_name: character.skill_1_name || "",
      skill_1_description: character.skill_1_description || "",
      skill_2_name: character.skill_2_name || "",
      skill_2_description: character.skill_2_description || "",
      inventory: character.inventory || "",
      gold: character.gold || 0,
      silver: character.silver || 0,
      bronze: character.bronze || 0,
      registered_guild: character.registered_guild || "Adventurer’s Guild of Valenford",
      status: character.status || "Pending",
      admin_notes: character.admin_notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
  }

  function clearFilters() {
    setSearchQuery("");
    setRankFilter("All");
    setPathwayFilter("All");
    setStatusFilter("All");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const method = editingId ? "PATCH" : "POST";

    const response = await fetch("/api/admin/characters", {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal menyimpan character.");
      setLoading(false);
      return;
    }

    setMessage(editingId ? "Character berhasil diupdate." : "Character berhasil ditambahkan.");
    setEditingId(null);
    setForm(initialForm);
    await loadCharacters();
  }

  async function deleteCharacter(character) {
    const confirmed = window.confirm(`Hapus character "${character.character_name}"?`);
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/characters", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id: character.id }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Gagal menghapus character.");
      setLoading(false);
      return;
    }

    if (editingId === character.id) {
      cancelEdit();
    }

    setMessage(`Character "${character.character_name}" berhasil dihapus.`);
    await loadCharacters();
  }

  

}
