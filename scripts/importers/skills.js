import {CORE_SYSTEM_ID, getLocalizedItemNameVariants, namesMatch} from "./translations.js";

function duplicateDocumentData(document) {
    return foundry.utils.deepClone?.(document) ?? foundry.utils.duplicate(document);
}

function getItemDataFromDocument(itemDocument) {
    return itemDocument.toObject
        ? itemDocument.toObject()
        : duplicateDocumentData(itemDocument);
}

function prepareItemDataForActor(itemDocument, systemUpdates = {}) {
    const itemData = getItemDataFromDocument(itemDocument);
    delete itemData._id;
    delete itemData.folder;
    itemData.system = foundry.utils.mergeObject(
        itemData.system ?? {},
        systemUpdates,
        {inplace: false}
    );
    return itemData;
}

function getPack(packName) {
    return game.packs.get(`${CORE_SYSTEM_ID}.${packName}`);
}

async function getPackDocuments(packName) {
    const pack = getPack(packName);
    if (!pack) {
        console.debug(`Unable to find ${CORE_SYSTEM_ID}.${packName} compendium.`);
        return [];
    }
    return await pack.getDocuments();
}

async function findPackItem(itemName, packName) {
    const itemNames = await getLocalizedItemNameVariants(itemName, [packName]);
    const packDocuments = await getPackDocuments(packName);
    return packDocuments.find(item => itemNames.some(name => namesMatch(item.name, name)));
}

async function findActorItem(actor, itemName, itemType, packNames = []) {
    const itemNames = await getLocalizedItemNameVariants(itemName, packNames);
    return Array.from(actor.items.values())
        .filter(item => item.type === itemType)
        .find(item => itemNames.some(name => namesMatch(item.name, name)));
}

async function createActorItemFromPack(actor, itemName, packName, systemUpdates = {}) {
    const packItem = await findPackItem(itemName, packName);
    if (!packItem) {
        return;
    }

    const itemData = prepareItemDataForActor(packItem, systemUpdates);
    const [createdItem] = await actor.createEmbeddedDocuments("Item", [itemData]);
    return createdItem;
}

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

const SPECIAL_SKILL_DEFINITIONS = {
    Language: {
        prefix: "Language",
        packName: "core_skills-languages",
        sourceNames: ["Language", "Languages"],
        v1TypeIds: [39],
        system: {
            stat: "int",
            category: "educationSkills",
            difficulty: "typical",
            skillType: "language",
            basic: false,
            core: false
        }
    },
    LocalExpert: {
        prefix: "Local Expert",
        packName: "core_skills-local-expert",
        sourceNames: ["LocalExpert", "Local Expert", "LocalExperts", "Local Experts"],
        v1TypeIds: [14],
        system: {
            stat: "int",
            category: "educationSkills",
            difficulty: "typical",
            skillType: "localExpert",
            basic: false,
            core: false
        }
    },
    MartialArts: {
        prefix: "Martial Arts",
        packName: "core_skills-martial-arts",
        sourceNames: ["MartialArts", "Martial Arts", "MartialArt", "Martial Art"],
        v1TypeIds: [44],
        system: {
            stat: "dex",
            category: "fightingSkills",
            difficulty: "difficult",
            skillType: "martialArt",
            basic: false,
            core: false
        }
    },
    PlayInstrument: {
        prefix: "Play Instrument",
        packName: "core_skills-play-instrument",
        sourceNames: ["PlayInstrument", "Play Instrument", "PlayInstruments", "Play Instruments"],
        v1TypeIds: [19],
        system: {
            stat: "tech",
            category: "performanceSkills",
            difficulty: "typical",
            skillType: "playInstrument",
            basic: false,
            core: false
        }
    },
    Science: {
        prefix: "Science",
        packName: "core_skills-science",
        sourceNames: ["Science", "Sciences"],
        v1TypeIds: [41],
        system: {
            stat: "int",
            category: "educationSkills",
            difficulty: "typical",
            skillType: "science",
            basic: false,
            core: false
        }
    }
}

const SPECIAL_SKILL_CONTAINER_NAMES = [
    "subSkills"
]

