import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.character_id || !body.cosmetic_id) {
      return NextResponse.json({ error: "character_id dan cosmetic_id wajib diisi." }, { status: 400 });
    }

    const { data: cosmetic, error: cosmeticError } = await supabase
      .from("cosmetics")
      .select("*")
      .eq("id", body.cosmetic_id)
      .single();

    if (cosmeticError || !cosmetic) {
      return NextResponse.json({ error: cosmeticError?.message || "Cosmetic tidak ditemukan." }, { status: 404 });
    }

    const { data: owned, error: ownedError } = await supabase
      .from("character_cosmetics")
      .select("id")
      .eq("character_id", body.character_id)
      .eq("cosmetic_id", body.cosmetic_id)
      .maybeSingle();

    if (ownedError) {
      return NextResponse.json({ error: ownedError.message }, { status: 500 });
    }

    if (!owned) {
      return NextResponse.json({ error: "Character belum memiliki cosmetic ini." }, { status: 403 });
    }

    const payload = {
      character_id: body.character_id,
      updated_at: new Date().toISOString(),
    };

    if (cosmetic.cosmetic_type === "Border") {
      payload.border_cosmetic_id = body.cosmetic_id;

      await supabase
        .from("characters")
        .update({ equipped_border_class: cosmetic.css_class })
        .eq("id", body.character_id);
    }

    if (cosmetic.cosmetic_type === "Effect") {
      payload.effect_cosmetic_id = body.cosmetic_id;

      await supabase
        .from("characters")
        .update({ equipped_effect_class: cosmetic.css_class })
        .eq("id", body.character_id);
    }

    const { data, error } = await supabase
      .from("character_equipped_cosmetics")
      .upsert(payload, { onConflict: "character_id" })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Cosmetic berhasil dipasang.",
      equipped: data,
      cosmetic,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
