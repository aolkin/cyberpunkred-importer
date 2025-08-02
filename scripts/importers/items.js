const DATABASE_IDS = {
    "clothing": "cyberpunk-red-core.core_clothing",
    "armor": "cyberpunk-red-core.core_armor",
    "gear": "cyberpunk-red-core.core_gear",
    "program": "cyberpunk-red-core.core_programs",
    "weapon": "cyberpunk-red-core.core_weapons",
    "ammunition": "cyberpunk-red-core.core_ammo",
    "cybergear": "cyberpunk-red-core.core_cyberware",
    "cyberchairs": "cyberpunk-red-core.dlc_cyberchairs",
}

const databases = {};

export async function loadItemDatabases() {
    await Promise.all(Object.entries(DATABASE_IDS).map(async ([databaseId, databaseName]) => {
        const pack = game.packs.get(databaseName);
        if (pack) {
            databases[databaseId] = await pack.getIndex();
        } else {
            ui.notifications.error(`CPR Importer failed to load ${databaseName} compendium pack!`);
        }
    }));
}

function getItemUuid(database, id) {
    return `Compendium.${database}.${id}`;
}

const CLOTHING_STYLES = [
    "Bag Lady Chic",
    "Gang Colors",
    "Generic Chic",
    "Bohemian",
    "Leisurewear",
    "Nomad Leathers",
    "Asia Pop",
    "Urban Flash",
    "Businesswear",
    "High Fashion",
];

const CLOTHING_PIECES = [
    "Bottoms",
    "Top",
    "Jacket",
    "Footwear",
    "Jewelry",
    "Mirrorshades",
    "Glasses",
    "Contact Lenses",
    "Hat",
]

const ARMOR_TYPES = [
    "Leathers (Body)",
    "Leathers (Head)",
    "Kevlar (Body)",
    "Kevlar (Head)",
    "Light Armorjack (Body)",
    "Light Armorjack (Head)",
    "Bodyweight Suit",
    "Bodyweight (Head)",
    "Medium Armorjack (Body)",
    "Medium Armorjack (Head)",
    "Heavy Armorjack (Body)",
    "Heavy Armorjack (Head)",
    "Flak (Body)",
    "Flak (Head)",
    "Metalgear (Body)",
    "Metalgear (Head)",
    "Bullet Proof Shield"
];

const GEAR_TYPES = {
    "0": "Agent",
    "1": "Electric Guitar/Other Instrument",
    "2": "Cyberdeck",
    "3": "Groundcar",
    "4": "Airhypo",
    "5": "Anti-Smog Breathing Mask",
    "6": "Audio Recorder",
    "7": "Auto Level Dampening Ear Protectors",
    "9": "Binoculars",
    "10": "Braindance Viewer",
    "11": "Bug Detector",
    "12": "Carryall",
    "13": "Chemical Analyzer",
    "14": "Computer",
    "15": "Disposable Cell Phone",
    "16": "Drum Synthesizer",
    "17": "Duct Tape",
    "18": "Flashlight",
    "19": "Food Stick",
    "20": "Glow Paint",
    "21": "Glow Stick",
    "22": "Grapple Gun",
    "23": "Handcuffs",
    "24": "Homing Tracer",
    "25": "Inflatable Bed & Sleep-bag",
    "26": "Kibble Pack",
    "27": "Lock Picking Set",
    "28": "Medscanner",
    "29": "Medtech Bag",
    "30": "Memory Chip",
    "31": "MRE",
    "32": "Personal CarePak",
    "33": "Pocket Amplifier",
    "34": "Radar Detector",
    "35": "Radiation Suit",
    "36": "Radio Communicator",
    "37": "Radio Scanner/Music Player",
    "38": "Road Flare",
    "39": "Rope (60m/yd)",
    "40": "Scrambler/Descrambler",
    "41": "Smart Glasses",
    "42": "Tech Bag",
    "43": "Techscanner",
    "44": "Techtool",
    "45": "Tent and Camping Equipment",
    "46": "Vial of Biotoxin",
    "47": "Vial of Poison",
    "48": "Video Camera",
    "49": "Virtuality Goggles",
    "50": "Cryopump",
    "51": "Cryotank",
    "52": "Antibiotic",
    "53": "Rapidetox",
    "54": "Speedheal",
    "55": "Stim",
    "56": "Surge",
    "57": "Cyberdeck (Poor)",
    "58": "Cyberdeck (Excellent)",
    "59": "Black Lace",
    "60": "Blue Glass",
    "61": "Boost",
    "62": "Smash",
    "63": "Synthcoke",
    "64": "Custom Item",
    "65": "Linear Frame β (Beta)",
    "66": "Linear Frame ∑ (Sigma)",
    "67": "Cold Weather Jacket Lining",
    "68": "Hot Weather Jacket Lining",
    "69": "Militech Tactical Umbrella",
    "70": "Umbrella",
    "71": "Waterproof Jacket Lining",
    "72": "Mercurius Cyberchair",
    "73": "Spider Cyberchair"
};

