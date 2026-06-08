export function formatValue(value, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length ? text : fallback;
}

export function buildIdCard(character = {}) {
  const playerName = formatValue(character.player_name);
  const characterName = formatValue(character.character_name);
  const race = formatValue(character.race);
  const status = formatValue(character.status, "Active");

  const guildRank = formatValue(character.guild_rank, "Unranked");
  const pathway = formatValue(character.pathway);
  const registeredGuild = formatValue(
    character.registered_guild,
    "Adventurer’s Guild of Valenford"
  );

  const skill1Name = formatValue(character.skill_1_name);
  const skill1Desc = formatValue(character.skill_1_description);
  const skill2Name = formatValue(character.skill_2_name);
  const skill2Desc = formatValue(character.skill_2_description);

  const inventory = formatValue(character.inventory);

  const gold = Number(character.gold || 0);
  const silver = Number(character.silver || 0);
  const bronze = Number(character.bronze || 0);

  const completedQuests = formatValue(character.completed_quests);
  const lastUpdated = formatValue(character.updated_at || character.submitted_at);
  const claimCode = formatValue(character.claim_code);

  return `╔════════════════════════════╗
        LUNARIA GUILD ID
╚════════════════════════════╝

✦ PLAYER DATA
Player Name     : ${playerName}
Character Name  : ${characterName}
Race            : ${race}
Status          : ${status}

✦ GUILD PROFILE
Guild Rank      : ${guildRank}
Pathway         : ${pathway}
Registered Guild: ${registeredGuild}

✦ PRIMARY SKILLS
1. ${skill1Name}
   ${skill1Desc}

2. ${skill2Name}
   ${skill2Desc}

✦ INVENTORY
${inventory}

✦ CURRENCY
Gold   : ${gold}G
Silver : ${silver}S
Bronze : ${bronze}B

✦ RECORD
Completed Missions : ${completedQuests}
Last Updated        : ${lastUpdated}
Issued By           : Adventurer’s Guild of Valenford
Claim Code          : Admin Only`;
}
