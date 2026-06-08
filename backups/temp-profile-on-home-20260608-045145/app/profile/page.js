"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY_CLAIM = "lunaria_profile_claim_code";
const STORAGE_KEY_PROFILE_ID = "lunaria_profile_id";

const emptyForm = {
  quote: "",
  age: "",
  backstory: "",
  personality: "",
  appearance: "",
};

export default function ProfilePage() {
  const [claimCode, setClaimCode] = useState("");
  const [profileId, setProfileId] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const displayName = useMemo(() => {
    if (!profile) return "Unclaimed Profile";
    return (
      profile.name ||
      profile.character_name ||
      profile.username ||
      profile.display_name ||
      "Lunaria Adventurer"
    );
  }, [profile]);

  useEffect(() => {
    const savedClaim = localStorage.getItem(STORAGE_KEY_CLAIM) || "";
    const savedProfileId = localStorage.getItem(STORAGE_KEY_PROFILE_ID) || "";

    setClaimCode(savedClaim);
    setProfileId(savedProfileId);

    if (savedClaim) {
      loadProfile(savedClaim, savedProfileId);
    }
  }, []);

  function applyProfileToForm(nextProfile) {
    setProfile(nextProfile);
    setProfileId(nextProfile?.id || "");

    setForm({
      quote: nextProfile?.quote || "",
      age: nextProfile?.age ? String(nextProfile.age) : "",
      backstory: nextProfile?.backstory || "",
      personality: nextProfile?.personality || "",
      appearance: nextProfile?.appearance || "",
    });

    setAvatarPreview(nextProfile?.avatar_url || "");

    if (nextProfile?.id) {
      localStorage.setItem(STORAGE_KEY_PROFILE_ID, nextProfile.id);
    }
  }

  async function loadProfile(nextClaimCode = claimCode, nextProfileId = profileId) {
    const cleanClaim = String(nextClaimCode || "").trim();
    const cleanProfileId = String(nextProfileId || "").trim();

    if (!cleanClaim) {
      alert("Masukkan claim code dulu.");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("claim_code", cleanClaim);
      if (cleanProfileId) params.set("profile_id", cleanProfileId);

      const response = await fetch(`/api/profile/save?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Gagal memuat profile.");
      }

      localStorage.setItem(STORAGE_KEY_CLAIM, cleanClaim);
      applyProfileToForm(payload.profile);
    } catch (error) {
      alert(error.message || "Gagal memuat profile.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function onAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(profile?.avatar_url || "");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Avatar harus berupa file gambar.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran avatar maksimal 5MB.");
      event.target.value = "";
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function saveProfile(event) {
    event.preventDefault();

    const cleanClaim = String(claimCode || "").trim();

    if (!cleanClaim) {
      alert("Claim code wajib diisi.");
      return;
    }

    setSaving(true);

    try {
      const body = new FormData();
      body.set("claim_code", cleanClaim);

      if (profileId) {
        body.set("profile_id", profileId);
      }

      body.set("quote", form.quote || "");
      body.set("age", form.age || "");
      body.set("backstory", form.backstory || "");
      body.set("personality", form.personality || "");
      body.set("appearance", form.appearance || "");

      if (avatarFile) {
        body.set("avatar", avatarFile);
      }

      const response = await fetch("/api/profile/save", {
        method: "POST",
        body,
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Gagal menyimpan profile.");
      }

      localStorage.setItem(STORAGE_KEY_CLAIM, cleanClaim);
      applyProfileToForm(payload.profile);
      setAvatarFile(null);

      alert("Profile berhasil disimpan permanen.");
    } catch (error) {
      alert(error.message || "Gagal menyimpan profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08080d] px-4 py-6 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-200/70">
            Lunaria Player Portal
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-wide">
            Profile Editor
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Simpan avatar, quote, age, backstory, personality, dan appearance secara permanen ke Supabase.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mx-auto h-40 w-40 overflow-hidden rounded-3xl border border-yellow-200/20 bg-black/40">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center text-sm text-white/40">
                  No Avatar
                </div>
              )}
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-xl font-black">{displayName}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/40">
                {profile?.guild_rank || profile?.rank || "Profile"}
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Claim Code
              </label>
              <input
                value={claimCode}
                onChange={(event) => setClaimCode(event.target.value)}
                placeholder="Masukkan claim code"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm outline-none focus:border-yellow-200/50"
              />

              <button
                type="button"
                onClick={() => loadProfile()}
                disabled={loading}
                className="mt-3 w-full rounded-xl bg-yellow-200 px-4 py-3 text-sm font-black text-black disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load Profile"}
              </button>
            </div>
          </aside>

          <form
            onSubmit={saveProfile}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Avatar
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={onAvatarChange}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm"
                />
                <p className="mt-2 text-xs text-white/40">
                  Format: PNG, JPG, WEBP, GIF. Maksimal 5MB.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={form.age}
                  onChange={(event) => updateField("age", event.target.value)}
                  placeholder="Contoh: 19"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none focus:border-yellow-200/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Quote
                </label>
                <input
                  value={form.quote}
                  onChange={(event) => updateField("quote", event.target.value)}
                  placeholder="Quote karakter"
                  maxLength={280}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none focus:border-yellow-200/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Personality
                </label>
                <textarea
                  value={form.personality}
                  onChange={(event) => updateField("personality", event.target.value)}
                  placeholder="Sifat, kebiasaan, cara bicara, dan karakter mental."
                  rows={4}
                  className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm leading-6 outline-none focus:border-yellow-200/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Appearance
                </label>
                <textarea
                  value={form.appearance}
                  onChange={(event) => updateField("appearance", event.target.value)}
                  placeholder="Deskripsi fisik, pakaian, aura, dan ciri visual."
                  rows={4}
                  className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm leading-6 outline-none focus:border-yellow-200/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Backstory
                </label>
                <textarea
                  value={form.backstory}
                  onChange={(event) => updateField("backstory", event.target.value)}
                  placeholder="Latar belakang karakter."
                  rows={6}
                  className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm leading-6 outline-none focus:border-yellow-200/50"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-yellow-200 px-5 py-3 text-sm font-black text-black disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Permanent Profile"}
              </button>

              <button
                type="button"
                onClick={() => loadProfile()}
                disabled={loading}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                Refresh From Supabase
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
