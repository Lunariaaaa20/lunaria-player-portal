import { cleanText, findProfileByClaimCode, getCosmetic, jsonError, jsonOk, supabaseFetch } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();

    const claimCode = cleanText(body.claim_code, 160);
    const cosmeticId = cleanText(body.cosmetic_id, 160);

    if (!claimCode) return jsonError("Claim code wajib diisi.", 400);
    if (!cosmeticId) return jsonError("Cosmetic ID wajib diisi.", 400);

    const profile = await findProfileByClaimCode(claimCode);
    if (!profile) return jsonError("Profile tidak ditemukan atau claim code salah.", 404);

    const cosmetic = await getCosmetic(cosmeticId);
    if (!cosmetic) return jsonError("Cosmetic tidak ditemukan atau tidak aktif.", 404);

    try {
      await supabaseFetch("/rest/v1/character_owned_cosmetics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          character_id: profile.character_id,
          cosmetic_id: cosmetic.id,
          acquired_from: "shop",
        }),
      });
    } catch (error) {
      if (String(error.message).includes("duplicate")) {
        return jsonOk({
          message: "Cosmetic sudah dimiliki.",
          profile,
          cosmetic,
        });
      }
      throw error;
    }

    return jsonOk({
      message: "Cosmetic berhasil dibeli / dimiliki.",
      profile,
      cosmetic,
    });
  } catch (error) {
    return jsonError(error, 500);
  }
}
