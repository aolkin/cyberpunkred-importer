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
        if ('stringValue' in value) {
            acc[key] = value.stringValue;
        } else if ('booleanValue' in value) {
            acc[key] = value.booleanValue;
        } else if ('integerValue' in value) {
            acc[key] = Number.parseInt(value.integerValue);
        } else if ('floatValue' in value) {
            acc[key] = Number.parseFloat(value.floatValue);
        } else if ('arrayValue' in value) {
            if (value.arrayValue.values) {
                acc[key] = parseFirebase(value.arrayValue.values);
            } else {
                acc[key] = [];
            }
        } else if ('mapValue' in value) {
            acc[key] = parseFirebase(value.mapValue.fields);
        }
        return acc;
    }, isArray ? [] : {});
}

async function _loadCharacter(code) {
    const lookupUrl = LOOKUP_BASEURL + code;
    const lookup_result = await fetch(lookupUrl)
    const lookup_data = await lookup_result.json();
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

export const loadCharacter = debounceAsync(_loadCharacter, 500);
