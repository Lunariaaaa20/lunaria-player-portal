import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function isAuthorized(request) {
  const password = request.headers.get("x-admin-password");
  return password && password === process.env.ADMIN_PASSWORD;
}

function appendInventory(currentInventory, approvedInventory) {
  if (!approvedInventory || approvedInventory.trim() === "") {
    return currentInventory || "";
  }

  if (!currentInventory || currentInventory.trim() === "") {
    return approvedInventory.trim();
  }

  return `${currentInventory.trim()}\n${approvedInventory.trim()}`;
}

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("quest_reports")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      id,
      status,
      admin_notes,
      character_id,
      approved_gold = 0,
      approved_silver = 0,
      approved_bronze = 0,
      approved_inventory = "",
      approved_rank = "",
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing report id." }, { status: 400 });
    }

    const allowedStatuses = [
      "Pending Review",
      "Approved",
      "Rejected",
      "Needs Revision",
      "Archived",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid report status." }, { status: 400 });
    }

    const supabase = getAdminClient();

    const reportPayload = {
      status,
      admin_notes: admin_notes || "",
      reviewed_at: new Date().toISOString(),
      character_id: character_id || null,
      approved_gold: Number(approved_gold || 0),
      approved_silver: Number(approved_silver || 0),
      approved_bronze: Number(approved_bronze || 0),
      approved_inventory: approved_inventory || "",
      approved_rank: approved_rank || "",
    };

    const { error: reportError } = await supabase
      .from("quest_reports")
      .update(reportPayload)
      .eq("id", id);

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    if (status === "Approved" && character_id) {
      const { data: character, error: characterError } = await supabase
        .from("characters")
        .select("gold,silver,bronze,inventory,guild_rank")
        .eq("id", character_id)
        .single();

      if (characterError) {
        return NextResponse.json({ error: characterError.message }, { status: 500 });
      }

      const characterPayload = {
        gold: Number(character.gold || 0) + Number(approved_gold || 0),
        silver: Number(character.silver || 0) + Number(approved_silver || 0),
        bronze: Number(character.bronze || 0) + Number(approved_bronze || 0),
        inventory: appendInventory(character.inventory, approved_inventory),
        updated_at: new Date().toISOString(),
      };

      if (approved_rank && approved_rank.trim() !== "") {
        characterPayload.guild_rank = approved_rank;
      }

      const { error: updateCharacterError } = await supabase
        .from("characters")
        .update(characterPayload)
        .eq("id", character_id);

      if (updateCharacterError) {
        return NextResponse.json({ error: updateCharacterError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
