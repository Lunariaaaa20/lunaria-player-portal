import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get("character_id");

    if (!characterId) {
      return NextResponse.json({ error: "Missing character_id." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("character_id", characterId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.character_id) {
      return NextResponse.json({ error: "Missing character_id." }, { status: 400 });
    }

    const payload = {
      character_id: body.character_id,
      bio: body.bio || "",
      age: body.age || "",
      appearance: body.appearance || "",
      personality: body.personality || "",
      quote: body.quote || "",
      backstory: body.backstory || "",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "character_id" })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Profile berhasil disimpan.",
      profile: data,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
