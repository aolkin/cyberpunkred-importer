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

export async function updateStats(data, actor) {
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
        humanity: { value: data.humanity, max: data.humanity }
    };

    console.debug('Updating stats', stats, derivedStats);
    await actor.update({
        system: { derivedStats, stats },
    });
}
