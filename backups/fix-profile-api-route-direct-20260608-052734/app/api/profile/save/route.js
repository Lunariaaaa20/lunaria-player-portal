import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

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
