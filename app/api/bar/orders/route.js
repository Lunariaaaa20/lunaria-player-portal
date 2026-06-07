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

export async function GET() {
  try {
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("shop_orders")
      .select(`
        *,
        buyer:buyer_character_id (
          id,
          character_name,
          player_name
        ),
        worker:worker_character_id (
          id,
          character_name,
          player_name
        )
      `)
      .eq("location", "The Golden Barrel")
      .order("created_at", { ascending: false })
      .limit(80);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const { data: characters, error: charactersError } = await supabaseAdmin
      .from("characters")
      .select("id, character_name, player_name, gold, silver, bronze, status")
      .eq("status", "Active")
      .order("character_name", { ascending: true });

    if (charactersError) {
      return NextResponse.json({ error: charactersError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      orders: orders || [],
      characters: characters || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal memuat bar orders." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();

    const action = body?.action;
    const orderId = body?.order_id;
    const workerCharacterId = body?.worker_character_id;

    if (!action || !orderId) {
      return NextResponse.json(
        { error: "action dan order_id wajib diisi." },
        { status: 400 }
      );
    }

    if (!["take", "complete"].includes(action)) {
      return NextResponse.json(
        { error: "Action tidak valid." },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("shop_orders")
      .select("*")
      .eq("id", orderId)
      .eq("location", "The Golden Barrel")
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message || "Order tidak ditemukan." },
        { status: 404 }
      );
    }

    if (action === "take") {
      if (!workerCharacterId) {
        return NextResponse.json(
          { error: "worker_character_id wajib diisi untuk take order." },
          { status: 400 }
        );
      }

      if (order.status !== "Pending") {
        return NextResponse.json(
          { error: "Order ini sudah tidak Pending." },
          { status: 400 }
        );
      }

      const { data: worker, error: workerError } = await supabaseAdmin
        .from("characters")
        .select("id, character_name, status")
        .eq("id", workerCharacterId)
        .single();

      if (workerError || !worker) {
        return NextResponse.json(
          { error: workerError?.message || "Worker tidak ditemukan." },
          { status: 404 }
        );
      }

      if (worker.status !== "Active") {
        return NextResponse.json(
          { error: "Worker tidak aktif." },
          { status: 400 }
        );
      }

      const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from("shop_orders")
        .update({
          worker_character_id: worker.id,
          status: "Taken",
          taken_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .select("*")
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Order berhasil diambil.",
        order: updatedOrder,
      });
    }

    if (action === "complete") {
      if (order.status !== "Taken") {
        return NextResponse.json(
          { error: "Order harus berstatus Taken sebelum bisa diselesaikan." },
          { status: 400 }
        );
      }

      if (!order.worker_character_id) {
        return NextResponse.json(
          { error: "Order belum memiliki worker." },
          { status: 400 }
        );
      }

      const { data: worker, error: workerError } = await supabaseAdmin
        .from("characters")
        .select("id, character_name, gold, silver, bronze, status")
        .eq("id", order.worker_character_id)
        .single();

      if (workerError || !worker) {
        return NextResponse.json(
          { error: workerError?.message || "Worker tidak ditemukan." },
          { status: 404 }
        );
      }

      const commission = Number(order.commission_bronze || 0);
      const workerBalance = toBronze(worker.gold, worker.silver, worker.bronze);
      const newWorkerBalance = workerBalance + commission;
      const newCurrency = fromBronze(newWorkerBalance);

      const { error: balanceError } = await supabaseAdmin
        .from("characters")
        .update({
          gold: newCurrency.gold,
          silver: newCurrency.silver,
          bronze: newCurrency.bronze,
        })
        .eq("id", worker.id);

      if (balanceError) {
        return NextResponse.json({ error: balanceError.message }, { status: 500 });
      }

      const { data: updatedOrder, error: completeError } = await supabaseAdmin
        .from("shop_orders")
        .update({
          status: "Completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .select("*")
        .single();

      if (completeError) {
        return NextResponse.json({ error: completeError.message }, { status: 500 });
      }

      const { error: transactionError } = await supabaseAdmin
        .from("transactions")
        .insert({
          character_id: worker.id,
          transaction_type: "Commission",
          gold_change: 0,
          silver_change: 0,
          bronze_change: commission,
          total_bronze_change: commission,
          reason: `Bar commission for ${order.item_name} (${order.order_code})`,
          related_order_id: order.id,
          created_by: "system",
        });

      if (transactionError) {
        return NextResponse.json(
          { error: transactionError.message || "Order selesai, tapi transaction komisi gagal dibuat." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: `Order selesai. Komisi ${formatCurrency(commission)} masuk ke ${worker.character_name}.`,
        order: updatedOrder,
        commission: formatCurrency(commission),
        worker_balance_after: newCurrency,
      });
    }

    return NextResponse.json({ error: "Action tidak dikenali." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal memproses order." },
      { status: 500 }
    );
  }
}
