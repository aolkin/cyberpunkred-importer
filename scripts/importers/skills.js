const SKILL_TYPE_MAP = {
    0: "Athletics",
    1: "Basic Tech",
    2: "Brawling",
    3: "Bribery",
    4: "Concentration",
    5: "Conversation",
    6: "Cybertech",
    7: "Drive Land Vehicle",
    8: "Education",
    9: "Evasion",
    10: "First Aid",
    11: "Interface",
    12: "Interrogation",
    13: "Human Perception",
    14: "Local Expert",
    16: "Melee Weapon",
    17: "Perception",
    18: "Persuasion",
    19: "Play Instrument",
    20: "Stealth",
    21: "Tracking",
    22: "Conceal/Reveal Object",
    23: "Lip Reading",
    24: "Contortionist",
    25: "Dance",
    26: "Resist Torture/Drugs",
    27: "Pilot Air Vehicle",
    28: "Pilot Sea Vehicle",
    29: "Riding",
    30: "Accounting",
    31: "Animal Handling",
    32: "Bureaucracy",
    33: "Business",
    34: "Composition",
    35: "Criminology",
    36: "Cryptography",
    37: "Deduction",
    38: "Gamble",
    39: "Language",
    40: "Library Search",
    41: "Science",
    42: "Tactics",
    43: "Wilderness Survival",
    44: "Martial Arts",
    45: "Acting",
    46: "Archery",
    47: "Autofire",
    48: "Handgun",
    49: "Heavy Weapons",
    50: "Shoulder Arms",
    51: "Personal Grooming",
    52: "Streetwise",
    53: "Trading",
    54: "Wardrobe & Style",
    55: "Air Vehicle Tech",
    56: "Demolitions",
    57: "Electronics/Security Tech",
    58: "Forgery",
    59: "Land Vehicle Tech",
    60: "Paint/Draw/Sculpt",
    61: "Paramedic",
    62: "Photography/Film",
    63: "Pick Lock",
    64: "Pick Pocket",
    65: "Sea Vehicle Tech",
    66: "Weaponstech",
    67: "Endurance",
    68: "Language (Streetslang)",
    69: "Surgery",
    70: "Medical Tech"
}

const SKILL_NAME_MAP_V2 = {
    "Accounting": "Accounting",
    "Acting": "Acting",
    "AirVehicleTech": "Air Vehicle Tech",
    "AnimalHandling": "Animal Handling",
    "Archery": "Archery",
    "Athletics": "Athletics",
    "Autofire": "Autofire",
    "BasicTech": "Basic Tech",
    "Brawling": "Brawling",
    "Bribery": "Bribery",
    "Bureaucracy": "Bureaucracy",
    "Business": "Business",
    "Composition": "Composition",
    "ConcealRevealObject": "Conceal/Reveal Object",
    "Concentration": "Concentration",
    "Contortionist": "Contortionist",
    "Conversation": "Conversation",
    "Criminology": "Criminology",
    "Cryptography": "Cryptography",
    "Cybertech": "Cybertech",
    "Dance": "Dance",
    "Deduction": "Deduction",
    "Demolitions": "Demolitions",
    "DriveLandVehicle": "Drive Land Vehicle",
    "Education": "Education",
    "ElectronicsSecurityTech": "Electronics/Security Tech",
    "Endurance": "Endurance",
    "Evasion": "Evasion",
    "FirstAid": "First Aid",
    "Forgery": "Forgery",
    "Gamble": "Gamble",
    "Handgun": "Handgun",
    "HeavyWeapons": "Heavy Weapons",
    "HumanPerception": "Human Perception",
    "Interrogation": "Interrogation",
    "LandVehicleTech": "Land Vehicle Tech",
    "Language": "Language (Streetslang)",
    "LibrarySearch": "Library Search",
    "LipReading": "Lip Reading",
    "LocalExpert": "Local Expert",
    "MartialArts": "Martial Arts",
    "MedicalTech": "Medical Tech",
    "MeleeWeapon": "Melee Weapon",
    "PaintDrawSculpt": "Paint/Draw/Sculpt",
    "Paramedic": "Paramedic",
    "Perception": "Perception",
    "PersonalGrooming": "Personal Grooming",
    "Persuasion": "Persuasion",
    "PhotographyFilm": "Photography/Film",
    "PickLock": "Pick Lock",
    "PickPocket": "Pick Pocket",
    "PilotAir": "Pilot Air Vehicle",
    "PilotSea": "Pilot Sea Vehicle",
    "PlayInstrument": "Play Instrument",
    "ResistTortureDrugs": "Resist Torture/Drugs",
    "Riding": "Riding",
    "Science": "Science",
    "SeaVehicleTech": "Sea Vehicle Tech",
    "ShoulderArms": "Shoulder Arms",
    "Stealth": "Stealth",
    "Streetwise": "Streetwise",
    "Surgery": "Surgery",
    "Tactics": "Tactics",
    "Tracking": "Tracking",
    "Trading": "Trading",
    "WardrobeAndStyle": "Wardrobe & Style",
    "WeaponsTech": "Weaponstech",
    "WildernessSurvival": "Wilderness Survival"
}

function updateSkillsV1(data, actor) {
    return data.skill.map(async (skillData) => {
        const skillName = SKILL_TYPE_MAP[skillData.skill_type_id];
        const skillItem = actor.items.getName(skillName);
        if (skillItem) {
            await skillItem.update({ system: { level: skillData.points } });
        } else {
            ui.notifications.warn(`Unable to find item to set level for skill: ${skillName}`);
        }
    });
}

const BLOCKED_SKILL_NAMES = ['MedicalTech', 'Surgery'];

function updateSkillsV2(data, actor) {
    return Object.entries(data.skills).map(async ([skillName, level]) => {
        const skillItem = actor.items.getName(SKILL_NAME_MAP_V2[skillName]);
        if (skillItem) {
            await skillItem.update({ system: { level } });
        } else if (!BLOCKED_SKILL_NAMES.includes(skillName)) {
            ui.notifications.warn(`Unable to find item to set level for skill: ${skillName}`);
        }
    });
}

export async function updateSkills(data, actor, isV2) {
    const skillUpdates = isV2 ? updateSkillsV2(data, actor) : updateSkillsV1(data, actor);
    await Promise.all(skillUpdates);
}
