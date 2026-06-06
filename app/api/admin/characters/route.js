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
}\n\nfunction generateClaimCode(characterName) {
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
      ...body,
      gold: Number(body.gold || 0),
      silver: Number(body.silver || 0),
      bronze: Number(body.bronze || 0),
      updated_at: new Date().toISOString(),
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing character id." }, { status: 400 });
    }

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

      const { error: updateCodeError } = await supabase
        .from("characters")
        .update({
          claim_code: nextCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateCodeError) {
        return NextResponse.json({ error: updateCodeError.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, claim_code: nextCode });
    }

    const supabase = getAdminClient();

    const payload = {
      ...updates,
      gold: Number(updates.gold || 0),
      silver: Number(updates.silver || 0),
      bronze: Number(updates.bronze || 0),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("characters")
      .update(payload)
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

    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: "Missing character id." }, { status: 400 });
    }

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

      const { error: updateCodeError } = await supabase
        .from("characters")
        .update({
          claim_code: nextCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateCodeError) {
        return NextResponse.json({ error: updateCodeError.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, claim_code: nextCode });
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
