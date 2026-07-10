import {CORE_SYSTEM_ID, getLocalizedItemNameVariants, namesMatch} from "./translations.js";

const ROLE_PACK_NAME = "core_roles";

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

const ROLE_TYPE_MAP = {
    0: "Rockerboy",
    1: "Solo",
    2: "Netrunner",
    3: "Tech",
    4: "Medtech",
    5: "Media",
    6: "Lawman",
    7: "Exec",
    8: "Fixer",
    9: "Nomad"
}

const ROLE_NAMES = [
    "Exec",
    "Fixer",
    "Lawman",
    "Media",
    "Medtech",
    "Netrunner",
    "Nomad",
    "Rockerboy",
    "Solo",
    "Tech"
]

const ROLE_MAIN_ABILITIES = {
    Exec: "Teamwork",
    Fixer: "Operator",
    Lawman: "Backup",
    Media: "Credibility",
    Medtech: "Medicine",
    Netrunner: "Interface",
    Nomad: "Moto",
    Rockerboy: "Charismatic Impact",
    Solo: "Combat Awareness",
    Tech: "Maker"
}

function normalizeIdentifier(value) {
    return String(value ?? "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
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

function getLevel(value) {
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

    for (const key of [
        "rank",
        "level",
        "points",
        "value",
        "roleRank",
        "role_rank",
        "roleLevel",
        "role_level",
        "rolePoints",
        "role_points"
    ]) {
        const level = getLevel(value[key]);
        if (level !== undefined) {
            return level;
        }
    }
}

function getRoleNameById(value) {
    const roleId = typeof value === "number" || typeof value === "string"
        ? value
        : value?.class_type_id
        ?? value?.classTypeId
        ?? value?.class
        ?? value?.role_type_id
        ?? value?.roleTypeId
        ?? value?.role_id
        ?? value?.roleId;
    if (roleId === undefined || roleId === null || roleId === "") {
        return;
    }
    return ROLE_TYPE_MAP[Number(roleId)];
}

function getRoleName(sourceName) {
    const normalizedSourceName = normalizeIdentifier(sourceName);
    const exactMatch = ROLE_NAMES.find(roleName =>
        normalizeIdentifier(roleName) === normalizedSourceName);
    if (exactMatch) {
        return exactMatch;
    }

    return ROLE_NAMES
        .filter(roleName => normalizedSourceName.startsWith(normalizeIdentifier(roleName)))
        .sort((a, b) => normalizeIdentifier(b).length - normalizeIdentifier(a).length)[0];
}

function getRoleNameFromValue(sourceName, value) {
    if (typeof value === "string") {
        return getRoleName(value);
    }

    return getRoleNameById(value)
        ?? getRoleName(getObjectStringValue(value, [
            "classType",
            "class_type",
            "role",
            "roleName",
            "role_name",
            "name",
            "type",
            "roleType",
            "role_type"
        ]))
        ?? getRoleName(sourceName);
}

function addRoleEntry(entries, roleName, rank) {
    if (!roleName || rank === undefined) {
        return;
    }

    const key = normalizeIdentifier(roleName);
    const existing = entries.get(key) ?? {
        roleName,
        rank: undefined
    };
    existing.rank = Math.max(existing.rank ?? 0, rank);
    entries.set(key, existing);
}

function collectRoleAbilityEntries(entries, value) {
    if (Array.isArray(value)) {
        for (const abilityData of value) {
            const roleName = getRoleNameFromValue(undefined, abilityData);
            const rank = getLevel(abilityData);
            if (roleName && rank !== undefined) {
                addRoleEntry(entries, roleName, rank);
            }
        }
        return;
    }

    if (!value || typeof value !== "object") {
        return;
    }

    for (const [roleKey, rankValue] of Object.entries(value)) {
        const roleName = getRoleName(roleKey)
            ?? getRoleNameFromValue(roleKey, rankValue);
        const rank = getLevel(rankValue);
        if (roleName && rank !== undefined) {
            addRoleEntry(entries, roleName, rank);
        }
    }
}

function collectTopLevelRole(entries, data) {
    const topLevelRoleName = getRoleNameById(data?.class)
        ?? getRoleName(data?.classType)
        ?? getRoleNameById(data)
        ?? getRoleNameFromValue(undefined, data);
    const topLevelRank = getLevel(
        data?.roleRank
        ?? data?.role_rank
        ?? data?.roleLevel
        ?? data?.role_level
        ?? data?.rolePoints
        ?? data?.role_points
        ?? data?.rank
    );
    if (topLevelRoleName && topLevelRank !== undefined) {
        addRoleEntry(entries, topLevelRoleName, topLevelRank);
    }
}

function getRoleEntries(data) {
    const entries = new Map();
    collectRoleAbilityEntries(entries, data?.role_ability);
    collectRoleAbilityEntries(entries, data?.roleAbilities);
    collectTopLevelRole(entries, data);

    return Array.from(entries.values())
        .filter(entry => entry.rank !== undefined);
}

async function createCustomRole(actor, entry) {
    const itemData = {
        name: entry.roleName,
        type: "role",
        img: "systems/cyberpunk-red-core/icons/compendium/default/Default_Role.svg",
        system: {
            rank: entry.rank,
            mainRoleAbility: ROLE_MAIN_ABILITIES[entry.roleName] ?? entry.roleName,
            hasRoll: false,
            addRoleAbilityRank: true,
            stat: "--",
            skill: "--",
            bonuses: [],
            universalBonuses: [],
            bonusRatio: 1,
            abilities: [],
            isSituational: false,
            onByDefault: false
        }
    };
    const [createdItem] = await actor.createEmbeddedDocuments("Item", [itemData]);
    return createdItem;
}

async function ensureActiveRole(actor, roleItem) {
    if (!roleItem || actor.system?.roleInfo?.activeRole) {
        return;
    }

    await actor.update({
        "system.roleInfo.activeRole": roleItem.name,
        "system.roleInfo.activeNetRole": roleItem.id
    });
}

async function updateRole(actor, entry) {
    let roleItem = await findActorItem(actor, entry.roleName, "role", [ROLE_PACK_NAME]);
    if (!roleItem && entry.rank > 0) {
        roleItem = await createActorItemFromPack(
            actor,
            entry.roleName,
            ROLE_PACK_NAME,
            {rank: entry.rank}
        );
    }
    if (!roleItem && entry.rank > 0) {
        roleItem = await createCustomRole(actor, entry);
    }
    if (!roleItem) {
        return;
    }

    await roleItem.update({"system.rank": entry.rank});
    await ensureActiveRole(actor, roleItem);
}

export async function updateRoles(data, actor) {
    const roleEntries = getRoleEntries(data);
    await Promise.all(roleEntries.map(entry => updateRole(actor, entry)));
}