const PROGRAM_TYPES = {
    "0": "Eraser",
    "1": "See Ya",
    "2": "Speedy Gonzalvez",
    "3": "Worm",
    "4": "Armor",
    "5": "Flak",
    "6": "Shield",
    "7": "Banhammer",
    "8": "Sword",
    "9": "DeckKRASH",
    "10": "Hellbolt",
    "11": "Nervescrub",
    "12": "Poison Flatline",
    "13": "Superglue",
    "14": "Vrizzbolt",
    "15": "Asp",
    "16": "Giant",
    "17": "Hellhound",
    "18": "Kraken",
    "19": "Liche",
    "20": "Raven",
    "21": "Scorpion",
    "22": "Skunk",
    "23": "Wisp",
    "24": "Dragon",
    "25": "Killer",
    "26": "Sabertooth",
};

const WEAPON_TYPES = {
    "0": "Light Melee",
    "1": "Medium Melee",
    "2": "Heavy Melee",
    "3": "Very Heavy Melee",
    "4": "Medium Pistol",
    "5": "Heavy Pistol",
    "6": "Very Heavy Pistol",
    "7": "SMG",
    "8": "Heavy SMG",
    "9": "Shotgun",
    "10": "Assault Rifle",
    "11": "Sniper Rifle",
    "12": "Bows",
    "13": "Grenade Launcher",
    "14": "Rocket Launcher",
    "15": "Air Pistol",
    "16": "Battleglove",
    "17": "Constitution Arms Hurricane Assault Weapon",
    "18": "Dartgun",
    "19": "Flamethrower",
    "20": "Kendachi Mono-Three",
    "21": "Malorian Arms 3516",
    "22": "Microwaver",
    "23": "Militech \"Cowboy\" U-56 Grenade Launcher",
    "24": "Rhinemetall EMG-86 Railgun",
    "25": "Railgun",
    "26": "Shrieker",
    "27": "Stun Baton",
    "28": "Stun Gun",
    "29": "Tsunami Arms Helix",
};

const WEAPON_QUALITY = {
    "0": " (Poor)",
    "1": "",
    "2": " (Excellent)",
};

