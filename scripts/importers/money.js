function parseMoneyValue(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.trunc(value);
    }

    if (typeof value === "string" && value.trim() !== "") {
        const normalized = value.replace(/[\s,_]/g, "");
        const match = normalized.match(/-?\d+(?:\.\d+)?/);
        if (!match) {
            return;
        }

        const parsed = Number(match[0]);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
    }
}

function getMoney(data) {
    return parseMoneyValue(data?.eddies);
}

function getImportReason() {
    const userName = game.user?.name;
    return userName
        ? `Imported from cyberpunkred.com - ${userName}`
        : "Imported from cyberpunkred.com";
}

export async function updateMoney(data, actor) {
    const money = getMoney(data);
    if (money === undefined) {
        return;
    }

    if (!actor.system?.wealth) {
        console.debug(`Skipping money import for ${actor.name}; actor has no wealth ledger.`);
        return;
    }

    const currentValue = Number(actor.system.wealth.value ?? 0);
    const transactions = Array.isArray(actor.system.wealth.transactions)
        ? [...actor.system.wealth.transactions]
        : [];
    const updateData = {
        "system.wealth.value": money
    };

    if (currentValue !== money || transactions.length === 0) {
        updateData["system.wealth.transactions"] = [
            ...transactions,
            [`Set wealth to ${money} eb during import.`, getImportReason()]
        ];
    }

    await actor.update(updateData);
}
