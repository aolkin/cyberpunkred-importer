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

const STAT_NAME_MAP = {
    "Intelligence": "int",
    "Reflexes": "ref",
    "Dexterity": "dex",
    "Technique": "tech",
    "Cool": "cool",
    "Willpower": "will",
    "Luck": "luck",
    "Movement": "move",
    "Body": "body",
    "Empathy": "emp"
}

function getStatsV1(data) {
    return data.stat.map((stat) => [STAT_TYPE_MAP[stat.stat_type_id], stat.points])
}

function getStatsV2(data) {
    return Object.entries(data.stats).map(([statName, points]) =>
        [STAT_NAME_MAP[statName], points])
}

export async function updateStats(data, actor, isV2) {
    const stats = (isV2 ? getStatsV2(data) : getStatsV1(data)).reduce((acc, [statName, value]) => {
        acc[statName] = { value };
        if (actor.system.stats[statName].max) {
            acc[statName].max = value;
        }
        return acc;
    }, {});

    const derivedStats = {
        hp: { value: data.health, max: data.health },
        humanity: { value: data.humanity, max: data.humanity }
    };

    console.debug('Updating stats', stats, derivedStats);
    await actor.update({
        system: { derivedStats, stats },
    });
}
