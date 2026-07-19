const LIFEPATH_FIELDS = {
    aboutPeople: /How Do You Feel About Most People\??/i,
    languages: /Languages/i,
    affectations: /(?:Affectations?|You Are Never Without)/i,
    childhoodEnvironment: /Childhood Environment/i,
    clothingStyle: /Clothing Style/i,
    culturalOrigin: /(?:(?:Your \(General\)\s+)?Cultural(?: Origins?| Region)?|Region)/i,
    familyBackground: /(?:Your Original )?Family Background/i,
    familyCrisis: /(?:Your )?Family Crisis/i,
    hairStyle: /Hair ?style/i,
    lifeGoals: /(?:Your )?Life Goals/i,
    roleLifepath: /What is your role\??/i,
    valueMost: /What Do You Value Most\??/i,
    valuedPerson: /(?:Most )?Valued Person(?: in Your Life)?\??/i,
    valuedPossession: /(?:Most )?Valued Possession(?: You Own)?\??/i
}
const LIFEPATH_NOTE_FIELDS = [
    ["culturalOrigin", "CPR.characterSheet.bottomPane.lifepath.culturalOrigins", "Cultural Origins"],
    ["languages", "CPR.characterSheet.bottomPane.lifepath.languages", "Languages"],
    ["personality", "CPR.characterSheet.bottomPane.lifepath.personality", "Personality"],
    ["clothingStyle", "CPR.characterSheet.bottomPane.lifepath.clothingStyle", "Clothing Style"],
    ["hairStyle", "CPR.characterSheet.bottomPane.lifepath.hairStyle", "Hairstyle"],
    ["affectations", "CPR.characterSheet.bottomPane.lifepath.affectations", "You Are Never Without"],
    ["valueMost", "CPR.characterSheet.bottomPane.lifepath.valueMost", "What Do You Value Most?"],
    ["aboutPeople", "CPR.characterSheet.bottomPane.lifepath.peopleFeelings", "Feelings About People"],
    ["valuedPerson", "CPR.characterSheet.bottomPane.lifepath.valuedPerson", "Most Valued Person"],
    ["valuedPossession", "CPR.characterSheet.bottomPane.lifepath.valuedPossession", "Most Valued Possession"],
    ["familyBackground", "CPR.characterSheet.bottomPane.lifepath.familyBackground", "Family Background"],
    ["childhoodEnvironment", "CPR.characterSheet.bottomPane.lifepath.childhoodEnvironment", "Childhood Environment"],
    ["familyCrisis", "CPR.characterSheet.bottomPane.lifepath.familyCrisis", "Family Crisis"],
    ["friends", "CPR.characterSheet.bottomPane.lifepath.friends", "Friends"],
    ["enemies", "CPR.characterSheet.bottomPane.lifepath.enemies", "Enemies"],
    ["tragicLoveAffairs", "CPR.characterSheet.bottomPane.lifepath.lovers", "Lovers"],
    ["lifeGoals", "CPR.characterSheet.bottomPane.lifepath.lifeGoals", "Life Goals"],
    ["roleLifepath", "CPR.global.generic.role", "Role"]
];
const CONTACT_RELATIONSHIP_TYPES = {
    0: "friends",
    1: "enemies",
    2: "friends",
    3: "tragicLoveAffairs",
}
const CONTACT_RELATIONSHIP_MAPPING = {
    "romance": "tragicLoveAffairs",
    "enemy": "enemies",
}

function getRelationshipType(contact) {
    if (contact.relationship) {
        if (contact.relationship in CONTACT_RELATIONSHIP_MAPPING) {
            return CONTACT_RELATIONSHIP_MAPPING[contact.relationship];
        }
        return CONTACT_RELATIONSHIP_TYPES[0];
    }
    return CONTACT_RELATIONSHIP_TYPES[contact.contact_type_id] || "friends";
}

function parseLifepathText(text) {
    const source = `${text ?? ''}`
        .replace(/<br\s*\/?>/gi, '\n')
        .replaceAll('\r', '')
        .trim();
    if (!source) return {lifepath: {}, unmatched: []};

    const labelPatterns = Object.entries(LIFEPATH_FIELDS)
        .map(([attr, regex]) => ({
            attr,
            source: regex.source
        }));
    const labels = labelPatterns.map(({source: pattern}) => `(?:${pattern})`).join('|');
    const labelRegex = new RegExp(`(?:^|(?<=\\s))(${labels})(?:\\s*:\\s*|\\s+)`, 'gi');
    const matches = [...source.matchAll(labelRegex)];

    if (matches.length === 0) {
        return {lifepath: {}, unmatched: [source]};
    }

    const lifepath = {};
    const unmatched = [];
    const prefix = source.slice(0, matches[0].index).trim();
    if (prefix) unmatched.push(prefix);

    matches.forEach((match, index) => {
        const label = match[1];
        const field = labelPatterns.find(({source: pattern}) => new RegExp(`^(?:${pattern})$`, 'i').test(label));
        const valueStart = match.index + match[0].length;
        const valueEnd = matches[index + 1]?.index ?? source.length;
        const value = source.slice(valueStart, valueEnd).trim();

        if (!field || !value) return;
        lifepath[field.attr] = lifepath[field.attr]
            ? `${lifepath[field.attr]}\n\n${value}`
            : value;
    });

    return {lifepath, unmatched};
}

