import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function jsonError(message, status = 500) {
  return NextResponse.json(
    {
      ok: false,
      error: message || "Unknown server error.",
    },
    { status }
  );
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

async function findProfileByClaimCode(supabaseAdmin, claimCode, profileId = null) {
  let query = supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("character_id", claimCode)
    .limit(1);

  if (profileId) {
    query = query.eq("id", profileId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Supabase profile query failed: ${error.message}`);
  }

  return data;
}

export async function GET(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const claimCode = cleanText(searchParams.get("claim_code"), 120);
    const profileId = cleanText(searchParams.get("profile_id"), 120);

    if (!claimCode) {
      return jsonError("Claim code wajib diisi.", 400);
    }

    const profile = await findProfileByClaimCode(supabaseAdmin, claimCode, profileId);

    if (!profile) {
      return jsonError("Profile tidak ditemukan atau character ID / claim code salah.", 404);
    }

    return NextResponse.json({
      ok: true,
      profile,
    });
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]", error);
    return jsonError(error.message || "Gagal memuat profile.", 500);
  }
}

export async function POST(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const formData = await request.formData();

    const claimCode = cleanText(formData.get("claim_code"), 120);
    const profileId = cleanText(formData.get("profile_id"), 120);

    if (!claimCode) {
      return jsonError("Claim code wajib diisi.", 400);
    }

    const profile = await findProfileByClaimCode(supabaseAdmin, claimCode, profileId);

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
      if (!avatar.type?.startsWith("image/")) {
        return jsonError("Avatar harus berupa file gambar.", 400);
      }

      if (avatar.size > MAX_AVATAR_SIZE) {
        return jsonError("Ukuran avatar maksimal 5MB.", 400);
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
        throw new Error(`Avatar upload failed: ${uploadError.message}`);
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
      throw new Error(`Supabase profile update failed: ${updateError.message}`);
    }

    return NextResponse.json({
      ok: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("[PROFILE_POST_ERROR]", error);
    return jsonError(error.message || "Gagal menyimpan profile.", 500);
  }
}
