import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "lunaria-admin";

function isAdminAuthorized(request) {
  return request.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

function toBronze(gold = 0, silver = 0, bronze = 0) {
  return Number(gold || 0) * 100000 + Number(silver || 0) * 100 + Number(bronze || 0);
}

function fromBronze(totalBronze) {
  const safeTotal = Math.max(0, Number(totalBronze || 0));
  return {
    gold: Math.floor(safeTotal / 100000),
    silver: Math.floor((safeTotal % 100000) / 100),
    bronze: safeTotal % 100,
  };
}

function formatCurrency(totalBronze) {
  const { gold, silver, bronze } = fromBronze(totalBronze);
  const parts = [];
  if (gold) parts.push(`${gold}G`);
  if (silver) parts.push(`${silver}S`);
  if (bronze) parts.push(`${bronze}B`);
  return parts.length ? parts.join(" ") : "0B";
}


const priceRangeBronze = {
  Basic: {
    Weapon: { min: 500, max: 2500 },
    Armor: { min: 1000, max: 4000 },
    Repair: { min: 200, max: 1000 },
  },
  Elite: {
    Weapon: { min: 4000, max: 12000 },
    Armor: { min: 4500, max: 15000 },
    Repair: { min: 800, max: 3000 },
  },
  Special: {
    Weapon: { min: 13000, max: 30000 },
    Armor: { min: 15000, max: 35000 },
    Repair: { min: 2500, max: 9000 },
  },
  Epic: {
    Weapon: { min: 40000, max: 80000 },
    Armor: { min: 45000, max: 90000 },
    Repair: { min: 10000, max: 30000 },
  },
  Legend: {
    Weapon: { min: 100000, max: null },
    Armor: { min: 100000, max: null },
    Repair: { min: 100000, max: null },
  },
};

function getBlacksmithPriceRange(order) {
  const tier = order.tier || "Basic";
  const type = order.service_type === "Repair" ? "Repair" : order.equipment_type || "Weapon";

  return priceRangeBronze[tier]?.[type] || priceRangeBronze[tier]?.Weapon || null;
}

async function isApprovedBlacksmithWorker(characterId) {
  const { data, error } = await supabaseAdmin
    .from("character_jobs")
    .select("id, commission_rate")
    .eq("character_id", characterId)
    .eq("workplace", "Blacksmith")
    .eq("status", "Approved")
    .maybeSingle();

  if (error) throw error;

  return data;
}

async function getCharacterNameMap(characterIds) {
  const uniqueIds = [...new Set(characterIds.filter(Boolean))];

  if (!uniqueIds.length) return {};

  const { data, error } = await supabaseAdmin
    .from("characters")
    .select("id, character_name, player_name, gold, silver, bronze")
    .in("id", uniqueIds);

  if (error) throw error;

  return Object.fromEntries((data || []).map((character) => [character.id, character]));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "Pending Pricing";

    let query = supabaseAdmin
      .from("blacksmith_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (status !== "All") {
      query = query.eq("status", status);
    }

    const { data: orders, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const characterIds = [];
    for (const order of orders || []) {
      characterIds.push(order.customer_character_id);
      characterIds.push(order.worker_character_id);
    }

    const characterMap = await getCharacterNameMap(characterIds);

    const enrichedOrders = (orders || []).map((order) => ({
      ...order,
      customer_name: characterMap[order.customer_character_id]?.character_name || "Unknown",
      worker_name: order.worker_character_id
        ? characterMap[order.worker_character_id]?.character_name || "Unknown"
        : "Belum diambil",
    }));

    return NextResponse.json({
      ok: true,
      orders: enrichedOrders,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal memuat blacksmith orders." },
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

    if (!action || !orderId || !workerCharacterId) {
      return NextResponse.json(
        { error: "action, order_id, dan worker_character_id wajib diisi." },
        { status: 400 }
      );
    }

    const workerJob = await isApprovedBlacksmithWorker(workerCharacterId);

    if (!workerJob) {
      return NextResponse.json(
        { error: "Character ini bukan approved Blacksmith Worker." },
        { status: 403 }
      );
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("blacksmith_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message || "Blacksmith order tidak ditemukan." },
        { status: 404 }
      );
    }

    if (action === "admin_approve") {
      if (!isAdminAuthorized(request)) {
        return NextResponse.json(
          { error: "Admin password salah atau tidak ada." },
          { status: 401 }
        );
      }

      if (order.status !== "Pending Admin Approval") {
        return NextResponse.json(
          { error: `Order status ${order.status} tidak membutuhkan admin approval.` },
          { status: 400 }
        );
      }

      const { data: updatedOrder, error } = await supabaseAdmin
        .from("blacksmith_orders")
        .update({
          status: "Pending Pricing",
          approved_at: new Date().toISOString(),
          admin_note: `${order.admin_note || ""} Approved by admin. Ready for pricing.`,
        })
        .eq("id", order.id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Special order berhasil di-approve admin. Order sekarang masuk Pending Pricing.",
        order: updatedOrder,
      });
    }

    if (action === "take") {
      if (!["Pending Pricing", "Pending"].includes(order.status)) {
        return NextResponse.json(
          { error: `Order dengan status ${order.status} tidak bisa diambil worker.` },
          { status: 400 }
        );
      }

      const { data: updatedOrder, error } = await supabaseAdmin
        .from("blacksmith_orders")
        .update({
          worker_character_id: workerCharacterId,
          status: "Taken",
          taken_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Order berhasil diambil.",
        order: updatedOrder,
      });
    }

    if (action === "set_price") {
      const priceBronze = Number(body?.price_bronze || 0);

      if (priceBronze <= 0) {
        return NextResponse.json(
          { error: "Harga final wajib lebih dari 0 bronze." },
          { status: 400 }
        );
      }

      const range = getBlacksmithPriceRange(order);

      if (!range) {
        return NextResponse.json(
          { error: "Price range blacksmith tidak ditemukan untuk tier/type ini." },
          { status: 400 }
        );
      }

      if (priceBronze < range.min) {
        return NextResponse.json(
          {
            error: `Harga terlalu rendah. Minimum untuk ${order.tier} ${order.equipment_type} adalah ${formatCurrency(range.min)}.`,
          },
          { status: 400 }
        );
      }

      if (range.max !== null && priceBronze > range.max) {
        return NextResponse.json(
          {
            error: `Harga terlalu tinggi. Maximum untuk ${order.tier} ${order.equipment_type} adalah ${formatCurrency(range.max)}.`,
          },
          { status: 400 }
        );
      }

      if (order.worker_character_id !== workerCharacterId) {
        return NextResponse.json(
          { error: "Hanya worker yang mengambil order ini yang bisa memberi harga." },
          { status: 403 }
        );
      }

      if (!["Taken", "Pending Pricing"].includes(order.status)) {
        return NextResponse.json(
          { error: `Order status ${order.status} tidak bisa diberi harga.` },
          { status: 400 }
        );
      }

      const commissionBronze = Math.floor(priceBronze * Number(workerJob.commission_rate || 0.2));

      const { data: updatedOrder, error } = await supabaseAdmin
        .from("blacksmith_orders")
        .update({
          price_bronze: priceBronze,
          commission_bronze: commissionBronze,
          status: "Priced",
          admin_note: `${order.admin_note || ""} Final Price: ${formatCurrency(priceBronze)}. Commission: ${formatCurrency(commissionBronze)}.`,
          approved_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Harga final berhasil ditetapkan.",
        order: updatedOrder,
      });
    }

    if (action === "complete") {
      if (order.worker_character_id !== workerCharacterId) {
        return NextResponse.json(
          { error: "Hanya worker yang mengambil order ini yang bisa menyelesaikan order." },
          { status: 403 }
        );
      }

      if (order.status !== "Priced") {
        return NextResponse.json(
          { error: "Order harus berstatus Priced sebelum bisa diselesaikan." },
          { status: 400 }
        );
      }

      const priceBronze = Number(order.price_bronze || 0);
      const commissionBronze = Number(order.commission_bronze || 0);

      const { data: customer, error: customerError } = await supabaseAdmin
        .from("characters")
        .select("id, character_name, gold, silver, bronze")
        .eq("id", order.customer_character_id)
        .single();

      if (customerError || !customer) {
        return NextResponse.json(
          { error: customerError?.message || "Customer tidak ditemukan." },
          { status: 404 }
        );
      }

      const { data: worker, error: workerError } = await supabaseAdmin
        .from("characters")
        .select("id, character_name, gold, silver, bronze")
        .eq("id", workerCharacterId)
        .single();

      if (workerError || !worker) {
        return NextResponse.json(
          { error: workerError?.message || "Worker tidak ditemukan." },
          { status: 404 }
        );
      }

      const customerBalance = toBronze(customer.gold, customer.silver, customer.bronze);

      if (customerBalance < priceBronze) {
        return NextResponse.json(
          {
            error: `${customer.character_name} tidak punya saldo cukup. Harga ${formatCurrency(priceBronze)}, saldo ${formatCurrency(customerBalance)}.`,
          },
          { status: 400 }
        );
      }

      const newCustomerCurrency = fromBronze(customerBalance - priceBronze);
      const newWorkerCurrency = fromBronze(
        toBronze(worker.gold, worker.silver, worker.bronze) + commissionBronze
      );

      const { error: customerUpdateError } = await supabaseAdmin
        .from("characters")
        .update(newCustomerCurrency)
        .eq("id", customer.id);

      if (customerUpdateError) {
        return NextResponse.json({ error: customerUpdateError.message }, { status: 500 });
      }

      const { error: workerUpdateError } = await supabaseAdmin
        .from("characters")
        .update(newWorkerCurrency)
        .eq("id", worker.id);

      if (workerUpdateError) {
        return NextResponse.json({ error: workerUpdateError.message }, { status: 500 });
      }

      if (order.service_type !== "Repair") {
        const { error: inventoryError } = await supabaseAdmin
          .from("inventory_items")
          .insert({
            character_id: customer.id,
            item_name: order.equipment_name,
            item_type: `${order.tier} ${order.equipment_type}`,
            quantity: 1,
            source: "Blacksmith",
            notes: `Order ${order.order_code}. Durability ${order.durability_current}/${order.durability_max}. Condition: ${order.condition_status}.`,
          });

        if (inventoryError) {
          return NextResponse.json({ error: inventoryError.message }, { status: 500 });
        }
      }

      await supabaseAdmin.from("transactions").insert([
        {
          character_id: customer.id,
          transaction_type: "Blacksmith Purchase",
          gold_change: 0,
          silver_change: 0,
          bronze_change: -priceBronze,
          total_bronze_change: -priceBronze,
          reason: `Blacksmith ${order.service_type}: ${order.equipment_name}`,
          created_by: "system",
        },
        {
          character_id: worker.id,
          transaction_type: "Blacksmith Commission",
          gold_change: 0,
          silver_change: 0,
          bronze_change: commissionBronze,
          total_bronze_change: commissionBronze,
          reason: `Commission from ${order.order_code}: ${order.equipment_name}`,
          created_by: "system",
        },
      ]);

      const { data: updatedOrder, error: completeError } = await supabaseAdmin
        .from("blacksmith_orders")
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

      return NextResponse.json({
        ok: true,
        message: "Blacksmith order selesai. Saldo customer dipotong, komisi worker masuk, equipment masuk inventory.",
        order: updatedOrder,
      });
    }

    return NextResponse.json(
      { error: "Action tidak valid." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal memproses blacksmith order." },
      { status: 500 }
    );
  }
}
