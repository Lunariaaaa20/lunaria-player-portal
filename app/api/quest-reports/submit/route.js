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
      "quest_title",
      "quest_rank",
      "quest_mode",
      "result_summary",
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
      quest_title: body.quest_title,
      quest_rank: body.quest_rank,
      quest_mode: body.quest_mode,
      quest_location: body.quest_location || "",
      result_summary: body.result_summary,
      proof_link: body.proof_link || "",
      reward_request: body.reward_request || "",
      status: "Pending Review",
      admin_notes: "Submitted from public quest report form.",
    };

    const { error } = await supabase.from("quest_reports").insert([payload]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Quest report submitted. Waiting for admin review.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
