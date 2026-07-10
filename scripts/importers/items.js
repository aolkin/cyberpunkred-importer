import {
    getLocalizedItemNameVariants as getTranslatedItemNameVariants,
    namesMatch,
    normalizeLocalizationKey,
    stripTrademarkSymbols
} from "./translations.js";

const CORE_SYSTEM_ID = "cyberpunk-red-core";

const ITEMS_KEYS = [
    "clothing",
    "armor",
    "gear",
    "programs",
    "weapons",
    "ammunition",
    "cyberware",
    "vehicles"
];

const CAMELCASE_FIXES = [
    "Sov Oil",
    "Kill Strom",
    "Mod Fire",
    "Gun Mart",
    "Mecha Man",
    "Ameri Car",
    "Econo Compact",
    "K Tech",
    "Venture Ware",
    "Slam Dance",
];

const MULTI_WORD_AMMO_QUALIFIERS = [
    "Armor Piercing",
    "Improved Smart",
]

const MULTI_WORD_BRANDS = [
    "constitution arms",
    "tsunami arms",
]

const SINGULAR_CLOTHING_TYPES = [
    "Hat",
    "Top",
]

const STACKABLE_ITEM_TYPES = new Set([
    "ammo",
    "clothing",
    "drug",
    "gear",
]);

const CAMELCASE_FIX_REGEX = new RegExp(`(${CAMELCASE_FIXES.join("|")})`, "gi");
const MULTI_WORD_REMOVE_BRAND_REGEX = new RegExp(`^(${MULTI_WORD_BRANDS.join("|")}) `, "i");
const SINGULAR_CLOTHING_FIX_REGEX = new RegExp(`(${SINGULAR_CLOTHING_TYPES.join("|")})s`, "i");
const TECH_UPGRADE_SUFFIX_REGEX = /\s*T\s*Up(?:\s*\d+|\s+[A-Za-z0-9]+)*$/i;
const QUALITY_SUFFIX_REGEX = / \((Poor|Excellent)\)$/;

function getPackId(pack) {
    return pack.collection ?? pack.metadata?.id ?? `${CORE_SYSTEM_ID}.${pack.metadata?.name}`;
}

function getPackName(pack) {
    const packId = getPackId(pack);
    return pack.metadata?.name ?? packId.replace(`${CORE_SYSTEM_ID}.`, "");
}

function getSystemItemPacks() {
    return Array.from(game.packs.values())
        .filter(pack => pack.metadata?.type === "Item")
        .filter(pack => {
            const collection = pack.collection ?? pack.metadata?.id ?? "";
            return collection.startsWith(`${CORE_SYSTEM_ID}.`)
                || pack.metadata?.packageName === CORE_SYSTEM_ID
                || pack.metadata?.system === CORE_SYSTEM_ID;
        });
}

function getSystemItemPackNames() {
    return [...new Set(getSystemItemPacks()
        .map(pack => getPackName(pack))
        .filter(packName => packName))];
}

function getItemNameCandidates(itemNames, itemData) {
    itemNames = Array.isArray(itemNames) ? itemNames : [itemNames];
    const candidates = [...itemNames];
    if (itemData?.name) {
        candidates.push(itemData.name);
    }

    return [...new Set(candidates.flatMap(name => [
        name,
        stripTrademarkSymbols(name).replace(/\s+/g, " ").trim()
    ]).filter(name => name))];
}

function getRequestedQuantity(quantity) {
    if (quantity === undefined || quantity === null || quantity === "") {
        return 1;
    }

    const parsed = Number(quantity);
    if (!Number.isFinite(parsed)) {
        return 1;
    }

    return Math.max(0, Math.floor(parsed));
}

function isStackableItemData(itemData) {
    return STACKABLE_ITEM_TYPES.has(itemData?.type)
        && itemData?.system
        && Object.hasOwn(itemData.system, "amount");
}