const AMMO_TYPES = {
    "0": "Medium Pistol (Basic)",
    "1": "Heavy Pistol (Basic)",
    "2": "Very Heavy Pistol (Basic)",
    "3": "Shotgun Slug (Basic)",
    "4": "Rifle (Basic)",
    "5": "Shotgun Shell (Basic)",
    "6": "Arrow (Basic)",
    "7": "Medium Pistol (Armor-Piercing)",
    "8": "Heavy Pistol (Armor-Piercing)",
    "9": "Very Heavy Pistol (Armor-Piercing)",
    "10": "Shotgun Slug (Armor-Piercing)",
    "11": "Rifle (Armor-Piercing)",
    "12": "Arrow (Armor-Piercing)",
    "13": "Grenade (Armor-Piercing)",
    "14": "Rocket (Armor-Piercing)",
    "15": "Arrow (Biotoxin)",
    "16": "Grenade (Biotoxin)",
    "17": "Grenade (EMP)",
    "18": "Medium Pistol (Expansive)",
    "19": "Heavy Pistol (Expansive)",
    "20": "Very Heavy Pistol (Expansive)",
    "21": "Shotgun Slug (Expansive)",
    "22": "Rifle (Expansive)",
    "23": "Arrow (Expansive)",
    "24": "Grenade (Flashbang)",
    "25": "Medium Pistol (Incendiary)",
    "26": "Heavy Pistol (Incendiary)",
    "27": "Very Heavy Pistol (Incendiary)",
    "28": "Rifle (Incendiary)",
    "29": "Shotgun Shell (Incendiary)",
    "30": "Arrow (Incendiary)",
    "31": "Grenade (Incendiary)",
    "32": "Arrow (Poison)",
    "33": "Grenade (Poison)",
    "34": "Medium Pistol (Rubber)",
    "35": "Heavy Pistol (Rubber)",
    "36": "Very Heavy Pistol (Rubber)",
    "37": "Shotgun Slug (Rubber)",
    "38": "Rifle (Rubber)",
    "39": "Arrow (Rubber)",
    "40": "Arrow (Sleep)",
    "41": "Grenade (Sleep)",
    "42": "Medium Pistol (Smart)",
    "43": "Heavy Pistol (Smart)",
    "44": "Very Heavy Pistol (Smart)",
    "45": "Rifle (Smart)",
    "46": "Arrow (Smart)",
    "47": "Rocket (Smart)",
    "48": "Grenade (Smoke)",
    "49": "Grenade (Teargas)",
    "50": "Battery Pack",
    "51": "Paintball (Basic)",
    "52": "Paintball (Acid)",
};

const CYBERWARE_TYPES = {
    "0": "Biomonitor",
    "1": "Chemskin",
    "2": "EMP Threading",
    "3": "Light Tattoo",
    "4": "Shift Tacts",
    "5": "Skinwatch",
    "6": "Techhair",
    "7": "Neural Link",
    "8": "Interface Plugs",
    "9": "Braindance Recorder",
    "10": "Chipware Socket",
    "11": "Kerenzikov",
    "12": "Sandevistan",
    "13": "Chemical Analyzer",
    "14": "Memory Chip",
    "15": "Olfactory Boost",
    "16": "Pain Editor",
    "17": "Skill Chip",
    "18": "Tactile Boost",
    "19": "Cybereye",
    "20": "Anti-Dazzle",
    "21": "Chyron",
    "22": "Color Shift",
    "23": "Dartgun",
    "24": "Image Enhance",
    "25": "Low Light/IR/UV",
    "26": "MicroOptics",
    "27": "MicroVideo",
    "28": "Radiation Detector",
    "29": "Targeting Scope",
    "30": "TeleOptics",
    "31": "Virtuality",
    "32": "Cyberaudio Suite",
    "33": "Amplified Hearing",
    "34": "Audio Recorder",
    "35": "Bug Detector",
    "36": "Homing Tracer",
    "37": "Internal Agent",
    "38": "Level Damper",
    "39": "Radio Communicator",
    "40": "Radio Scanner/Music Player",
    "41": "Radar Detector",
    "42": "Scrambler/Descrambler",
    "43": "Voice Stress Analyzer",
    "44": "Audio Vox",
    "45": "Contraceptive Implant",
    "46": "Enhanced Antibodies",
    "47": "Cybersnake",
    "48": "Gills",
    "49": "Grafted Muscle and Bone Lace",
    "50": "Independent Air Supply",
    "51": "Midnight Lady Sexual Implant",
    "52": "Mr. Studd Sexual Implant",
    "53": "Nasal Filters",
    "54": "Radar/Sonar Implant",
    "55": "Toxin Binders",
    "56": "Vampyres",
    "57": "Hidden Holster",
    "58": "Skin Weave",
    "59": "Subdermal Armor",
    "60": "Subdermal Pocket",
    "61": "Cyberarm",
    "62": "Standard Hand",
    "63": "Big Knucks",
    "64": "Cyberdeck",
    "65": "Grapple Hand",
    "66": "Medscanner",
    "67": "Popup Grenade Launcher",
    "68": "Popup Melee Weapon",
    "69": "Popup Shield",
    "70": "Popup Ranged Weapon",
    "71": "Quick Change Mount",
    "72": "Rippers",
    "73": "Scratchers",
    "74": "Shoulder Cam",
    "75": "Slice 'N Dice",
    "76": "Subdermal Grip",
    "77": "Techscanner",
    "78": "Tool Hand",
    "79": "Wolvers",
    "80": "Cyberleg",
    "81": "Standard Foot",
    "82": "Grip Foot",
    "83": "Jump Booster",
    "84": "Skate Foot",
    "85": "Talon Foot",
    "86": "Web Foot",
    "87": "Hardened Shielding (Cyber Leg)",
    "88": "Plastic Covering (Cyber Leg)",
    "89": "Realskinn Covering (Cyber Leg)",
    "90": "Superchrome Covering (Cyber Leg)",
    "91": "Artificial Shoulder Mount",
    "92": "Implanted Linear Frame β (Beta)",
    "93": "Implanted Linear Frame ∑ (Sigma)",
    "94": "MultiOptic Mount",
    "95": "Sensor Array",
    "96": "Hardened Shielding (Cyber Arm)",
    "97": "Plastic Covering (Cyber Arm)",
    "99": "Superchrome Covering (Cyber Arm)"
};

