import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

function createOrderCode() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BS-${Date.now().toString().slice(-6)}-${random}`;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const customerCharacterId = body?.customer_character_id;
    const serviceType = body?.service_type || "Custom Order";
    const equipmentName = body?.equipment_name || "";
    const equipmentType = body?.equipment_type || "";
    const tier = body?.tier || "Basic";
    const requiredRank = body?.required_rank || "";
    const material = body?.material || "";
    const description = body?.description || "";

    const effectName = body?.effect_name || "";
    const effectDetail = body?.effect_detail || "";
    const effectLimit = body?.effect_limit || "";
    const effectWeakness = body?.effect_weakness || "";
    const customerNote = body?.customer_note || "";

    if (!customerCharacterId) {
      return NextResponse.json(
        { error: "customer_character_id wajib diisi." },
        { status: 400 }
      );
    }

    if (!equipmentName || !equipmentType || !tier) {
      return NextResponse.json(
        { error: "Nama equipment, jenis, dan tier wajib diisi." },
        { status: 400 }
      );
    }

    const { data: character, error: characterError } = await supabaseAdmin
      .from("characters")
      .select("id, character_name, status")
      .eq("id", customerCharacterId)
      .single();

    if (characterError || !character) {
      return NextResponse.json(
        { error: characterError?.message || "Character tidak ditemukan." },
        { status: 404 }
      );
    }

    if (character.status !== "Active") {
      return NextResponse.json(
        { error: "Character tidak aktif, tidak bisa membuat blacksmith order." },
        { status: 400 }
      );
    }

    const orderCode = createOrderCode();

    const { data: order, error: orderError } = await supabaseAdmin
      .from("blacksmith_orders")
      .insert({
        order_code: orderCode,
        customer_character_id: character.id,

        service_type: serviceType,
        equipment_name: equipmentName,
        equipment_type: equipmentType,
        tier,
        required_rank: requiredRank,
        material,
        description,

        effect_name: effectName,
        effect_detail: effectDetail,
        effect_limit: effectLimit,
        effect_weakness: effectWeakness,

        durability_max: 5,
        durability_current: 5,
        condition_status: "Baik",

        status: "Pending",
        customer_note: customerNote,
      })
      .select("*")
      .single();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message || "Gagal membuat blacksmith order." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Blacksmith order berhasil dibuat.",
      order,
      ticket: {
        order_code: order.order_code,
        customer: character.character_name,
        service_type: order.service_type,
        equipment_name: order.equipment_name,
        equipment_type: order.equipment_type,
        tier: order.tier,
        status: order.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal membuat blacksmith order." },
      { status: 500 }
    );
  }
}
