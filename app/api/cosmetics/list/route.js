import { cleanText, findProfileByClaimCode, getOwnedCosmetics, jsonError, jsonOk, supabaseFetch } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const claimCode = cleanText(searchParams.get("claim_code"), 160);

    let profile = null;
    let owned = [];
    let equipped = null;

    if (claimCode) {
      profile = await findProfileByClaimCode(claimCode);

      if (!profile) {
        return jsonError("Profile tidak ditemukan atau claim code salah.", 404);
      }

      owned = await getOwnedCosmetics(profile.character_id);

      const equippedRows = await supabaseFetch(
        `/rest/v1/character_equipped_cosmetics?select=*&character_id=eq.${encodeURIComponent(profile.character_id)}&limit=1`,
        { method: "GET" }
      );

      equipped = Array.isArray(equippedRows) ? equippedRows[0] || null : null;
    }

    const cosmetics = await supabaseFetch(
      "/rest/v1/cosmetics?select=*&is_active=eq.true&order=cosmetic_type.asc,name.asc",
      { method: "GET" }
    );

    return jsonOk({
      profile,
      cosmetics: Array.isArray(cosmetics) ? cosmetics : [],
      owned,
      equipped,
    });
  } catch (error) {
    return jsonError(error, 500);
  }
}
