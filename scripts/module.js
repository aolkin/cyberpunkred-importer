// Hooks.once('init', async function() {
// });

// Hooks.once('ready', async function() {
// });

const LOOKUP_BASEURL = 'https://firestore.googleapis.com/v1/projects/cyberpunk-red-companion-dae35/databases/(default)/documents/code_to_character/';
const DATA_BASEURL = 'https://firestore.googleapis.com/v1/projects/cyberpunk-red-companion-dae35/databases/(default)/documents/character_export/';

function debounceAsync(func, timeout) {
    let timer;
    return async (...args) => {
        return new Promise((resolve, reject) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                try {
                    resolve(func.apply(this, args));
                } catch (e) {
                    reject(e);
                }
            }, timeout);
        });
    };
}

function parseFirebase(data) {
    const isArray = Array.isArray(data)
    const keys = isArray ? data.map((o, i) => i) : Object.keys(data);
    return keys.reduce((acc, key) => {
        const value = data[key];
        if (value.stringValue) {
            acc[key] = value.stringValue;
        } else if (value.booleanValue) {
            acc[key] = value.booleanValue;
        } else if (value.integerValue) {
            acc[key] = Number.parseInt(value.integerValue);
        } else if (value.floatValue) {
            acc[key] = Number.parseFloat(value.floatValue);
        } else if (value.arrayValue) {
            if (value.arrayValue.values) {
                acc[key] = parseFirebase(value.arrayValue.values);
            } else {
                acc[key] = [];
            }
        } else if (value.mapValue) {
            acc[key] = parseFirebase(value.mapValue.fields);
        }
        return acc;
    }, isArray ? [] : {});
}

/**
 * @param {ActorSheet} sheet
 * @param {ApplicationHeaderButton[]} buttons
 */
function getActorSheetHeaderButtons(sheet, buttons) {
    if (!game.user.can('FILES_UPLOAD')) return
    buttons.unshift({
        label: 'Import',
        icon: 'fas fa-cloud-download-alt',
        class: 'aolkin-cyberpunkred-importer',
        onclick: () => startImport(sheet),
    })
}

Hooks.on('getActorSheetHeaderButtons', getActorSheetHeaderButtons)

function startImport(sheet) {
    new Dialog({
        title: 'Import Character from cyberpunkred.com',
        content: `Enter Character Export Code:
    <input class="character-import-code"><br>
    <div class="character-import-name">&nbsp;</div>`,
        buttons: {
            import: {
                icon:  '<i class="fas fa-cloud-download-alt"></i>',
                label: 'Import Character',
                callback: async (html) => {
                    const data = html.find('button').data('characterData')
                    if (!data) return;
                    await importCharacter(sheet.object, data)
                }
            }
        },
        render: html => {
            const button = html.find('button');
            const nameDisplay = html.find('.character-import-name')
            button.prop('disabled', true);

            let lastCode = '';
            html.find('.character-import-code').on('keyup change', async (e) => {
                const code = $(e.target).val();
                if (code === lastCode) return;
                lastCode = code;
                if (/[A-Z0-9]{6}/.test(code)) {
                    nameDisplay.text('Loading data...');
                    nameDisplay.removeClass('invalid-code');
                    try {
                        const characterData = await loadCharacter(code);
                        button.data('characterData', characterData);
                        button.prop('disabled', false);
                        nameDisplay.text(`Character to Import: ${characterData.name}`);
                    } catch (e) {
                        nameDisplay.text(e);
                        nameDisplay.addClass('invalid-code');
                        button.prop('disabled', true);
                    }
                } else {
                    button.prop('disabled', true);
                    if (code.length > 0) {
                        nameDisplay.text('Invalid code');
                        nameDisplay.addClass('invalid-code');
                    } else {
                        nameDisplay.text('');
                    }
                }
            })
        }
    }).render(true);
}

async function _loadCharacter(code) {
    const lookupUrl = LOOKUP_BASEURL + code;
    const lookup_result = await fetch(lookupUrl)
    const lookup_data =  await lookup_result.json();
    if (lookup_data.error) {
        throw new Error(lookup_data.error.message);
    }
    const characterId = lookup_data.fields.character_uuid.stringValue;
    console.debug(`Found Character ID for code ${code}: ${characterId}`);
    const dataUrl = DATA_BASEURL + characterId;
    const character_response = await fetch(dataUrl);
    const character_data = await character_response.json();
    if (lookup_data.error) {
        throw new Error(lookup_data.error.message);
    }
    return parseFirebase(character_data.fields);
}

