import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

function toBronze(gold = 0, silver = 0, bronze = 0) {
  return Number(gold || 0) * 100000 + Number(silver || 0) * 100 + Number(bronze || 0);
}

function fromBronze(totalBronze) {
  const safeTotal = Math.max(0, Number(totalBronze || 0));
  const gold = Math.floor(safeTotal / 100000);
  const silver = Math.floor((safeTotal % 100000) / 100);
  const bronze = safeTotal % 100;

  return { gold, silver, bronze };
}

function formatCurrency(totalBronze) {
  const { gold, silver, bronze } = fromBronze(totalBronze);
  const parts = [];

  if (gold) parts.push(`${gold}G`);
  if (silver) parts.push(`${silver}S`);
  if (bronze) parts.push(`${bronze}B`);

  return parts.length ? parts.join(" ") : "0B";
}

export async function POST(request) {
  try {
    const body = await request.json();

    const characterId = body?.character_id;
    const itemId = body?.item_id;
    const quantity = Math.max(1, Math.min(20, Number(body?.quantity || 1)));

    if (!characterId || !itemId) {
      return NextResponse.json(
        { error: "character_id dan item_id wajib diisi." },
        { status: 400 }
      );
    }

    const { data: character, error: characterError } = await supabaseAdmin
      .from("characters")
      .select("id, character_name, gold, silver, bronze, status")
      .eq("id", characterId)
      .single();

    if (characterError || !character) {
      return NextResponse.json(
        { error: characterError?.message || "Character tidak ditemukan." },
        { status: 404 }
      );
    }

    if (character.status !== "Active") {
      return NextResponse.json(
        { error: "Character tidak aktif, tidak bisa membeli item." },
        { status: 400 }
      );
    }

    const { data: item, error: itemError } = await supabaseAdmin
      .from("shop_items")
      .select("*")
      .eq("id", itemId)
      .eq("location", "Merchant’s Lane")
      .eq("is_active", true)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: itemError?.message || "Item Merchant’s Lane tidak ditemukan." },
        { status: 404 }
      );
    }

    const unitPrice = Number(item.price_bronze || 0);
    const totalPrice = unitPrice * quantity;

    const currentBalance = toBronze(character.gold, character.silver, character.bronze);

    if (currentBalance < totalPrice) {
      return NextResponse.json(
        {
          error: `Saldo tidak cukup. Harga ${formatCurrency(totalPrice)}, saldo kamu ${formatCurrency(currentBalance)}.`,
        },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - totalPrice;
    const newCurrency = fromBronze(newBalance);

    const { error: balanceError } = await supabaseAdmin
      .from("characters")
      .update({
        gold: newCurrency.gold,
        silver: newCurrency.silver,
        bronze: newCurrency.bronze,
      })
      .eq("id", character.id);

    if (balanceError) {
      return NextResponse.json(
        { error: balanceError.message || "Gagal memotong saldo character." },
        { status: 500 }
      );
    }

    const { data: existingItem, error: existingError } = await supabaseAdmin
      .from("inventory_items")
      .select("*")
      .eq("character_id", character.id)
      .eq("item_name", item.name)
      .eq("source", "Merchant’s Lane")
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message || "Gagal mengecek inventory." },
        { status: 500 }
      );
    }

    let inventoryRecord;

    if (existingItem) {
      const { data: updatedInventory, error: updateInventoryError } = await supabaseAdmin
        .from("inventory_items")
        .update({
          quantity: Number(existingItem.quantity || 0) + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingItem.id)
        .select("*")
        .single();

      if (updateInventoryError) {
        return NextResponse.json(
          { error: updateInventoryError.message || "Gagal update inventory." },
          { status: 500 }
        );
      }

      inventoryRecord = updatedInventory;
    } else {
      const { data: newInventory, error: inventoryError } = await supabaseAdmin
        .from("inventory_items")
        .insert({
          character_id: character.id,
          item_id: item.id,
          item_name: item.name,
          item_type: item.category,
          quantity,
          source: "Merchant’s Lane",
          notes: `Purchased from Merchant’s Lane.`,
        })
        .select("*")
        .single();

      if (inventoryError) {
        return NextResponse.json(
          { error: inventoryError.message || "Gagal menambah inventory." },
          { status: 500 }
        );
      }

      inventoryRecord = newInventory;
    }

    const { error: transactionError } = await supabaseAdmin
      .from("transactions")
      .insert({
        character_id: character.id,
        transaction_type: "Purchase",
        gold_change: 0,
        silver_change: 0,
        bronze_change: -totalPrice,
        total_bronze_change: -totalPrice,
        reason: `Bought ${item.name} x${quantity} from Merchant’s Lane`,
        created_by: "system",
      });

    if (transactionError) {
      return NextResponse.json(
        { error: transactionError.message || "Item masuk inventory, tapi transaction gagal dibuat." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `${item.name} x${quantity} berhasil dibeli.`,
      item: {
        name: item.name,
        quantity,
        unit_price: formatCurrency(unitPrice),
        total_price: formatCurrency(totalPrice),
      },
      inventory: inventoryRecord,
      balance_after: newCurrency,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal membeli item." },
      { status: 500 }
    );
  }
}