function createNonStackableImportTracker() {
    return {
        created: new Map(),
        existing: new Map(),
        requested: new Map(),
    };
}

function getItemCountKey(itemData, fallbackName) {
    return `${itemData?.type ?? ""}:${normalizeLocalizationKey(itemData?.name ?? fallbackName)}`;
}

function duplicateItemData(itemData) {
    return foundry.utils.deepClone?.(itemData) ?? foundry.utils.duplicate(itemData);
}

function sanitizeItemName(itemName) {
    return stripTrademarkSymbols(itemName).replace(/\s+/g, " ").trim();
}

function prepareItemDataForImport(baseItemData, quantity) {
    const itemData = duplicateItemData(baseItemData);
    delete itemData._id;
    itemData.name = sanitizeItemName(itemData.name);

    if (isStackableItemData(itemData)) {
        itemData.system.amount = getRequestedQuantity(quantity);
    }

    return itemData;
}

function getItemDataListForImport(baseItemData, quantity, missingQuantity) {
    if (missingQuantity <= 0) {
        return [];
    }

    if (isStackableItemData(baseItemData)) {
        return [prepareItemDataForImport(baseItemData, quantity)];
    }

    return Array.from(
        {length: missingQuantity},
        () => prepareItemDataForImport(baseItemData, quantity)
    );
}

function findExistingItems(itemNames, actor, itemType) {
    return Array.from(actor.items.values())
        .filter(item => item.type === itemType)
        .filter(item => itemNames.some(itemName => namesMatch(item.name, itemName)));
}

async function sanitizeExistingItemName(item) {
    const sanitizedName = sanitizeItemName(item.name);
    if (sanitizedName && sanitizedName !== item.name) {
        await item.update({name: sanitizedName});
    }
}

async function getMissingQuantityAfterExistingItems(itemNames, quantity, actor, itemData) {
    const requestedQuantity = getRequestedQuantity(quantity);
    const existingItems = findExistingItems(itemNames, actor, itemData.type);
    await Promise.all(existingItems.map(item => sanitizeExistingItemName(item)));

    if (isStackableItemData(itemData)) {
        const existingItem = existingItems[0];
        if (existingItem) {
            console.debug(`Updating existing ${existingItem.name} to quantity x${requestedQuantity}`);
            await existingItem.update({"system.amount": requestedQuantity});
            return 0;
        }
        return requestedQuantity > 0 ? 1 : 0;
    }

    const missingQuantity = Math.max(0, requestedQuantity - existingItems.length);
    if (missingQuantity === 0 && existingItems.length > 0) {
        console.debug(`Found ${existingItems.length} existing ${itemNames[0]}, skipping...`);
    }
    return missingQuantity;
}

async function getMissingNonStackableQuantity(itemNames, quantity, actor, itemData, tracker) {
    const countKey = getItemCountKey(itemData, itemNames[0]);
    if (!tracker.existing.has(countKey)) {
        const existingItems = findExistingItems(itemNames, actor, itemData.type);
        await Promise.all(existingItems.map(item => sanitizeExistingItemName(item)));
        tracker.existing.set(countKey, existingItems.length);
    }

    const requestedQuantity = getRequestedQuantity(quantity);
    const cumulativeRequested = (tracker.requested.get(countKey) ?? 0) + requestedQuantity;
    tracker.requested.set(countKey, cumulativeRequested);

    const existingQuantity = tracker.existing.get(countKey) ?? 0;
    const createdQuantity = tracker.created.get(countKey) ?? 0;
    const missingQuantity = Math.max(0, cumulativeRequested - existingQuantity - createdQuantity);
    if (missingQuantity === 0 && existingQuantity + createdQuantity > 0) {
        console.debug(`Found ${existingQuantity + createdQuantity} existing ${itemNames[0]}, skipping...`);
    }
    return {countKey, missingQuantity};
}

