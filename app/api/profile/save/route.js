import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

function getSupabaseConfig() {
  return {
    url: getEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, ""),
    serviceKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
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

async function findProfileByAccessCode(accessCode) {
  const code = encodeURIComponent(accessCode);

  // Primary: real claim_code
  let rows = await supabaseFetch(
    `/rest/v1/profiles?select=*&claim_code=eq.${code}&limit=1`,
    { method: "GET" }
  );

  if (Array.isArray(rows) && rows[0]) return rows[0];

  // Temporary fallback: old UUID character_id
  rows = await supabaseFetch(
    `/rest/v1/profiles?select=*&character_id=eq.${code}&limit=1`,
    { method: "GET" }
  );

  return Array.isArray(rows) ? rows[0] || null : null;
}

async function updateProfileById(profileId, payload) {
  const id = encodeURIComponent(profileId);

  const rows = await supabaseFetch(
    `/rest/v1/profiles?id=eq.${id}&select=*`,
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const accessCode = cleanText(searchParams.get("claim_code"), 160);

    if (!accessCode) {
      return jsonError("Claim code wajib diisi.", 400);
    }

    const profile = await findProfileByAccessCode(accessCode);

    if (!profile) {
      return jsonError("Profile tidak ditemukan atau claim code salah.", 404);
    }

    return jsonOk({ profile });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const accessCode = cleanText(formData.get("claim_code"), 160);

    if (!accessCode) {
      return jsonError("Claim code wajib diisi.", 400);
    }

    const profile = await findProfileByAccessCode(accessCode);

    if (!profile) {
      return jsonError("Profile tidak ditemukan atau claim code salah.", 404);
    }

    const updatePayload = {
      quote: cleanText(formData.get("quote"), 280),
      age: cleanAge(formData.get("age")),
      backstory: cleanText(formData.get("backstory"), 5000),
      personality: cleanText(formData.get("personality"), 2000),
      appearance: cleanText(formData.get("appearance"), 2000),
      updated_at: new Date().toISOString(),
    };

    // Avatar upload remains frozen for stability.
    // avatar_url will be handled in Phase 1B Storage cleanup.

    const updatedProfile = await updateProfileById(profile.id, updatePayload);

    if (!updatedProfile) {
      throw new Error("Profile update returned empty result.");
    }

    return jsonOk({ profile: updatedProfile });
  } catch (error) {
    return jsonError(error, 500);
  }
}
