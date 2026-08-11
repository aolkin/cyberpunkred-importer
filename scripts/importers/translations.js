export const CORE_SYSTEM_ID = "cyberpunk-red-core";

const babeleTranslationCache = new Map();

export function getCurrentLanguage() {
    return game.i18n?.lang ?? game.settings?.get("core", "language") ?? "en";
}

export function getBabeleLanguages() {
    const language = getCurrentLanguage();
    if (!language) {
        return ["en"];
    }

    const baseLanguage = language.split("-")[0];
    return [...new Set([language, baseLanguage, "en"])];
}

export function stripTrademarkSymbols(itemName) {
    return String(itemName ?? "").replace(/[®™©]/g, "");
}

export function normalizeLocalizationKey(itemName) {
    return stripTrademarkSymbols(itemName)
        .toLowerCase()
        .replace(/[-\u2010-\u2015/]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function getLocalizationKeys(itemName) {
    const normalized = normalizeLocalizationKey(itemName);
    return [...new Set([
        itemName,
        stripTrademarkSymbols(itemName),
        normalized,
        normalized.replace(/\s/g, "")
    ])];
}

export function addTranslationVariant(translations, key, value) {
    if (!value) {
        return;
    }

    const values = translations.get(key) ?? [];
    if (!values.includes(value)) {
        values.push(value);
    }
    translations.set(key, values);
}

export async function fetchBabeleTranslationFile(language, packName) {
    const translationPath = `systems/${CORE_SYSTEM_ID}/babele/${language}/${CORE_SYSTEM_ID}.${packName}.json`;
    try {
        const response = await fetch(translationPath);
        if (!response.ok) {
            return;
        }
        return await response.json();
    } catch (error) {
        console.debug(`Unable to load ${translationPath}`, error);
    }
}

export async function getBabeleTranslations(packName) {
    const cacheKey = `${getCurrentLanguage()}:${packName}`;
    if (babeleTranslationCache.has(cacheKey)) {
        return babeleTranslationCache.get(cacheKey);
    }

    const translations = new Map();
    for (const language of getBabeleLanguages()) {
        const translationData = await fetchBabeleTranslationFile(language, packName);
        for (const [englishName, entry] of Object.entries(translationData?.entries ?? {})) {
            const translatedNames = [englishName, entry?.name];
            for (const key of getLocalizationKeys(englishName)) {
                for (const name of translatedNames) {
                    addTranslationVariant(translations, key, name);
                }
            }
        }
    }

    babeleTranslationCache.set(cacheKey, translations);
    return translations;
}

export function namesMatch(name, targetName) {
    const targetKeys = new Set(getLocalizationKeys(targetName));
    return getLocalizationKeys(name).some(key => targetKeys.has(key));
}

export async function getLocalizedItemNameVariants(itemNames, packNames = []) {
    const sourceNames = [...new Set(
        (Array.isArray(itemNames) ? itemNames : [itemNames])
            .filter(name => name)
    )];
    const localizedNames = [...sourceNames];
    const lookupKeys = sourceNames.flatMap(name => getLocalizationKeys(name));
    const packTranslations = await Promise.all(packNames.map(packName => getBabeleTranslations(packName)));

    for (const translations of packTranslations) {
        for (const key of lookupKeys) {
            for (const translatedName of translations.get(key) ?? []) {
                if (!localizedNames.includes(translatedName)) {
                    localizedNames.push(translatedName);
                }
            }
        }
    }

    return localizedNames;
}
