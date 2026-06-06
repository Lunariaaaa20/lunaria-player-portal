import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request) {
  try {
    const body = await request.json();

    const requiredFields = [
      "player_name",
      "character_name",
      "race",
      "pathway",
      "skill_1_name",
      "skill_1_description",
      "skill_2_name",
      "skill_2_description",
    ];

    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        return NextResponse.json(
          { error: `Field ${field} wajib diisi.` },
          { status: 400 }
        );
      }
    }

    const supabase = getServerClient();

    const payload = {
      player_name: body.player_name,
      character_name: body.character_name,
      race: body.race,
      guild_rank: "Initiate",
      pathway: body.pathway,
      skill_1_name: body.skill_1_name,
      skill_1_description: body.skill_1_description,
      skill_2_name: body.skill_2_name,
      skill_2_description: body.skill_2_description,
      inventory: body.inventory || "",
      gold: 0,
      silver: 0,
      bronze: 0,
      registered_guild: "Adventurer’s Guild of Valenford",
      status: "Pending",
      admin_notes: "Submitted from public registration form.",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("characters").insert([payload]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Character registration submitted. Waiting for admin approval.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
