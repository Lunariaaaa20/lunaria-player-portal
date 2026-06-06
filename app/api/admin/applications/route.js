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

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("quest_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ applications: data ?? [] });
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
    const { id, status, admin_notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing application id." }, { status: 400 });
    }

    const allowedStatuses = [
      "Pending Approval",
      "Approved",
      "Rejected",
      "Ongoing",
      "Completed",
      "Archived",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid application status." }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: application, error: applicationError } = await supabase
      .from("quest_applications")
      .select("id,quest_id,status")
      .eq("id", id)
      .single();

    if (applicationError) {
      return NextResponse.json({ error: applicationError.message }, { status: 500 });
    }

    const { error } = await supabase
      .from("quest_applications")
      .update({
        status,
        admin_notes: admin_notes || "",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (application?.quest_id) {
      let nextQuestStatus = null;

      if (["Approved", "Ongoing", "Completed"].includes(status)) {
        nextQuestStatus = "Unavailable";
      }

      if (["Rejected", "Archived"].includes(status)) {
        nextQuestStatus = "Available";
      }

      if (nextQuestStatus) {
        const { error: questError } = await supabase
          .from("quests")
          .update({ status: nextQuestStatus })
          .eq("id", application.quest_id);

        if (questError) {
          return NextResponse.json({ error: questError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