const CLOTHING_TYPES = new Map();
CLOTHING_STYLES.map((styleName, styleIndex) => {
    CLOTHING_PIECES.map((pieceName, pieceIndex) => {
        CLOTHING_TYPES.set(pieceIndex * 10 + styleIndex, `${styleName} ${pieceName}`);
    });
});

async function updateExistingItem(itemName, quantity, actor) {
    const existingItem = actor.items.getName(itemName);
    if (existingItem) {
        if (quantity !== undefined) {
            console.debug(`Updating existing ${itemName} to quantity x${quantity}`);
            await existingItem.update({ system: { amount: quantity } });
        } else {
            console.debug(`Found existing ${itemName}, skipping...`);
        }
        return true;
    }
    return false;
}

async function importItemData(data, actor, databaseName, getItemName) {
    return await Promise.all(data[databaseName].map(async piece => {
        const itemName = getItemName(piece);
        if (!itemName) {
            ui.notifications.error(`Failed to import unknown ${databaseName}`);
            return;
        }

        if (itemName.includes("Cyberchair")) {
            databaseName = "cyberchairs";
        }

        const existing = await updateExistingItem(itemName, piece.quantity, actor);
        if (existing) {
            return;
        }

        const data = databases[databaseName].getName(itemName);
        if (data) {
            const item = await Item.implementation.fromDropData({
                type: 'Item',
                uuid: getItemUuid(DATABASE_IDS[databaseName], data._id)
            });
            console.debug(`Importing ${itemName} x${piece.quantity}`, item);
            const itemData = item.toObject();
            if (piece.quantity !== undefined) {
                itemData.system.amount = piece.quantity;
            }
            const result = await actor.createEmbeddedDocuments("Item", [itemData]);
            return result[0];
        } else {
            ui.notifications.warn(`Unable to import ${itemName} for ${actor.name}`);
        }
    }));
}

function _waitForInstall(item, timeout, resolve, reject) {
    const startTime = new Date().getTime();
    setTimeout(() => {
        const now = new Date().getTime();
        const remaining = timeout - (now - startTime);
        if (item.system.isInstalled) {
            resolve();
        } else if (remaining < 100) {
            reject();
        } else {
            _waitForInstall(item, remaining, resolve, reject);
        }
    }, 100);
}

function waitForInstall(item, timeout) {
    return new Promise((resolve, reject) => {
        _waitForInstall(item, timeout, resolve, reject);
    })
}

