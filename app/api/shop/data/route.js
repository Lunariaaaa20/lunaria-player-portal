import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || "The Golden Barrel";

    const { data: characters, error: charactersError } = await supabaseAdmin
      .from("characters")
      .select("id, character_name, player_name, race, guild_rank, pathway, gold, silver, bronze, status")
      .eq("status", "Active")
      .order("character_name", { ascending: true });

    if (charactersError) {
      return NextResponse.json({ error: charactersError.message }, { status: 500 });
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("shop_items")
      .select("*")
      .eq("location", location)
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("price_bronze", { ascending: true });

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      location,
      characters: characters || [],
      items: items || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal memuat shop data." },
      { status: 500 }
    );
  }
}
