#!/usr/bin/env bash
set -euo pipefail

echo "== Lunaria Phase 1: Profile Persistence Fix =="

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="backups/phase1-profile-persistence-$STAMP"

echo "Creating backup at: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

backup_file() {
  local file="$1"
  if [ -f "$file" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp "$file" "$BACKUP_DIR/$file"
    echo "Backed up: $file"
  else
    echo "Skip backup, file not found: $file"
  fi
}

backup_file "app/profile/page.js"
backup_file "lib/supabase.js"
backup_file "lib/supabaseAdmin.js"
backup_file "app/api/profile/save/route.js"

echo "Ensuring required folders exist..."
mkdir -p app/profile
mkdir -p app/api/profile/save
mkdir -p lib
mkdir -p supabase/migrations

echo "Writing lib/supabaseAdmin.js..."
cat > lib/supabaseAdmin.js <<'EOF'
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
EOF

echo "Writing app/api/profile/save/route.js..."
cat > app/api/profile/save/route.js <<'EOF'
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function cleanText(value, maxLength = 2000) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

function cleanAge(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number)) return null;
  if (number < 1 || number > 999) return null;
  return number;
}

function getFileExt(file) {
  const name = file?.name || "";
  const ext = name.split(".").pop()?.toLowerCase();

  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }

  const type = file?.type || "";
  if (type.includes("png")) return "png";
  if (type.includes("jpeg")) return "jpg";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";

  return "png";
}

async function findProfileByClaimCode(claimCode, profileId = null) {
  let query = supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("claim_code", claimCode)
    .limit(1);

  if (profileId) {
    query = query.eq("id", profileId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const claimCode = cleanText(searchParams.get("claim_code"), 120);
    const profileId = cleanText(searchParams.get("profile_id"), 120);

    if (!claimCode) {
      return NextResponse.json(
        { ok: false, error: "Claim code wajib diisi." },
        { status: 400 }
      );
    }

    const profile = await findProfileByClaimCode(claimCode, profileId);

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "Profile tidak ditemukan atau claim code salah." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Gagal memuat profile." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const claimCode = cleanText(formData.get("claim_code"), 120);
    const profileId = cleanText(formData.get("profile_id"), 120);

    if (!claimCode) {
      return NextResponse.json(
        { ok: false, error: "Claim code wajib diisi." },
        { status: 400 }
      );
    }

    const profile = await findProfileByClaimCode(claimCode, profileId);

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "Profile tidak ditemukan atau claim code salah." },
        { status: 404 }
      );
    }

    const updatePayload = {
      quote: cleanText(formData.get("quote"), 280),
      age: cleanAge(formData.get("age")),
      backstory: cleanText(formData.get("backstory"), 5000),
      personality: cleanText(formData.get("personality"), 2000),
      appearance: cleanText(formData.get("appearance"), 2000),
      updated_at: new Date().toISOString(),
    };

    const avatar = formData.get("avatar");

    if (avatar && typeof avatar === "object" && avatar.size > 0) {
      if (!avatar.type?.startsWith("image/")) {
        return NextResponse.json(
          { ok: false, error: "Avatar harus berupa file gambar." },
          { status: 400 }
        );
      }

      if (avatar.size > MAX_AVATAR_SIZE) {
        return NextResponse.json(
          { ok: false, error: "Ukuran avatar maksimal 5MB." },
          { status: 400 }
        );
      }

      const ext = getFileExt(avatar);
      const safeProfileId = String(profile.id).replace(/[^a-zA-Z0-9_-]/g, "");
      const avatarPath = `${safeProfileId}/${Date.now()}.${ext}`;

      const arrayBuffer = await avatar.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from(AVATAR_BUCKET)
        .upload(avatarPath, buffer, {
          contentType: avatar.type || "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(avatarPath);

      updatePayload.avatar_url = publicUrlData.publicUrl;
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("id", profile.id)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      ok: true,
      profile: updatedProfile,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Gagal menyimpan profile." },
      { status: 500 }
    );
  }
}
EOF

echo "Writing app/profile/page.js..."
cat > app/profile/page.js <<'EOF'
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
EOF

MIGRATION_FILE="supabase/migrations/20260608_phase1_profile_persistence.sql"

echo "Writing $MIGRATION_FILE..."
cat > "$MIGRATION_FILE" <<'EOF'
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists quote text,
  add column if not exists age integer,
  add column if not exists backstory text,
  add column if not exists personality text,
  add column if not exists appearance text,
  add column if not exists updated_at timestamptz default now();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read avatars'
  ) then
    create policy "Public read avatars"
    on storage.objects
    for select
    to public
    using (bucket_id = 'avatars');
  end if;
end $$;
EOF

echo "Installing dependency if missing..."
npm install @supabase/supabase-js

echo ""
echo "DONE."
echo "Backup created at: $BACKUP_DIR"
echo "Migration created at: $MIGRATION_FILE"
echo ""
echo "NEXT STEP:"
echo "Run the SQL migration using Supabase CLI or SQL Editor."
