import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

function toCopper(character) {
  return (
    Number(character.gold || 0) * 100000 +
    Number(character.silver || 0) * 100 +
    Number(character.bronze || 0)
  );
}

function fromCopper(totalCopper) {
  const gold = Math.floor(totalCopper / 100000);
  const restAfterGold = totalCopper % 100000;
  const silver = Math.floor(restAfterGold / 100);
  const bronze = restAfterGold % 100;

  return { gold, silver, bronze };
}

function cosmeticPriceToCopper(cosmetic) {
  return Number(cosmetic.price_silver || 0) * 100 + Number(cosmetic.price_bronze || 0);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get("character_id");

    const { data: cosmetics, error: cosmeticError } = await supabase
      .from("cosmetics")
      .select("*")
      .eq("is_active", true)
      .order("price_silver", { ascending: true });

    if (cosmeticError) {
      return NextResponse.json({ error: cosmeticError.message }, { status: 500 });
    }

    let owned = [];
    let equipped = null;

    if (characterId) {
      const { data: ownedRows, error: ownedError } = await supabase
        .from("character_cosmetics")
        .select("cosmetic_id")
        .eq("character_id", characterId);

      if (ownedError) {
        return NextResponse.json({ error: ownedError.message }, { status: 500 });
      }

      owned = ownedRows || [];

      const { data: equippedRow } = await supabase
        .from("character_equipped_cosmetics")
        .select("*")
        .eq("character_id", characterId)
        .maybeSingle();

      equipped = equippedRow || null;
    }

    return NextResponse.json({
      cosmetics: cosmetics || [],
      owned_cosmetic_ids: owned.map((row) => row.cosmetic_id),
      equipped,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.character_id || !body.cosmetic_id) {
      return NextResponse.json({ error: "character_id dan cosmetic_id wajib diisi." }, { status: 400 });
    }

    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", body.character_id)
      .single();

    if (characterError || !character) {
      return NextResponse.json({ error: characterError?.message || "Character tidak ditemukan." }, { status: 404 });
    }

    const { data: cosmetic, error: cosmeticError } = await supabase
      .from("cosmetics")
      .select("*")
      .eq("id", body.cosmetic_id)
      .eq("is_active", true)
      .single();

    if (cosmeticError || !cosmetic) {
      return NextResponse.json({ error: cosmeticError?.message || "Cosmetic tidak ditemukan." }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("character_cosmetics")
      .select("id")
      .eq("character_id", body.character_id)
      .eq("cosmetic_id", body.cosmetic_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Cosmetic sudah dimiliki character ini." }, { status: 400 });
    }

    const currentCopper = toCopper(character);
    const priceCopper = cosmeticPriceToCopper(cosmetic);

    if (currentCopper < priceCopper) {
      return NextResponse.json({ error: "Currency character tidak cukup." }, { status: 400 });
    }

    const newBalance = fromCopper(currentCopper - priceCopper);

    const { error: updateBalanceError } = await supabase
      .from("characters")
      .update(newBalance)
      .eq("id", body.character_id);

    if (updateBalanceError) {
      return NextResponse.json({ error: updateBalanceError.message }, { status: 500 });
    }

    const { error: insertOwnedError } = await supabase
      .from("character_cosmetics")
      .insert({
        character_id: body.character_id,
        cosmetic_id: body.cosmetic_id,
      });

    if (insertOwnedError) {
      return NextResponse.json({ error: insertOwnedError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Cosmetic berhasil dibeli.",
      balance: newBalance,
      cosmetic,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