export async function importItems(data, actor) {
    await importItemData(data, actor, "clothing",
            piece => CLOTHING_TYPES.get(piece.clothing_type_id));
    await importItemData(data, actor, "armor",
            piece => ARMOR_TYPES[Number(piece.armor_type_id)]);
    await importItemData(data, actor, "gear",
        piece => GEAR_TYPES[piece.gear_type_id]);
    await importItemData(data, actor, "program",
        piece => PROGRAM_TYPES[piece.program_type_id]);
    await importItemData(data, actor, "weapon",
        piece => WEAPON_TYPES[piece.weapon_type_id] + WEAPON_QUALITY[piece.quality]);
    await importItemData(data, actor, "ammunition",
        piece => AMMO_TYPES[piece.ammunition_type_id]);

    const allCyberware = await importItemData(data, actor, "cybergear",
        piece => CYBERWARE_TYPES[piece.cybergear_type_id]);
    const cyberware = allCyberware.filter(item => item !== undefined && !item.system.isInstalled);
    const foundationalCyberware = cyberware.filter(item => item.system.isFoundational);
    const otherCyberware = cyberware.filter(item => !item.system.isFoundational);
    console.debug("Installing foundational cyberware", foundationalCyberware);
    for (let foundational of foundationalCyberware) {
        await actor.installCyberware(foundational._id);
        try {
            await waitForInstall(foundational, 3000);
        } catch (e) {
            ui.notifications.warn(`${foundational.name} may not have been fully installed`);
        }
    }
    console.debug("Installing other cyberware", otherCyberware);
    for (let other of otherCyberware) {
        await actor.installCyberware(other._id);
    }
    console.debug("Done installing cyberware");
}

const ITEMS_KEYS = [
    "clothing", "armor", "gear", "programs", "weapons", "ammunition", "cyberware", "vehicles"
];

const AMMO_QUALIFIERS = [
    "Acid",
    "Arachnid",
    "Basic",
    "Biotoxin",
    "Expansive",
    "EMP",
    "Flashbang",
    "Incendiary",
    "Poison",
    "Rubber",
    "Sleep",
    "Smart",
    "Smoke",
    "Security",
    "Teargas",
]

const MULTI_WORD_AMMO_QUALIFIERS = [
    "Armor Piercing",
    "Improved Smart",
]

const SINGULAR_CLOTHING_TYPES = [
    "Hat",
    "Top",
]

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
]

const MULTI_WORD_BRANDS = [
    "constitution arms",
    "tsunami arms",
]

const MULTI_WORD_REMOVE_BRAND_REGEX = new RegExp(`^(${MULTI_WORD_BRANDS.join("|")}) `, "i");

const SINGULAR_CLOTHING_FIX_REGEX = new RegExp(`(${SINGULAR_CLOTHING_TYPES.join("|")})s`, "i");

const CAMELCASE_FIX_REGEX = new RegExp(`(${CAMELCASE_FIXES.join("|")})`, "gi");

function extractItemName(item) {
    let itemName = item.type.replace(/([A-Z0-9])(?=[a-z0-9])/g, ' $1').trim()
    if (itemName === "SelfICE") {
        return "Self-ICE";
    }
    const camelCaseFix = itemName.matchAll(CAMELCASE_FIX_REGEX);
    for (const fix of (camelCaseFix ?? [])) {
        itemName = itemName.replace(fix[0], fix[0].replace(" ", ""));
    }
    // As a simple heuristic, if the item has a description it is probably a non-standard/exotic/branded
    // item, which might be high or low quality without having that in the name.
    if (item.quality && !item.description && item.quality !== "Standard") {
        itemName += ` (${item.quality})`;
    }
    return itemName;
}

