import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("portal_notices")
      .select("id, title, message, is_active, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notice: data?.[0] || null });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const title = String(body.title || "Developer Notice").trim();
    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json(
        { error: "Notice message is required." },
        { status: 400 }
      );
    }

    const { error: deactivateError } = await supabaseAdmin
      .from("portal_notices")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) {
      return NextResponse.json({ error: deactivateError.message }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("portal_notices")
      .insert({
        title,
        message,
        is_active: true,
      })
      .select("id, title, message, is_active, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notice: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
