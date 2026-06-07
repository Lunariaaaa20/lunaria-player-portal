import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";


const rankPower = {
  Initiate: 1,
  Seeker: 2,
  Warden: 3,
  Arbiter: 4,
  "High Council": 5,
};

const tierRules = {
  Basic: {
    requiredRank: "Initiate",
    playerAllowed: true,
    adminApproval: false,
    note: "Basic equipment for Initiate+.",
  },
  Elite: {
    requiredRank: "Seeker",
    playerAllowed: true,
    adminApproval: false,
    note: "Elite equipment for Seeker+.",
  },
  Special: {
    requiredRank: "Warden",
    playerAllowed: true,
    adminApproval: true,
    note: "Special equipment requires admin approval.",
  },
  Epic: {
    requiredRank: "Arbiter",
    playerAllowed: false,
    adminApproval: true,
    note: "Epic equipment is Event/Admin Only.",
  },
  Legend: {
    requiredRank: "High Council",
    playerAllowed: false,
    adminApproval: true,
    note: "Legend equipment is Story/Major Event Only.",
  },
};

const priceGuide = {
  Basic: {
    Weapon: "5S–25S",
    Armor: "10S–40S",
    Repair: "2S–10S",
  },
  Elite: {
    Weapon: "40S–120S",
    Armor: "45S–150S",
    Repair: "8S–30S",
  },
  Special: {
    Weapon: "130S–300S",
    Armor: "150S–350S",
    Repair: "25S–90S",
  },
  Epic: {
    Weapon: "400S–800S",
    Armor: "450S–900S",
    Repair: "100S–300S",
  },
  Legend: {
    Weapon: "1G+",
    Armor: "1G+",
    Repair: "Admin Only",
  },
};

function getRankPower(rank) {
  return rankPower[rank] || 0;
}

function getBlacksmithStatus(tier) {
  const rule = tierRules[tier];

  if (!rule) return "Pending";

  if (rule.adminApproval) return "Pending Admin Approval";

  return "Pending Pricing";
}

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
      .select("id, character_name, guild_rank, status")
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

    const tierRule = tierRules[tier];

    if (!tierRule) {
      return NextResponse.json(
        { error: "Tier blacksmith tidak valid." },
        { status: 400 }
      );
    }

    if (!["Buy", "Custom Order", "Repair"].includes(serviceType)) {
      return NextResponse.json(
        { error: "Service type tidak valid." },
        { status: 400 }
      );
    }

    if (!["Weapon", "Armor", "Repair", "Equipment"].includes(equipmentType)) {
      return NextResponse.json(
        { error: "Equipment type tidak valid." },
        { status: 400 }
      );
    }

    if (serviceType === "Repair" && equipmentType !== "Repair") {
      return NextResponse.json(
        { error: "Jika service Repair, equipment type harus Repair." },
        { status: 400 }
      );
    }

    if (serviceType !== "Repair" && equipmentType === "Repair") {
      return NextResponse.json(
        { error: "Equipment type Repair hanya boleh untuk service Repair." },
        { status: 400 }
      );
    }

    if (!tierRule.playerAllowed) {
      return NextResponse.json(
        { error: `${tier} tidak bisa dipesan langsung oleh player. ${tierRule.note}` },
        { status: 403 }
      );
    }

    const characterRankPower = getRankPower(character.guild_rank);
    const requiredRankPower = getRankPower(tierRule.requiredRank);

    if (characterRankPower < requiredRankPower) {
      return NextResponse.json(
        {
          error: `${character.character_name} belum memenuhi syarat rank. ${tier} membutuhkan minimal ${tierRule.requiredRank}. Rank sekarang: ${character.guild_rank}.`,
        },
        { status: 403 }
      );
    }

    const finalRequiredRank = tierRule.requiredRank;
    const finalStatus = getBlacksmithStatus(tier);
    const pricingGuide = priceGuide[tier]?.[equipmentType] || priceGuide[tier]?.Weapon || "Admin Pricing";

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
        required_rank: finalRequiredRank,
        material,
        description,

        effect_name: effectName,
        effect_detail: effectDetail,
        effect_limit: effectLimit,
        effect_weakness: effectWeakness,

        durability_max: 5,
        durability_current: 5,
        condition_status: "Baik",

        status: finalStatus,
        admin_note: `Price Guide: ${pricingGuide}. ${tierRule.note}`,
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
        price_guide: pricingGuide,
        admin_note: order.admin_note,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal membuat blacksmith order." },
      { status: 500 }
    );
  }
}