function trackCreatedNonStackableQuantity(tracker, countKey, createdQuantity) {
    tracker.created.set(countKey, (tracker.created.get(countKey) ?? 0) + createdQuantity);
}

function isTechUpgradeItemName(itemName) {
    return TECH_UPGRADE_SUFFIX_REGEX.test(itemName);
}

function extractItemName(item) {
    let itemName = item.type.replace(/([A-Z0-9])(?=[a-z0-9])/g, " $1").trim();
    if (itemName === "SelfICE") {
        return "Self-ICE";
    }

    const camelCaseFix = itemName.matchAll(CAMELCASE_FIX_REGEX);
    for (const fix of (camelCaseFix ?? [])) {
        itemName = itemName.replace(fix[0], fix[0].replace(" ", ""));
    }

    if (isTechUpgradeItemName(itemName)) {
        return;
    }

    if (item.quality && !item.description && item.quality !== "Standard") {
        itemName += ` (${item.quality})`;
    }
    return itemName;
}

function normalizeItemName(itemName, itemType) {
    if (itemType === "clothing") {
        itemName = itemName.replace(SINGULAR_CLOTHING_FIX_REGEX, "$1");
    }
    if (itemType === "gear") {
        itemName = itemName.replace(/^(Scrambler|Descrambler|Scrambler Descrambler)$/, "Scrambler/Descrambler");
        itemName = itemName.replace(/^Linear Frame (Sigma|∑)$/i, "Linear Frame ∑ (Sigma)");
        itemName = itemName.replace(/^Linear Frame (Beta|β)$/i, "Linear Frame β (Beta)");
        if (itemName === "Militech Tactical Umbrella") {
            return "Tactical Umbrella";
        }
    }
    if (itemType === "cyberware") {
        itemName = itemName.replace(/^(Scrambler|Descrambler|Scrambler Descrambler)$/, "Scrambler/Descrambler");
        itemName = itemName.replace(/^Audio Vox$/, "AudioVox");
        itemName = itemName.replace(/^Low Light (Infrared\s*UV|IR\s*UV|IRUV)$/i, "Low Light/IR/UV");
        itemName = itemName.replace(/^Grafted Muscle Bone Lace$/i, "Grafted Muscle and Bone Lace");
        itemName = itemName.replace(/^Midnight Lady(?: Sexual Implant)?$/i, "Midnight Lady Sexual Implant");
        itemName = itemName.replace(/^Mr\.? Studd(?: Sexual Implant)?$/i, "Mr. Studd Sexual Implant");
        itemName = itemName.replace(/^Inplanted Linear Frame /i, "Implanted Linear Frame ");
        itemName = itemName.replace(/^Implanted Linear Frame (Sigma|∑)$/i, "Implanted Linear Frame ∑ (Sigma)");
        itemName = itemName.replace(/^Implanted Linear Frame (Beta|β)$/i, "Implanted Linear Frame β (Beta)");
        if (itemName === "Cyberdeck") {
            return "Cyberdeck (Hardwired)";
        }
    }
    if (itemType === "gear" || itemType === "vehicle") {
        if (itemName === "Groundcar") {
            return "Compact Groundcar";
        }
    }
    if (itemType === "weapon" && itemName.endsWith(" Weapon")) {
        if (!itemName.includes("Hurricane Assault")) {
            itemName = itemName.slice(0, -7);
        }
    }
    if (itemType === "weapon") {
        itemName = itemName.replace(/^Bows(?= \(|$)/, "Bow");
        itemName = itemName.replace(/^Constitution Arms /, "Constitutional Arms ");
        itemName = itemName.replace(/^Railgun(?= \(|$)/, "Rhinemetall EMG-86 Railgun");
    }
    if (itemType === "armor") {
        if (itemName === "Bodyweight Suit Body" || itemName === "Bodyweight (Head)") {
            return "Bodyweight Suit";
        }
        itemName = itemName.replace(/ Body$/, " (Body)");
        itemName = itemName.replace(/ Head$/, " (Head)");
        itemName = itemName.replace(/ Helmet$/, " (Head)");
    }
    return itemName;
}

function normalizeAmmunitionQualifier(name) {
    for (const qualifier of MULTI_WORD_AMMO_QUALIFIERS) {
        if (name.startsWith(`${qualifier} `)) {
            return name.slice(qualifier.length + 1) + ` (${qualifier})`;
        }
    }
    const words = name.split(" ");
    return words.slice(1).join(" ") + ` (${words[0]})`;
}

function removeBrand(normalized) {
    if (MULTI_WORD_REMOVE_BRAND_REGEX.test(normalized)) {
        return normalized.replace(MULTI_WORD_REMOVE_BRAND_REGEX, "");
    }
    return normalized.split(" ").slice(1).join(" ");
}

function isExactMatch(searchResult, targetName, itemType) {
    const resultName = normalizeLocalizationKey(searchResult);
    const itemName = normalizeLocalizationKey(targetName);
    if (namesMatch(searchResult, targetName)) {
        return true;
    }
    if (itemType === "armor" && resultName !== itemName) {
        const normalizedItemName = itemName.replace(/ (armor|body)$/i, " (body)");
        return resultName === normalizedItemName;
    }
    return resultName === itemName;
}

function getAllowedSystemItemTypes(itemType) {
    if (itemType === "ammunition") {
        return ["ammo"];
    }
    if (itemType === "gear") {
        return ["cyberdeck", "drug", "gear", "vehicle"];
    }
    return [itemType];
}

async function getExactQuickInsertMatch(searchResults, targetName, itemType, itemName) {
    const exactMatches = searchResults.filter(result => isExactMatch(result.item.name, targetName, itemType));

    if (exactMatches.length === 0) {
        return;
    }

    const matches = await Promise.all(exactMatches.map(async (result) =>
        [result, await result.item.get()]));
    const allowedTypes = getAllowedSystemItemTypes(itemType);
    const typeMatches = matches.filter(item => allowedTypes.includes(item[1].type));
    if (typeMatches.length === 1) {
        return typeMatches[0][0].item;
    }

    const worldMatches = typeMatches.filter(item => item[1].pack == null);
    if (worldMatches.length === 1) {
        return worldMatches[0][0].item;
    }

    console.debug(`Unable to type-match exact matches for ${itemName} (${itemType}):`, matches);
}

async function searchQuickInsert(searchName, itemType, itemName) {
    const searchResults = QuickInsert.search(searchName);
    return {
        searchName,
        searchResults,
        exactMatch: await getExactQuickInsertMatch(searchResults, searchName, itemType, itemName)
    };
}

async function findItem(itemName, itemType, alreadyUnbranded = false) {
    const normalized = normalizeItemName(itemName, itemType);
    if (itemName !== normalized) {
        // console.debug(`Normalized ${itemName} (${itemType}) to ${normalized}`);
    }

    const searchNames = await getTranslatedItemNameVariants([
        normalized,
        normalized.replace(QUALITY_SUFFIX_REGEX, "")
    ], getSystemItemPackNames());
    const searches = [];
    for (const searchName of searchNames) {
        const search = await searchQuickInsert(searchName, itemType, itemName);
        if (search.exactMatch) {
            return search.exactMatch;
        }
        searches.push(search);
    }

    if (alreadyUnbranded) {
        return;
    }

    if (itemType === "ammunition" && !normalized.includes("(")) {
        const qualifiedAmmunition = normalizeAmmunitionQualifier(normalized);
        return await findItem(qualifiedAmmunition, itemType, alreadyUnbranded);
    }

    const hasSearchResults = searches.some(search => search.searchResults.length > 0);
    if (!hasSearchResults) {
        const unbranded = removeBrand(normalized);
        if (unbranded !== "" && unbranded !== normalized) {
            const unbrandedResult = await findItem(unbranded, itemType, true);
            if (unbrandedResult) {
                return unbrandedResult;
            }
        }
        console.debug(`Unable to find ${itemName} (${itemType}) in Foundry.`);
    }

    const dialogueStartText = searches.find(search => search.searchResults.length > 0)?.searchName
        ?? searchNames[searchNames.length - 1]
        ?? normalized;

    function openSearchDialogue(resolve, reject, retries = 0) {
        if (QuickInsert.app.rendered || QuickInsert.app.visible) {
            if (retries > 20) {
                reject("Quick Insert was already open, unable to launch Quick Insert after 2 seconds.");
            }
            setTimeout(() => openSearchDialogue(resolve, reject, retries + 1), 100);
            return;
        }
        try {
            QuickInsert.open({
                mode: 1, // Insert Mode, required to get onSubmit
                classes: ["cpr-character-importer-quick-insert-item"],
                startText: dialogueStartText,
                allowMultiple: false,
                restrictTypes: ["Item"],
                onSubmit: (item) => {
                    console.debug(`Resolving ${item.name}`);
                    resolve(item);
                },
                onClose: () => {
                    console.debug("Resolving undefined");
                    resolve(undefined);
                }
            });
        } catch (e) {
            reject(e);
        }
    }

    return new Promise((resolve, reject) => {
        openSearchDialogue(resolve, reject);
    });
}

function getImportItemType(itemType) {
    return {
        ammunition: "ammunition",
        programs: "program",
        vehicles: "vehicle",
        weapons: "weapon"
    }[itemType] ?? itemType.replace(/s$/, "");
}

function getItemDataFromDocument(itemDocument) {
    return itemDocument.toObject
        ? itemDocument.toObject()
        : duplicateItemData(itemDocument);
}

export async function importItems(data, actor) {
    const missingItems = [];
    const nonStackableTracker = createNonStackableImportTracker();
    for (const itemType of ITEMS_KEYS) {
        for (const item of Object.values(data[itemType] ?? {})) {
            const itemName = extractItemName(item);
            if (!itemName) {
                continue;
            }

            const importItemType = getImportItemType(itemType);
            const normalizedItemName = normalizeItemName(itemName, importItemType);
            const systemItem = await findItem(itemName, importItemType);
            if (systemItem) {
                const quantity = item.quantity;
                const itemDocument = await systemItem.get();
                const itemData = getItemDataFromDocument(itemDocument);
                const itemNames = getItemNameCandidates(
                    await getTranslatedItemNameVariants([
                        normalizedItemName,
                        normalizedItemName.replace(QUALITY_SUFFIX_REGEX, "")
                    ], getSystemItemPackNames()),
                    itemData
                );
                itemNames.push(systemItem.name);
                const itemNameCandidates = getItemNameCandidates(itemNames, itemData);
                let countKey;
                let missingQuantity;
                if (isStackableItemData(itemData)) {
                    missingQuantity = await getMissingQuantityAfterExistingItems(
                        itemNameCandidates,
                        quantity,
                        actor,
                        itemData
                    );
                } else {
                    const missing = await getMissingNonStackableQuantity(
                        itemNameCandidates,
                        quantity,
                        actor,
                        itemData,
                        nonStackableTracker
                    );
                    countKey = missing.countKey;
                    missingQuantity = missing.missingQuantity;
                }
                if (missingQuantity > 0) {
                    console.debug(`Importing ${itemName} x${quantity}`, item);
                    const itemDataList = getItemDataListForImport(itemData, quantity, missingQuantity);
                    await actor.createEmbeddedDocuments("Item", itemDataList);
                    if (countKey) {
                        trackCreatedNonStackableQuantity(nonStackableTracker, countKey, itemDataList.length);
                    }
                }
            } else {
                missingItems.push(itemName);
            }
        }
    }
    if (missingItems.length > 0) {
        ui.notifications.error("The following items were skipped during import: "
            + missingItems.join(", "));
    }
}
