import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get("character_id");

    if (!characterId) {
      return NextResponse.json(
        { error: "character_id wajib diisi." },
        { status: 400 }
      );
    }

    const { data: items, error } = await supabaseAdmin
      .from("inventory_items")
      .select("id, item_name, quantity, item_type, source, notes, created_at")
      .eq("character_id", characterId)
      .order("item_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      items: items || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal memuat inventory character." },
      { status: 500 }
    );
  }
}
