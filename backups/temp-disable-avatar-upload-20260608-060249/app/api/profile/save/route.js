import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function getEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

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

function jsonOk(payload) {
  return NextResponse.json({ ok: true, ...payload });
}

function jsonError(error, status = 500) {
  const message = error instanceof Error ? error.message : String(error || "Unknown error");
  console.error("[PROFILE_API_ERROR]", message);
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getSupabaseConfig() {
  return {
    url: getEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, ""),
    serviceKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
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

async function supabaseFetch(path, options = {}) {
  const { url, serviceKey } = getSupabaseConfig();

  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.msg ||
      text ||
      `Supabase request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

async function findProfileByCode(profileCode) {
  const encodedCode = encodeURIComponent(profileCode);

  const rows = await supabaseFetch(
    `/rest/v1/profiles?select=*&character_id=eq.${encodedCode}&limit=1`,
    { method: "GET" }
  );

  return Array.isArray(rows) ? rows[0] || null : null;
}

async function updateProfileByCharacterId(profileCode, payload) {
  const encodedCode = encodeURIComponent(profileCode);

  const rows = await supabaseFetch(
    `/rest/v1/profiles?character_id=eq.${encodedCode}&select=*`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    }
  );

  return Array.isArray(rows) ? rows[0] || null : null;
}

async function uploadAvatar(profile, avatar) {
  if (!avatar || typeof avatar !== "object" || !avatar.size) return null;

  if (!avatar.type?.startsWith("image/")) {
    throw new Error("Avatar harus berupa file gambar.");
  }

  if (avatar.size > MAX_AVATAR_SIZE) {
    throw new Error("Ukuran avatar maksimal 5MB.");
  }

  const { url, serviceKey } = getSupabaseConfig();
  const ext = getFileExt(avatar);
  const safeProfileId = String(profile.id).replace(/[^a-zA-Z0-9_-]/g, "");
  const avatarPath = `${safeProfileId}/${Date.now()}.${ext}`;
  const uploadUrl = `${url}/storage/v1/object/${AVATAR_BUCKET}/${avatarPath}`;

  const arrayBuffer = await avatar.arrayBuffer();

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": avatar.type || "image/png",
      "x-upsert": "true",
    },
    body: arrayBuffer,
  });

  const text = await response.text();

  if (!response.ok) {
    let detail = text;
    try {
      const json = JSON.parse(text);
      detail = json.message || json.error || text;
    } catch {}
    throw new Error(`Avatar upload failed: ${detail}`);
  }

  return `${url}/storage/v1/object/public/${AVATAR_BUCKET}/${avatarPath}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const profileCode = cleanText(searchParams.get("claim_code"), 160);

    if (!profileCode) {
      return jsonError("Character ID / claim code wajib diisi.", 400);
    }

    const profile = await findProfileByCode(profileCode);

    if (!profile) {
      return jsonError("Profile tidak ditemukan atau character ID / claim code salah.", 404);
    }

    return jsonOk({ profile });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const profileCode = cleanText(formData.get("claim_code"), 160);

    if (!profileCode) {
      return jsonError("Character ID / claim code wajib diisi.", 400);
    }

    const profile = await findProfileByCode(profileCode);

    if (!profile) {
      return jsonError("Profile tidak ditemukan atau character ID / claim code salah.", 404);
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
      const avatarUrl = await uploadAvatar(profile, avatar);
      if (avatarUrl) updatePayload.avatar_url = avatarUrl;
    }

    const updatedProfile = await updateProfileByCharacterId(profileCode, updatePayload);

    if (!updatedProfile) {
      throw new Error("Profile update returned empty result.");
    }

    return jsonOk({ profile: updatedProfile });
  } catch (error) {
    return jsonError(error, 500);
  }
}
