import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function getEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

export function getSupabaseConfig() {
  return {
    url: getEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, ""),
    serviceKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function cleanText(value, maxLength = 300) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, maxLength);
}

export function jsonOk(payload) {
  return NextResponse.json({ ok: true, ...payload });
}

export function jsonError(error, status = 500) {
  const message = error instanceof Error ? error.message : String(error || "Unknown error");
  console.error("[COSMETIC_API_ERROR]", message);
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function supabaseFetch(path, options = {}) {
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

export async function findProfileByClaimCode(claimCode) {
  const code = encodeURIComponent(cleanText(claimCode, 160));

  if (!code) return null;

  let rows = await supabaseFetch(
    `/rest/v1/profiles?select=*&claim_code=eq.${code}&limit=1`,
    { method: "GET" }
  );

  if (Array.isArray(rows) && rows[0]) return rows[0];

  rows = await supabaseFetch(
    `/rest/v1/profiles?select=*&character_id=eq.${code}&limit=1`,
    { method: "GET" }
  );

  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function getCosmetic(cosmeticId) {
  const id = encodeURIComponent(cleanText(cosmeticId, 160));

  const rows = await supabaseFetch(
    `/rest/v1/cosmetics?select=*&id=eq.${id}&is_active=eq.true&limit=1`,
    { method: "GET" }
  );

  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function getOwnedCosmetics(characterId) {
  const id = encodeURIComponent(cleanText(characterId, 200));

  try {
    const rows = await supabaseFetch(
      `/rest/v1/character_owned_cosmetics?select=*&character_id=eq.${id}`,
      { method: "GET" }
    );

    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    if (String(error.message).includes("character_owned_cosmetics")) {
      throw new Error("Table character_owned_cosmetics belum ada. Jalankan SQL migration Phase 2B dulu.");
    }
    throw error;
  }
}

export async function assertOwned(characterId, cosmeticId) {
  const cId = encodeURIComponent(cleanText(characterId, 200));
  const cosmetic = encodeURIComponent(cleanText(cosmeticId, 200));

  const rows = await supabaseFetch(
    `/rest/v1/character_owned_cosmetics?select=*&character_id=eq.${cId}&cosmetic_id=eq.${cosmetic}&limit=1`,
    { method: "GET" }
  );

  return Array.isArray(rows) ? rows[0] || null : null;
}
