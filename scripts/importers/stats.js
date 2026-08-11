const STAT_TYPE_MAP = {
    0: 'int', 1: 'ref', 2: 'dex', 3: 'tech', 4: 'cool', 5: 'will', 6: 'luck', 7: 'move', 8: 'body', 9: 'emp',
}

const STAT_NAME_MAP = {
    "Intelligence": "int",
    "Reflexes": "ref",
    "Dexterity": "dex",
    "Technique": "tech",
    "Cool": "cool",
    "Combat": "combat",
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
    return Object.entries(data.stats).map(([statName, points]) => [STAT_NAME_MAP[statName], points])
}

export async function updateStats(data, actor, isV2) {
    let stats = actor.system.stats;
    for (var stat in stats) {
        stats[stat].value = 0;
        if (stats[stat].max !== undefined) stats[stat].max = 0;
    }

    await actor.update({
        system: {stats},
    });

    stats = (isV2 ? getStatsV2(data) : getStatsV1(data)).reduce((acc, [statName, value]) => {
        acc[statName] = {value};
        if (actor.system.stats[statName]?.max !== undefined) {
            acc[statName].max = value;
        }
        return acc;
    }, {});

    let derivedStats = {};
    if (stats.emp !== undefined) {
        derivedStats = {
            hp: {value: data.health, max: data.health},
            humanity: {value: stats.emp.value * 10, max: stats.emp.value * 10}
        };
    } else {
        derivedStats = {
            hp: {value: data.health, max: data.health},
            humanity: {value: data.humanity, max: data.humanity}
        };
    }

    const reputation = {value: data.reputation};

    console.debug('Updating stats', stats, derivedStats);
    await actor.update({
        system: {derivedStats, stats, reputation},
    });
}
