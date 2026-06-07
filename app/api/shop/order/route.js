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

function createOrderCode() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ORD-${Date.now().toString().slice(-6)}-${random}`;
}

function getCommissionBronze(item) {
  if (item.location === "The Golden Barrel") {
    return Math.floor(Number(item.price_bronze || 0) * 0.2);
  }

  return 0;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const buyerCharacterId = body?.buyer_character_id;
    const itemId = body?.item_id;
    const orderNote = body?.order_note || "";

    if (!buyerCharacterId || !itemId) {
      return NextResponse.json(
        { error: "buyer_character_id dan item_id wajib diisi." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    const { data: buyer, error: buyerError } = await supabase
      .from("characters")
      .select("id, character_name, gold, silver, bronze, status")
      .eq("id", buyerCharacterId)
      .single();

    if (buyerError || !buyer) {
      return NextResponse.json(
        { error: buyerError?.message || "Character pembeli tidak ditemukan." },
        { status: 404 }
      );
    }

    if (buyer.status !== "Active") {
      return NextResponse.json(
        { error: "Character tidak aktif, tidak bisa membuat order." },
        { status: 400 }
      );
    }

    const { data: item, error: itemError } = await supabase
      .from("shop_items")
      .select("*")
      .eq("id", itemId)
      .eq("is_active", true)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: itemError?.message || "Item tidak ditemukan atau tidak aktif." },
        { status: 404 }
      );
    }

    const currentBalance = toBronze(buyer.gold, buyer.silver, buyer.bronze);
    const price = Number(item.price_bronze || 0);

    if (currentBalance < price) {
      return NextResponse.json(
        {
          error: `Saldo tidak cukup. Harga ${formatCurrency(price)}, saldo kamu ${formatCurrency(currentBalance)}.`,
        },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - price;
    const newCurrency = fromBronze(newBalance);
    const orderCode = createOrderCode();
    const commissionBronze = getCommissionBronze(item);

    const { error: updateBalanceError } = await supabase
      .from("characters")
      .update({
        gold: newCurrency.gold,
        silver: newCurrency.silver,
        bronze: newCurrency.bronze,
      })
      .eq("id", buyer.id);

    if (updateBalanceError) {
      return NextResponse.json(
        { error: updateBalanceError.message || "Gagal memotong saldo character." },
        { status: 500 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("shop_orders")
      .insert({
        order_code: orderCode,
        buyer_character_id: buyer.id,
        item_id: item.id,
        item_name: item.name,
        location: item.location,
        category: item.category,
        price_bronze: price,
        commission_bronze: commissionBronze,
        status: item.requires_worker ? "Pending" : "Completed",
        order_note: orderNote,
        completed_at: item.requires_worker ? null : new Date().toISOString(),
      })
      .select("*")
      .single();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message || "Gagal membuat order." },
        { status: 500 }
      );
    }

    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        character_id: buyer.id,
        transaction_type: "Purchase",
        gold_change: 0,
        silver_change: 0,
        bronze_change: -price,
        total_bronze_change: -price,
        reason: `Order ${item.name} from ${item.location}`,
        related_order_id: order.id,
        created_by: "system",
      });

    if (transactionError) {
      return NextResponse.json(
        { error: transactionError.message || "Order berhasil, tapi transaction log gagal dibuat." },
        { status: 500 }
      );
    }

    const ticket = {
      order_code: order.order_code,
      customer: buyer.character_name,
      item: item.name,
      location: item.location,
      category: item.category,
      price: formatCurrency(price),
      commission: formatCurrency(commissionBronze),
      status: order.status,
      note: order.order_note || "-",
    };

    return NextResponse.json({
      ok: true,
      message: "Order berhasil dibuat.",
      order,
      ticket,
      balance_after: newCurrency,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal membuat order." },
      { status: 500 }
    );
  }
}
