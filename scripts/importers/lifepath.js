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
    0: "friends",
    1: "enemies",
    2: "friends",
    3: "tragicLoveAffairs",
}

export async function updateLifepath(data, actor) {
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
            text = `<b>${text}</b>\n` + contact.details;
        }
        const relationshipType = CONTACT_RELATIONSHIP_TYPES[contact.contact_type_id]
        if (!relationshipType) {
            ui.notifications.warn(`Unknown relationship type (${contact.contact_type_id}) for ${contact.name}`);
            return;
        }
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
    await actor.update({
        system: { lifepath },
        name: `${data.handle} (${data.name})`
    });
}
