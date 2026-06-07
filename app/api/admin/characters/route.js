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

function generateClaimCode(characterName) {
  const cleaned = String(characterName || "LUN")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  const prefix = (cleaned.slice(0, 3) || "LUN").padEnd(3, "X");
  const number = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${number}`;
}

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ characters: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getAdminClient();

    const payload = {
      player_name: body.player_name || "",
      character_name: body.character_name || "",
      race: body.race || "",
      guild_rank: body.guild_rank || "Initiate",
      pathway: body.pathway || "",
      skill_1_name: body.skill_1_name || "",
      skill_1_description: body.skill_1_description || "",
      skill_2_name: body.skill_2_name || "",
      skill_2_description: body.skill_2_description || "",
      gold: Number(body.gold || 0),
      silver: Number(body.silver || 0),
      bronze: Number(body.bronze || 0),
      inventory: body.inventory || "",
      completed_quests: body.completed_quests || "",
      status: body.status || "Pending",
      admin_notes: body.admin_notes || "",
      claim_code: body.claim_code || generateClaimCode(body.character_name),
    };

    const { error } = await supabase.from("characters").insert([payload]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
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
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing character id." }, { status: 400 });
    }

    const supabase = getAdminClient();

    if (action === "regenerate_claim_code") {
      const { data: character, error: characterError } = await supabase
        .from("characters")
        .select("id,character_name")
        .eq("id", id)
        .single();

      if (characterError) {
        return NextResponse.json({ error: characterError.message }, { status: 500 });
      }

      const nextCode = generateClaimCode(character.character_name);

      const { error: updateError } = await supabase
        .from("characters")
        .update({
          claim_code: nextCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, claim_code: nextCode });
    }

    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    const editableFields = [
      "player_name",
      "character_name",
      "race",
      "guild_rank",
      "pathway",
      "skill_1_name",
      "skill_1_description",
      "skill_2_name",
      "skill_2_description",
      "gold",
      "silver",
      "bronze",
      "inventory",
      "completed_quests",
      "status",
      "admin_notes",
    ];

    for (const field of editableFields) {
      if (body[field] !== undefined) {
        if (["gold", "silver", "bronze"].includes(field)) {
          updatePayload[field] = Number(body[field] || 0);
        } else {
          updatePayload[field] = body[field];
        }
      }
    }

    if (body.status === "Active") {
      const { data: currentCharacter, error: currentError } = await supabase
        .from("characters")
        .select("id,character_name,claim_code")
        .eq("id", id)
        .single();

      if (currentError) {
        return NextResponse.json({ error: currentError.message }, { status: 500 });
      }

      if (!currentCharacter.claim_code || String(currentCharacter.claim_code).trim() === "") {
        updatePayload.claim_code = generateClaimCode(currentCharacter.character_name);
      }
    }

    const { error } = await supabase
      .from("characters")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        id = null;
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Missing character id." }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
