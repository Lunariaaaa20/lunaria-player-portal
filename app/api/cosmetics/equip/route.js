import { assertOwned, cleanText, findProfileByClaimCode, getCosmetic, jsonError, jsonOk, supabaseFetch } from "../_shared";

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

    const owned = await assertOwned(profile.character_id, cosmetic.id);
    if (!owned) return jsonError("Cosmetic belum dimiliki. Buy dulu sebelum equip.", 403);

    const type = String(cosmetic.cosmetic_type || "").toLowerCase();

    const payload = {
      character_id: profile.character_id,
      updated_at: new Date().toISOString(),
    };

    if (type === "border") {
      payload.border_cosmetic_id = cosmetic.id;
    } else if (type === "effect") {
      payload.effect_cosmetic_id = cosmetic.id;
    } else {
      return jsonError(`Tipe cosmetic tidak didukung untuk equip: ${cosmetic.cosmetic_type}`, 400);
    }

    await supabaseFetch("/rest/v1/character_equipped_cosmetics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    });

    const equippedRows = await supabaseFetch(
      `/rest/v1/character_equipped_cosmetics?select=*&character_id=eq.${encodeURIComponent(profile.character_id)}&limit=1`,
      { method: "GET" }
    );

    return jsonOk({
      message: "Cosmetic berhasil di-equip.",
      profile,
      cosmetic,
      equipped: Array.isArray(equippedRows) ? equippedRows[0] || null : null,
    });
  } catch (error) {
    return jsonError(error, 500);
  }
}
