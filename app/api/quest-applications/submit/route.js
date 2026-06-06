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

const rankPower = {
  Initiate: 1,
  Seeker: 2,
  Warden: 3,
  Arbiter: 4,
  "High Council": 5,
};

const questRequirement = {
  Common: 1,
  Uncommon: 2,
  Dangerous: 3,
  Special: 4,
};

function canTakeQuest(characterRank, questRank) {
  const characterLevel = rankPower[characterRank] || 0;
  const requiredLevel = questRequirement[questRank] || 99;

  return characterLevel >= requiredLevel;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const { character_id, quest_id, party_members = "", application_note = "" } = body;

    if (!character_id) {
      return NextResponse.json({ error: "Character wajib dipilih." }, { status: 400 });
    }

    if (!quest_id) {
      return NextResponse.json({ error: "Quest wajib dipilih." }, { status: 400 });
    }

    const supabase = getServerClient();

    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id,player_name,character_name,guild_rank,status")
      .eq("id", character_id)
      .single();

    if (characterError) {
      return NextResponse.json({ error: characterError.message }, { status: 500 });
    }

    if (!character || character.status !== "Active") {
      return NextResponse.json(
        { error: "Character belum Active atau tidak valid." },
        { status: 400 }
      );
    }

    const { data: quest, error: questError } = await supabase
      .from("quests")
      .select("id,title,rank,mode,location,status")
      .eq("id", quest_id)
      .single();

    if (questError) {
      return NextResponse.json({ error: questError.message }, { status: 500 });
    }

    if (!quest || quest.status !== "Available") {
      return NextResponse.json(
        { error: "Quest tidak Available." },
        { status: 400 }
      );
    }

    if (!canTakeQuest(character.guild_rank, quest.rank)) {
      return NextResponse.json(
        { error: `${character.guild_rank} belum memenuhi syarat untuk mengambil quest ${quest.rank}.` },
        { status: 400 }
      );
    }

    if ((quest.mode === "Duo" || quest.mode === "Party") && !party_members.trim()) {
      return NextResponse.json(
        { error: `Quest mode ${quest.mode} wajib isi party members.` },
        { status: 400 }
      );
    }

    const { data: activeApplications, error: activeError } = await supabase
      .from("quest_applications")
      .select("id,status")
      .eq("character_id", character_id)
      .in("status", ["Pending Approval", "Approved", "Ongoing"]);

    if (activeError) {
      return NextResponse.json({ error: activeError.message }, { status: 500 });
    }

    if ((activeApplications || []).length > 0) {
      return NextResponse.json(
        { error: "Character ini masih punya quest application aktif. Selesaikan atau archive dulu sebelum mengambil quest baru." },
        { status: 400 }
      );
    }

    const payload = {
      character_id: character.id,
      quest_id: quest.id,
      player_name: character.player_name,
      character_name: character.character_name,
      character_rank: character.guild_rank,
      quest_title: quest.title,
      quest_rank: quest.rank,
      quest_mode: quest.mode,
      quest_location: quest.location || "",
      party_members,
      application_note,
      status: "Pending Approval",
      admin_notes: "",
    };

    const { error: insertError } = await supabase
      .from("quest_applications")
      .insert([payload]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Quest application submitted. Waiting for admin approval.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
