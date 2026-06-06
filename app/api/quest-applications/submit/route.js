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

function uniqueList(list) {
  return [...new Set((list || []).filter(Boolean))];
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      character_id,
      quest_id,
      party_member_ids = [],
      application_note = "",
    } = body;

    if (!character_id) {
      return NextResponse.json({ error: "Main Character wajib dipilih." }, { status: 400 });
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
        { error: "Main Character belum Active atau tidak valid." },
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
        { error: "Quest ini sudah tidak Available atau sedang diambil player lain." },
        { status: 400 }
      );
    }

    const cleanPartyIds = uniqueList(party_member_ids);

    if (cleanPartyIds.includes(character_id)) {
      return NextResponse.json(
        { error: "Main Character tidak boleh menjadi party member dirinya sendiri." },
        { status: 400 }
      );
    }

    if (quest.mode === "Solo" && cleanPartyIds.length > 0) {
      return NextResponse.json(
        { error: "Quest Solo tidak boleh memiliki party member." },
        { status: 400 }
      );
    }

    if (quest.mode === "Duo" && cleanPartyIds.length !== 1) {
      return NextResponse.json(
        { error: "Quest Duo wajib memiliki tepat 1 partner." },
        { status: 400 }
      );
    }

    if (quest.mode === "Party" && cleanPartyIds.length < 2) {
      return NextResponse.json(
        { error: "Quest Party wajib memiliki minimal 2 party member selain main character." },
        { status: 400 }
      );
    }

    let partyCharacters = [];

    if (cleanPartyIds.length > 0) {
      const { data: partyData, error: partyError } = await supabase
        .from("characters")
        .select("id,player_name,character_name,guild_rank,status")
        .in("id", cleanPartyIds);

      if (partyError) {
        return NextResponse.json({ error: partyError.message }, { status: 500 });
      }

      partyCharacters = partyData || [];

      if (partyCharacters.length !== cleanPartyIds.length) {
        return NextResponse.json(
          { error: "Ada party member yang tidak valid." },
          { status: 400 }
        );
      }

      const inactiveMember = partyCharacters.find((member) => member.status !== "Active");

      if (inactiveMember) {
        return NextResponse.json(
          { error: `Party member ${inactiveMember.character_name} belum Active.` },
          { status: 400 }
        );
      }
    }

    if (!canTakeQuest(character.guild_rank, quest.rank)) {
      return NextResponse.json(
        { error: `${character.guild_rank} belum memenuhi syarat untuk mengambil quest ${quest.rank}.` },
        { status: 400 }
      );
    }

    const allCharacterIds = [character_id, ...cleanPartyIds];

    const { data: activeApplications, error: activeError } = await supabase
      .from("quest_applications")
      .select("id,status,character_id,party_member_ids")
      .in("status", ["Pending Approval", "Approved", "Ongoing"]);

    if (activeError) {
      return NextResponse.json({ error: activeError.message }, { status: 500 });
    }

    const conflicted = (activeApplications || []).find((application) => {
      const applicationPartyIds = String(application.party_member_ids || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const involvedIds = [application.character_id, ...applicationPartyIds];

      return allCharacterIds.some((id) => involvedIds.includes(id));
    });

    if (conflicted) {
      return NextResponse.json(
        { error: "Salah satu karakter masih punya quest application aktif. Selesaikan atau archive dulu sebelum mengambil quest baru." },
        { status: 400 }
      );
    }

    const { data: questApplications, error: questAppError } = await supabase
      .from("quest_applications")
      .select("id,status")
      .eq("quest_id", quest_id)
      .in("status", ["Pending Approval", "Approved", "Ongoing"]);

    if (questAppError) {
      return NextResponse.json({ error: questAppError.message }, { status: 500 });
    }

    if ((questApplications || []).length > 0) {
      return NextResponse.json(
        { error: "Quest ini sudah diambil atau sedang menunggu approval." },
        { status: 400 }
      );
    }

    const partyMembersText = partyCharacters
      .map((member) => `${member.character_name} — ${member.player_name} — ${member.guild_rank}`)
      .join("\n");

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
      party_member_ids: cleanPartyIds.join(","),
      party_members: partyMembersText,
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

    const { error: questUpdateError } = await supabase
      .from("quests")
      .update({ status: "Unavailable" })
      .eq("id", quest.id);

    if (questUpdateError) {
      return NextResponse.json({ error: questUpdateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Quest application submitted. Quest dikunci sementara sampai admin review.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