const loadCharacter = debounceAsync(_loadCharacter, 500);

const STAT_TYPE_MAP = {
    0: 'int',
    1: 'ref',
    2: 'dex',
    3: 'tech',
    4: 'cool',
    5: 'will',
    6: 'luck',
    7: 'move',
    8: 'body',
    9: 'emp',
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

// B.dh=new A.ft(0,"Rockerboy")
// B.di=new A.ft(1,"Fixer")
// B.c3=new A.ft(2,"Solo")
// B.cI=new A.ft(3,"Nomad")
// B.bk=new A.ft(4,"Netrunner")
// B.d4=new A.ft(5,"Tech")
// B.dj=new A.ft(6,"Medtech")
// B.dk=new A.ft(7,"Media")
// B.dE=new A.ft(8,"Lawman")
// B.dl=new A.ft(9,"Exec")

const LIFEPATH_FIELDS = {
    aboutPeople: /How Do You Feel About Most People/i,
    languages: /Languages/i,
    affectations: /Affectation/i,
    childhoodEnvironment: /Childhood Environment/i,
    clothingStyle: /Clothing Style/i,
    culturalOrigin: /Cultural/i,
    familyBackground: /Family Background/i,
    familyCrisis: /Family Crisis/i,
    hairStyle: /Hairstyle/i,
    lifeGoals: /Life Goals/i,
    valuedPerson: /Valued Person/i,
    valuedPossession: /Valued Possession/i
}

const CONTACT_RELATIONSHIP_TYPES = {
    1: "enemies",
    2: "friends",
    3: "tragicLoveAffairs",
    4: "friends",
}

async function importCharacter(actor, data) {
    if (actor.type !== 'character') {
        throw new Error('Can only import characters');
    }
    console.info('Importing character', data, 'to actor', actor);

    const stats = data.stat.reduce((acc, stat) => {
        const statName = STAT_TYPE_MAP[stat.stat_type_id]
        acc[statName] = { value: stat.points };
        if (actor.system.stats[statName].max) {
            acc[statName].max = stat.points;
        }
        return acc;
    }, {});

    const derivedStats = {
        hp: { value: data.health, max: data.health },
        humanity: { value: data.humanity }
    };

    const identifyingFeatures = data.identifying_features.split("\n\n");
    const background = data.background.split("\n\n");
    const roleLifePath = [];
    const lifepath = [...identifyingFeatures, ...background].reduce((acc, item) => {
        const bits = item.split("\n");
        const label = bits[0];
        const match = Object.entries(LIFEPATH_FIELDS).find(([attr, regex]) => regex.test(label));
        if (match) {
            acc[match[0]] = bits.slice(1).join("\n");
        } else {
            roleLifePath.push(item);
        }
        return acc;
    }, {});
    lifepath['personality'] = data.personality;
    lifepath['roleLifepath'] = roleLifePath.join("\n\n");

    data.contact.forEach(contact => {
        let text = contact.name;
        if (contact.organization) {
            const position = contact.position ? ' - ' + contact.position : '';
            text += ` (${contact.organization}${position})`;
        }
        if (contact.details) {
            text += '\n' + contact.details;
        }
        const relationshipType = CONTACT_RELATIONSHIP_TYPES[contact.contact_type_id]
        if (!lifepath[relationshipType]) {
            lifepath[relationshipType] = [];
        }
        lifepath[relationshipType].push(text);
    });
    Object.values(CONTACT_RELATIONSHIP_TYPES).forEach(name => {
        if (lifepath[name]) {
            return lifepath[name] = lifepath[name].join('\n\n');
        }
    })

    Object.keys(lifepath).forEach(key => lifepath[key] = lifepath[key].replaceAll('\n', '<br>'));

    console.info('Updating stats', stats, derivedStats);
    await actor.update({
        system: { derivedStats, stats, lifepath },
        name: `${data.handle} (${data.name})`
    });

    data.skill.forEach(async (skillData) => {
        const skillName = SKILL_TYPE_MAP[skillData.skill_type_id];
        const skillItem = actor.items.getName(skillName);
        if (skillItem) {
            await skillItem.update({ system: { level: skillData.points } });
        } else {
            ui.notifications.warn(`Unable to find item for skill: ${skillName}`);
        }
    }, {});

    ui.notifications.info(`Done importing character ${data.name} from ${data.code_to_character}.`);
}
