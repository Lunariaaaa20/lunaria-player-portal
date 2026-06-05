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

function countBy(list, field) {
  return list.reduce((acc, item) => {
    const key = item[field] || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminClient();

    const [questsResult, economyResult, rulesResult] = await Promise.all([
      supabase.from("quests").select("id,status,rank,mode"),
      supabase.from("economy_items").select("id,category,availability,currency_type"),
      supabase.from("rules").select("id,category,status,priority"),
    ]);

    if (questsResult.error) {
      return NextResponse.json({ error: questsResult.error.message }, { status: 500 });
    }

    if (economyResult.error) {
      return NextResponse.json({ error: economyResult.error.message }, { status: 500 });
    }

    if (rulesResult.error) {
      return NextResponse.json({ error: rulesResult.error.message }, { status: 500 });
    }

    const quests = questsResult.data || [];
    const economyItems = economyResult.data || [];
    const rules = rulesResult.data || [];

    return NextResponse.json({
      quests: {
        total: quests.length,
        byStatus: countBy(quests, "status"),
        byRank: countBy(quests, "rank"),
        byMode: countBy(quests, "mode"),
      },
      economy: {
        total: economyItems.length,
        byAvailability: countBy(economyItems, "availability"),
        byCategory: countBy(economyItems, "category"),
        byCurrency: countBy(economyItems, "currency_type"),
      },
      rules: {
        total: rules.length,
        byStatus: countBy(rules, "status"),
        byCategory: countBy(rules, "category"),
        byPriority: countBy(rules, "priority"),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
