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
    return character_data.fields;
}

const loadCharacter = debounceAsync(_loadCharacter, 500);

async function importCharacter(sheet, data) {
    console.info("Importing character", data);
}

function startImport(sheet) {
    new Dialog({
        title: "Import Character from cyberpunkred.com",
        content: `Enter Character Export Code:
    <input class="character-import-code"><br>
    <div class="character-import-name">&nbsp;</div>`,
        buttons: {
            import: {
                icon:  '<i class="fas fa-cloud-download-alt"></i>',
                label: "Import Character",
                callback: async (html) =>
                    await importCharacter(sheet, html.find("button").data("characterData"))
            }
        },
        render: html => {
            const button = html.find("button");
            const nameDisplay = html.find(".character-import-name")
            button.prop("disabled", true);

            let lastCode = "";
            html.find(".character-import-code").on("keyup change", async (e) => {
                const code = $(e.target).val();
                if (code === lastCode) return;
                lastCode = code;
                if (/[A-Z0-9]{6}/.test(code)) {
                    nameDisplay.text("Loading data...");
                    nameDisplay.removeClass("invalid-code");
                    try {
                        const characterData = await loadCharacter(code);
                        button.data("characterData", characterData);
                        button.prop("disabled", false);
                        nameDisplay.text(`Character to Import: ${characterData.name.stringValue}`);
                    } catch (e) {
                        nameDisplay.text(e);
                        nameDisplay.addClass("invalid-code");
                        button.prop("disabled", true);
                    }
                } else {
                    button.prop("disabled", true);
                    if (code.length > 0) {
                        nameDisplay.text("Invalid code");
                        nameDisplay.addClass("invalid-code");
                    } else {
                        nameDisplay.text("");
                    }
                }
            })
        }
    }).render(true);
}

Hooks.on('getActorSheetHeaderButtons', getActorSheetHeaderButtons)