function normalizeItemName(itemName, itemType) {
    if (itemType === "clothing") {
        itemName = itemName.replace(SINGULAR_CLOTHING_FIX_REGEX, "$1");
    }
    if (itemType === "weapon" && itemName.endsWith(" Weapon")) {
        if (!itemName.includes("Hurricane Assault"))
        itemName = itemName.slice(0, -7);
    }
    if (itemType === "armor") {
        if (itemName === "Bodyweight Suit Body") {
            return "Bodyweight Suit";
        }
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
    return normalized.split(" ").slice(1).join(" ")
}

function isExactMatch(searchResult, targetName, itemType) {
    const resultName = searchResult.toLowerCase().replace("-", " ");
    const itemName = targetName.toLowerCase().replace("-", " ");
    if (itemType === "armor" && resultName !== itemName) {
        const normalizedItemName = itemName.replace(/ (armor|body)$/i, " (body)")
        // console.debug(`Comparing ${resultName} to normalized armor ${normalizedItemName}`)
        return resultName === normalizedItemName;
    }
    return resultName === itemName;
}

async function findItem(itemName, itemType, alreadyUnbranded = false) {
    const normalized = normalizeItemName(itemName, itemType)
    if (itemName !== normalized) {
        // console.debug(`Normalized ${itemName} (${itemType}) to ${normalized}`);
    }
    const searchResults = QuickInsert.search(normalized)

    const exactMatches = searchResults.filter(result => isExactMatch(result.item.name, normalized, itemType));

    if (exactMatches.length === 1) {
        return exactMatches[0].item;
    } else if (exactMatches.length > 1) {
        const matches = await Promise.all(exactMatches.map(async (result) =>
            [result, await result.item.get()]));
        const typeMatches = matches.filter(item => item[1].type === itemType);
        if (typeMatches.length === 1) {
            return typeMatches[0][0].item;
        } else {
            const worldMatches = matches.filter(item => item[1].pack == null);
            if (worldMatches.length === 1) {
                return worldMatches[0][0].item;
            }
            console.debug(`Unable to type-match exact matches for ${itemName} (${itemType}):`, matches);
        }
    }

    if (alreadyUnbranded) {
        // Since "unbranding" just removes the first word, it can be noisy, so just return and let
        // the outer call try to handle it.
        return;
    }

    if (itemType === "ammunition" && !normalized.includes("(")) {
        let qualifiedAmmunition = normalizeAmmunitionQualifier(normalized)
        // console.debug(`Adjusting ammunition qualifier from ${itemName} (${itemType}) to ${qualifiedAmmunition}`);
        return await findItem(qualifiedAmmunition, itemType, alreadyUnbranded);
    }

    if (!alreadyUnbranded && searchResults.length === 0) {
        const unbranded = removeBrand(normalized);
        if (unbranded !== "" && unbranded !== normalized) {
            // console.debug(`Attempting to remove brand from ${itemName} (${itemType}) to ${unbranded}.`);
            const unbrandedResult = await findItem(unbranded, itemType, true);
            if (unbrandedResult) {
                return unbrandedResult;
            }
        }
        console.debug(`Unable to find ${itemName} (${itemType}) in Foundry.`);
    }

    // searchResults.sort((a, b) => {
    //     return a.match[0].indices.length - b.match[0].indices.length;
    // });
    // const bestMatchQuality = searchResults[0].match[0].indices.length;
    // const bestMatches = searchResults.filter(result => result.match[0].indices.length === bestMatchQuality);
    //
    // console.debug(`No exact matches for ${itemName} (${itemType}),` +
    //     ` found next best matches with ${bestMatchQuality} indices:`, bestMatches);

    function openSearchDialogue(resolve, reject, retries = 0) {
        if (!(QuickInsert.app._state === -1 || QuickInsert.app._state === 0)) {
            if (retries > 20) {
                reject("Unable to open Quick Insert after 2 seconds.");
            }
            setTimeout(() => openSearchDialogue(resolve, reject, retries + 1), 100);
            return;
        }
        try {
            QuickInsert.open({
                classes: ["cpr-character-importer-quick-insert-item"],
                startText: normalized,
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
        openSearchDialogue(resolve, reject)
    });
}

export async function importItemsV2(data, actor) {
    const missingItems = [];
    for (const itemType of ITEMS_KEYS) {
        for (const item of Object.values(data[itemType] ?? {})) {
            const itemName = extractItemName(item)
            const systemItem = await findItem(
                itemName,
                itemType.replace(/s$/, "")
            );
            if (systemItem) {
                // console.info(`Found or selected ${itemName} (${itemType}):`, systemItem);
                const quantity = item.quantity
                const existing = await updateExistingItem(systemItem.name, quantity, actor);
                if (!existing) {
                    console.debug(`Importing ${itemName} x${quantity}`, item);
                    const itemData = await systemItem.get();
                    if (quantity !== undefined) {
                        itemData.system.amount = quantity;
                    }
                    await actor.createEmbeddedDocuments("Item", [itemData]);
                }
            } else {
                missingItems.push(itemName);
            }
        }
    }
    ui.notifications.error("The following items were skipped during import: "
        + missingItems.join(", "));
}