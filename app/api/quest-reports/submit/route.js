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
      "quest_application_id",
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

    const { data: application, error: applicationError } = await supabase
      .from("quest_applications")
      .select("*")
      .eq("id", body.quest_application_id)
      .single();

    if (applicationError) {
      return NextResponse.json({ error: applicationError.message }, { status: 500 });
    }

    if (!application || !["Approved", "Ongoing"].includes(application.status)) {
      return NextResponse.json(
        { error: "Quest application belum Approved/Ongoing atau tidak valid." },
        { status: 400 }
      );
    }

    const { data: existingReports, error: existingError } = await supabase
      .from("quest_reports")
      .select("id,status")
      .eq("quest_application_id", application.id)
      .in("status", ["Pending Review", "Approved", "Needs Revision"]);

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if ((existingReports || []).length > 0) {
      return NextResponse.json(
        { error: "Quest application ini sudah punya report aktif." },
        { status: 400 }
      );
    }

    const payload = {
      quest_application_id: application.id,
      character_id: application.character_id,
      quest_id: application.quest_id,

      player_name: application.player_name,
      character_name: application.character_name,
      quest_title: application.quest_title,
      quest_rank: application.quest_rank,
      quest_mode: application.quest_mode,
      quest_location: application.quest_location || "",

      result_summary: body.result_summary,
      proof_link: body.proof_link || "",
      injury_report: body.injury_report || "",
      loot_claim: body.loot_claim || "",
      reward_request: body.loot_claim || "",

      status: "Pending Review",
      admin_notes: "Submitted from approved quest application.",
    };

    const { error: insertError } = await supabase
      .from("quest_reports")
      .insert([payload]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { error: updateApplicationError } = await supabase
      .from("quest_applications")
      .update({
        status: "Completed",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (updateApplicationError) {
      return NextResponse.json({ error: updateApplicationError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Quest report submitted from approved application.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