function localize(key, fallback) {
    const localized = game.i18n.localize(key);
    return localized === key ? fallback : localized;
}

function extractRoleQuestions(lifepath) {
    const questions = [];
    const questionRegex = /(?:^|\n{2,})([^\n]+\?)\s*\n+/g;

    for (const fieldName of ["lifeGoals", "roleLifepath"]) {
        const value = lifepath[fieldName];
        if (!value) continue;

        const matches = [...value.matchAll(questionRegex)];
        if (matches.length === 0) continue;

        const fieldValue = value.slice(0, matches[0].index).trim();
        if (fieldValue) {
            lifepath[fieldName] = fieldValue;
        } else {
            delete lifepath[fieldName];
        }

        matches.forEach((match, index) => {
            const answerStart = match.index + match[0].length;
            const answerEnd = matches[index + 1]?.index ?? value.length;
            const answer = value.slice(answerStart, answerEnd).trim();
            if (answer) questions.push({question: match[1].trim(), answer});
        });
    }

    return questions;
}

function formatLifepathNotes(lifepath) {
    const fields = LIFEPATH_NOTE_FIELDS
        .filter(([fieldName]) => lifepath[fieldName])
        .map(([fieldName, localizationKey, fallback]) => `
            <p>
                <h3>${localize(localizationKey, fallback)}</h3><br>
                ${lifepath[fieldName]}
            </p>
        `)
        .join('');
    const title = localize(
        "CPR.characterSheet.bottomPane.lifepath.title",
        "Lifepath"
    );

    return `
        <h2>${title}</h2>
        ${fields}
    `.trim();
}

function formatRoleNotes(questions) {
    if (questions.length === 0) return '';

    const fields = questions
        .map(({question, answer}) => `
            <p>
                <h3>${question}</h3><br>
                ${answer.replaceAll('\n', '<br>')}
            </p>
        `)
        .join('');
    const title = localize(
        "CPRImporter.Notes.RoleLifepath",
        "Role Lifepath"
    );

    return `
        <h2>${title}</h2>
        ${fields}
    `.trim();
}

function isMookData(data, actor) {
    return actor.type === 'mook'
        || Number(data.character_type_id) === 1
        || /^(?:NPC|Mook|NonPlayerCharacter)$/i.test(data.characterType ?? '');
}

export async function updateLifepath(data, actor) {
    const identifyingFeatures = parseLifepathText(data.identifying_features ?? data.identifyingFeatures);
    const background = parseLifepathText(data.background);
    const lifepath = {
        ...identifyingFeatures.lifepath,
        ...background.lifepath
    };
    const unmatched = [...identifyingFeatures.unmatched, ...background.unmatched];

    if (data.personality) lifepath.personality = data.personality;
    if (data.motivation) lifepath.valueMost = data.motivation;
    if (unmatched.length > 0) {
        lifepath.roleLifepath = [lifepath.roleLifepath, ...unmatched]
            .filter(Boolean)
            .join("\n\n");
    }
    const roleQuestions = extractRoleQuestions(lifepath);

    // V1 Data Model
    (data.contact || Object.values(data.contacts)).forEach(contact => {
        let text = contact.name;
        if (contact.organization) {
            const position = contact.position ? ' - ' + contact.position : '';
            text += ` (${contact.organization}${position})`;
        }
        if (contact.details) {
            text = `<b>${text}</b>\n` + contact.details;
        }
        const relationshipType = getRelationshipType(contact);
        if (!lifepath[relationshipType]) {
            lifepath[relationshipType] = [];
        }
        lifepath[relationshipType].push(text);
    });
    new Set(Object.values(CONTACT_RELATIONSHIP_TYPES)).forEach(name => {
        if (lifepath[name]) {
            return lifepath[name] = lifepath[name].join('\n\n');
        }
    })

    Object.keys(lifepath).forEach(key => lifepath[key] = (lifepath[key] ?? '').replaceAll('\n', '<br>'));

    console.debug('Updating lifepath and name', lifepath);

    const handle = data.handle ? ` (${data.handle})` : '';
    const roleNotes = formatRoleNotes(roleQuestions);
    const system = isMookData(data, actor)
        ? {
            information: {
                notes: [formatLifepathNotes(lifepath), roleNotes]
                    .filter(Boolean)
                    .join(''),
                ...(data.handle ? {alias: data.handle} : {})
            }
        }
        : {
            lifepath,
            ...(roleNotes ? {information: {notes: roleNotes}} : {})
        };

    await actor.update({
        system,
        name: `${data.name} ${handle}`.trim()
    });
}