const ROLE_ABILITY_SKILL_TYPE_IDS = [11, 69, 70]

const ROLE_ABILITY_SKILL_NAMES = [
    "Backup",
    "CharismaticImpact",
    "Charismatic Impact",
    "CombatAwareness",
    "Combat Awareness",
    "Credibility",
    "DamageDeflection",
    "Damage Deflection",
    "FabricationExpertise",
    "Fabrication Expertise",
    "FieldExpertise",
    "Field Expertise",
    "FumbleRecovery",
    "Fumble Recovery",
    "InitiativeReaction",
    "Initiative Reaction",
    "Interface",
    "InventionExpertise",
    "Invention Expertise",
    "Maker",
    "Medicine",
    "MedicalTech",
    "Medical Tech",
    "MedicalTechSkill",
    "Medical Tech Skill",
    "Moto",
    "Operator",
    "PrecisionAttack",
    "Precision Attack",
    "Solo",
    "SpotWeakness",
    "Spot Weakness",
    "Surgery",
    "SurgerySkill",
    "Surgery Skill",
    "Teamwork",
    "Tech",
    "ThreatDetection",
    "Threat Detection",
    "UpgradeExpertise",
    "Upgrade Expertise"
]

const SPECIAL_SKILL_METADATA_KEYS = [
    "points",
    "level",
    "rank",
    "value",
    "score",
    "name",
    "customName",
    "custom_name",
    "displayName",
    "display_name",
    "label",
    "skillName",
    "skill_name",
    "skill",
    "type",
    "skillType",
    "specialization",
    "specializationName",
    "specialization_name",
    "speciality",
    "specialty",
    "option",
    "choice",
    "language",
    "languageName",
    "language_name",
    "subject",
    "field",
    "place",
    "location",
    "area",
    "style",
    "instrument",
    "subskill",
    "subSkill",
    "sub_skill",
    "id",
    "_id",
    "skillTypeId",
    "skill_type_id",
    "typeId",
    "type_id"
]

