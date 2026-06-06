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

function appendTextList(currentText, newText) {
  if (!newText || String(newText).trim() === "") {
    return currentText || "";
  }

  if (!currentText || String(currentText).trim() === "") {
    return String(newText).trim();
  }

  return `${String(currentText).trim()}\n${String(newText).trim()}`;
}

function appendCompletedQuest(currentCompleted, questTitle) {
  if (!questTitle || String(questTitle).trim() === "") {
    return currentCompleted || "";
  }

  const title = String(questTitle).trim();
  const current = currentCompleted || "";

  const existingTitles = current
    .split("\n")
    .map((item) => item.replace(/^•\s*/, "").trim())
    .filter(Boolean);

  if (existingTitles.includes(title)) {
    return current;
  }

  const line = `• ${title}`;

  if (!current.trim()) {
    return line;
  }

  return `${current.trim()}\n${line}`;
}

function normalizeRewardEntry(entry) {
  return {
    character_id: entry.character_id || "",
    character_name: entry.character_name || "",
    gold: Number(entry.gold || 0),
    silver: Number(entry.silver || 0),
    bronze: Number(entry.bronze || 0),
    inventory: entry.inventory || "",
    rank: entry.rank || "",
  };
}

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("quest_reports")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports: data ?? [] });
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

    const {
      id,
      status,
      admin_notes,
      character_id,
      approved_gold = 0,
      approved_silver = 0,
      approved_bronze = 0,
      approved_inventory = "",
      approved_rank = "",
      reward_distribution = [],
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing report id." }, { status: 400 });
    }

    const allowedStatuses = [
      "Pending Review",
      "Approved",
      "Rejected",
      "Needs Revision",
      "Archived",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid report status." }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: existingReport, error: existingReportError } = await supabase
      .from("quest_reports")
      .select("id,status,quest_title,quest_application_id,quest_id,character_id")
      .eq("id", id)
      .single();

    if (existingReportError) {
      return NextResponse.json({ error: existingReportError.message }, { status: 500 });
    }

    if (existingReport.status === "Approved" && status === "Approved") {
      return NextResponse.json(
        { error: "Report ini sudah Approved. Reward tidak bisa diaplikasikan dua kali." },
        { status: 400 }
      );
    }

    let normalizedDistribution = Array.isArray(reward_distribution)
      ? reward_distribution.map(normalizeRewardEntry).filter((entry) => entry.character_id)
      : [];

    if (status === "Approved" && normalizedDistribution.length === 0 && character_id) {
      normalizedDistribution = [
        {
          character_id,
          character_name: "",
          gold: Number(approved_gold || 0),
          silver: Number(approved_silver || 0),
          bronze: Number(approved_bronze || 0),
          inventory: approved_inventory || "",
          rank: approved_rank || "",
        },
      ];
    }

    if (status === "Approved" && normalizedDistribution.length === 0) {
      return NextResponse.json(
        { error: "Reward distribution kosong. Pilih minimal 1 character target." },
        { status: 400 }
      );
    }

    const reportPayload = {
      status,
      admin_notes: admin_notes || "",
      reviewed_at: new Date().toISOString(),
      reward_distribution: normalizedDistribution,
    };

    if (normalizedDistribution.length === 1) {
      reportPayload.character_id = normalizedDistribution[0].character_id;
      reportPayload.approved_gold = normalizedDistribution[0].gold;
      reportPayload.approved_silver = normalizedDistribution[0].silver;
      reportPayload.approved_bronze = normalizedDistribution[0].bronze;
      reportPayload.approved_inventory = normalizedDistribution[0].inventory;
      reportPayload.approved_rank = normalizedDistribution[0].rank;
    } else {
      reportPayload.character_id = existingReport.character_id || normalizedDistribution[0]?.character_id || null;
      reportPayload.approved_gold = 0;
      reportPayload.approved_silver = 0;
      reportPayload.approved_bronze = 0;
      reportPayload.approved_inventory = "";
      reportPayload.approved_rank = "";
    }

    const { error: reportError } = await supabase
      .from("quest_reports")
      .update(reportPayload)
      .eq("id", id);

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    if (status === "Approved") {
      if (existingReport.quest_application_id) {
        const { error: applicationUpdateError } = await supabase
          .from("quest_applications")
          .update({
            status: "Completed",
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", existingReport.quest_application_id);

        if (applicationUpdateError) {
          return NextResponse.json({ error: applicationUpdateError.message }, { status: 500 });
        }
      }

      if (existingReport.quest_id) {
        const { error: questUpdateError } = await supabase
          .from("quests")
          .update({ status: "Completed" })
          .eq("id", existingReport.quest_id);

        if (questUpdateError) {
          return NextResponse.json({ error: questUpdateError.message }, { status: 500 });
        }
      }

      for (const reward of normalizedDistribution) {
        const { data: character, error: characterError } = await supabase
          .from("characters")
          .select("id,gold,silver,bronze,inventory,guild_rank,completed_quests")
          .eq("id", reward.character_id)
          .single();

        if (characterError) {
          return NextResponse.json({ error: characterError.message }, { status: 500 });
        }

        const characterPayload = {
          gold: Number(character.gold || 0) + Number(reward.gold || 0),
          silver: Number(character.silver || 0) + Number(reward.silver || 0),
          bronze: Number(character.bronze || 0) + Number(reward.bronze || 0),
          inventory: appendTextList(character.inventory, reward.inventory),
          completed_quests: appendCompletedQuest(character.completed_quests, existingReport.quest_title),
          updated_at: new Date().toISOString(),
        };

        if (reward.rank && String(reward.rank).trim() !== "") {
          characterPayload.guild_rank = reward.rank;
        }

        const { error: updateCharacterError } = await supabase
          .from("characters")
          .update(characterPayload)
          .eq("id", reward.character_id);

        if (updateCharacterError) {
          return NextResponse.json({ error: updateCharacterError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
