import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET() {
  try {
    const supabase = getServerClient();

    const { data: applications, error: applicationsError } = await supabase
      .from("quest_applications")
      .select("*")
      .in("status", ["Approved", "Ongoing"])
      .order("created_at", { ascending: false });

    if (applicationsError) {
      return NextResponse.json(
        { error: applicationsError.message },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const applicationIds = (applications || []).map((item) => item.id);

    if (applicationIds.length === 0) {
      return NextResponse.json(
        { applications: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: reports, error: reportsError } = await supabase
      .from("quest_reports")
      .select("quest_application_id,status")
      .in("quest_application_id", applicationIds)
      .in("status", ["Pending Review", "Approved", "Needs Revision"]);

    if (reportsError) {
      return NextResponse.json(
        { error: reportsError.message },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const reportedApplicationIds = new Set(
      (reports || [])
        .map((report) => report.quest_application_id)
        .filter(Boolean)
    );

    const availableApplications = (applications || []).filter(
      (application) => !reportedApplicationIds.has(application.id)
    );

    return NextResponse.json(
      { applications: availableApplications },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