function normalizeIdentifier(value) {
    return String(value ?? "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function normalizeText(value) {
    return String(value ?? "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSpecialSkillDefinition(sourceName) {
    const normalizedSource = normalizeIdentifier(sourceName);
    return Object.values(SPECIAL_SKILL_DEFINITIONS).find(definition =>
        definition.sourceNames.some(source => normalizeIdentifier(source) === normalizedSource)
        || normalizeIdentifier(definition.prefix) === normalizedSource
        || normalizedSource.startsWith(normalizeIdentifier(definition.prefix)));
}

function isRoleAbilitySkillName(skillName) {
    const normalizedSkillName = normalizeIdentifier(skillName);
    return ROLE_ABILITY_SKILL_NAMES.some(roleAbilitySkillName =>
        normalizeIdentifier(roleAbilitySkillName) === normalizedSkillName);
}

function isSpecialSkillMetadataKey(key) {
    const normalizedKey = normalizeIdentifier(key);
    return SPECIAL_SKILL_METADATA_KEYS.some(metadataKey =>
        normalizeIdentifier(metadataKey) === normalizedKey);
}

function getSpecialSkillDefinitionByV1TypeId(skillTypeId) {
    return Object.values(SPECIAL_SKILL_DEFINITIONS).find(definition =>
        definition.v1TypeIds.includes(skillTypeId));
}

function getSpecializationFromName(name, definition) {
    const normalizedName = normalizeText(name);
    if (!normalizedName) {
        return;
    }

    const prefix = definition.prefix;
    const prefixPattern = escapeRegExp(prefix);
    const parentheticalMatch = normalizedName.match(new RegExp(`^${prefixPattern}\\s*\\((.+)\\)$`, "i"));
    if (parentheticalMatch) {
        return normalizeText(parentheticalMatch[1]);
    }

    const directMatch = normalizedName.match(new RegExp(`^${prefixPattern}\\s+(.+)$`, "i"));
    if (directMatch) {
        return normalizeText(directMatch[1]);
    }

    const isBaseName = definition.sourceNames.some(source =>
        normalizeIdentifier(source) === normalizeIdentifier(normalizedName));
    return isBaseName ? undefined : normalizedName;
}

function getObjectStringValue(source, keys) {
    if (!source || typeof source !== "object") {
        return;
    }

    for (const key of keys) {
        const value = source[key];
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }
}

function getSkillLevel(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    if (!value || typeof value !== "object") {
        return;
    }

    for (const key of ["points", "level", "rank", "value", "score"]) {
        const level = getSkillLevel(value[key]);
        if (level !== undefined) {
            return level;
        }
    }
}

function getSpecialSkillItemName(definition, sourceName, value) {
    const explicitName = getObjectStringValue(value, [
        "name",
        "customName",
        "custom_name",
        "displayName",
        "display_name",
        "label",
        "skillName",
        "skill_name",
        "skill",
        "type",
        "skillType"
    ]);

    const explicitSpecialization = getObjectStringValue(value, [
        "specialization",
        "specializationName",
        "specialization_name",
        "speciality",
        "specialty",
        "option",
        "choice",
        "language",
        "languageName",
        "language_name",
        "subject",
        "field",
        "place",
        "location",
        "area",
        "style",
        "instrument",
        "subskill",
        "subSkill",
        "sub_skill"
    ]);

    const specialization = explicitSpecialization
        ?? getSpecializationFromName(explicitName, definition)
        ?? getSpecializationFromName(sourceName, definition);

    if (!specialization) {
        return;
    }

    return `${definition.prefix} (${specialization})`;
}

function addSpecialSkillEntry(entries, definition, sourceName, value) {
    const level = getSkillLevel(value);
    if (level === undefined) {
        return false;
    }

    const skillName = getSpecialSkillItemName(definition, sourceName, value);
    if (!skillName) {
        return false;
    }

    entries.push({
        skillName,
        level,
        definition
    });
    return true;
}

function collectSpecialSkillsFromValue(entries, definition, sourceName, value) {
    if (addSpecialSkillEntry(entries, definition, sourceName, value)) {
        return;
    }

    if (Array.isArray(value)) {
        value.forEach(item => collectSpecialSkillsFromValue(entries, definition, sourceName, item));
        return;
    }

    if (!value || typeof value !== "object") {
        return;
    }

    for (const [nestedSourceName, nestedValue] of Object.entries(value)) {
        if (isSpecialSkillMetadataKey(nestedSourceName)) {
            continue;
        }
        collectSpecialSkillsFromValue(entries, definition, nestedSourceName, nestedValue);
    }
}

function collectSpecialSkillsFromContainer(entries, containerName, value) {
    const containerDefinition = getSpecialSkillDefinition(containerName);
    if (containerDefinition) {
        collectSpecialSkillsFromValue(entries, containerDefinition, containerName, value);
        return;
    }

    if (!value || typeof value !== "object") {
        return;
    }

    if (Array.isArray(value)) {
        value.forEach(item => {
            const itemName = getObjectStringValue(item, ["skillType", "type", "skill", "skillName", "name"]);
            const definition = getSpecialSkillDefinition(itemName);
            if (definition) {
                collectSpecialSkillsFromValue(entries, definition, itemName, item);
            }
        });
        return;
    }

    for (const [sourceName, sourceValue] of Object.entries(value)) {
        const itemName = getObjectStringValue(sourceValue, ["skillType", "type", "skill", "skillName", "name"])
            ?? sourceName;
        const definition = getSpecialSkillDefinition(itemName);
        if (definition) {
            collectSpecialSkillsFromValue(entries, definition, itemName, sourceValue);
        }
    }
}

function getSpecialSkillsV1(data) {
    const entries = [];
    for (const skillData of data.subSkills ?? []) {
        const definition = getSpecialSkillDefinitionByV1TypeId(skillData.skill_type_id);
        if (!definition) {
            continue;
        }
        collectSpecialSkillsFromValue(entries, definition, SKILL_TYPE_MAP[skillData.skill_type_id], skillData);
    }
    return entries;
}

function getSpecialSkillsV2(data) {
    const entries = [];
    for (const containerName of SPECIAL_SKILL_CONTAINER_NAMES) {
        collectSpecialSkillsFromContainer(entries, containerName, data[containerName]);
    }
    return entries;
}

function getUniqueSpecialSkills(entries) {
    const skills = new Map();
    for (const entry of entries) {
        const key = normalizeIdentifier(entry.skillName);
        skills.set(key, entry);
    }
    return Array.from(skills.values());
}

async function createCustomSpecialSkill(actor, entry) {
    const itemData = {
        name: entry.skillName,
        type: "skill",
        img: "systems/cyberpunk-red-core/icons/compendium/default/Default_Skill.svg",
        system: {
            ...entry.definition.system,
            level: entry.level
        }
    };
    const [createdItem] = await actor.createEmbeddedDocuments("Item", [itemData]);
    return createdItem;
}

async function updateSpecialSkill(actor, entry) {
    let skillItem = await findActorItem(actor, entry.skillName, "skill", [entry.definition.packName]);
    if (!skillItem && entry.level > 0) {
        skillItem = await createActorItemFromPack(
            actor,
            entry.skillName,
            entry.definition.packName,
            {
                ...entry.definition.system,
                level: entry.level
            }
        );
    }
    if (!skillItem && entry.level > 0) {
        skillItem = await createCustomSpecialSkill(actor, entry);
    }
    if (skillItem) {
        await skillItem.update({"system.level": entry.level});
    }
}

async function updateSkillLevel(actor, skillName, level) {
    const skillItem = actor.items.getName(skillName)
        ?? await findActorItem(actor, skillName, "skill");
    if (skillItem) {
        await skillItem.update({"system.level": level});
        return true;
    }
    return false;
}

function updateSkillsV1(data, actor) {
    return (data.skill ?? []).map(async (skillData) => {
        const definition = getSpecialSkillDefinitionByV1TypeId(skillData.skill_type_id);
        if (definition) {
            return;
        }
        if (ROLE_ABILITY_SKILL_TYPE_IDS.includes(skillData.skill_type_id)) {
            return;
        }

        const skillName = SKILL_TYPE_MAP[skillData.skill_type_id];
        if (!skillName) {
            ui.notifications.warn(`Unable to find item to set level for unknown skill type: ${skillData.skill_type_id}`);
            return;
        }
        const skillItem = actor.items.getName(skillName);
        if (skillItem) {
            await skillItem.update({system: {level: skillData.points}});
        } else {
            ui.notifications.warn(`Unable to find item to set level for skill: ${skillName}`);
        }
    });
}

const BLOCKED_SKILL_NAMES = [
    "Language",
    "LocalExpert",
    "MartialArts",
    "MedicalTech",
    "PlayInstrument",
    "Science",
    "Surgery"
];

function updateSkillsV2(data, actor, specialSkills) {
    const specialSkillSourceNames = new Set(
        specialSkills.map(entry => normalizeIdentifier(entry.definition.sourceNames[0]))
    );
    return Object.entries(data.skills ?? {}).map(async ([skillName, level]) => {
        const targetSkillName = SKILL_NAME_MAP_V2[skillName];
        const isSpecialSkillWithDetails = specialSkillSourceNames.has(normalizeIdentifier(skillName));
        if (targetSkillName && !isSpecialSkillWithDetails) {
            if (!await updateSkillLevel(actor, targetSkillName, level)) {
                ui.notifications.warn(`Unable to find item to set level for skill: ${targetSkillName}`);
            }
        } else if (
            !BLOCKED_SKILL_NAMES.includes(skillName)
            && !getSpecialSkillDefinition(skillName)
            && !isRoleAbilitySkillName(skillName)
        ) {
            ui.notifications.warn(`Unable to find item to set level for skill: ${skillName}`);
        }
    });
}

export async function updateSkills(data, actor, isV2) {
    const specialSkills = getUniqueSpecialSkills(isV2 ? getSpecialSkillsV2(data) : getSpecialSkillsV1(data));
    const specialSkillUpdates = specialSkills.map(entry => updateSpecialSkill(actor, entry));
    const skillUpdates = isV2 ? updateSkillsV2(data, actor, specialSkills) : updateSkillsV1(data, actor);
    await Promise.all(skillUpdates);
    await Promise.all(specialSkillUpdates);
}
