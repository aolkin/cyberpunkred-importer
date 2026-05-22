import {loadCharacter} from "./firebase.js";
import {updateLifepath} from "./importers/lifepath.js"
import {updateStats} from "./importers/stats.js"
import {updateSkills} from "./importers/skills.js"
import {importItems, importItemsV2, loadItemDatabases} from "./importers/items.js"

// Hooks.once('init', async function() {
// });

const CHARACTER_TYPE_MAP = {
        0: 'Character',
        1: 'NPC',
}

function isV2Character(character) {
        return character.version === 2
}

function getCharacterType(character) {
        if (isV2Character(character)) {
                return character.characterType;
        }
        return CHARACTER_TYPE_MAP[character.character_type_id];
}

Hooks.once('ready', async function () {
        await loadItemDatabases();
});

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

function isUsingMookSheet(actor) {
        const currentSheetClass = actor?.flags?.core?.sheetClass ||
                game.settings.get("core", "sheetClasses")?.Actor?.[actor.type];
        return currentSheetClass === 'cyberpunk-red-core.CPRMookActorSheet';
}

function isQuickInsertAvailable() {
        return window.QuickInsert !== undefined;
}

let currentImporter;

class CharacterImporter extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
        constructor(options = {}) {
                super(options);
                this.actor = options.actor;
                this.characterData = null;
        }

        static DEFAULT_OPTIONS = {
                tag: "form",
                window: {
                        title: "Import Character from cyberpunkred.com",
                        icon: "fas fa-cloud-download-alt",
                        resizable: true
                },
                position: {
                        width: 450,
                        height: "auto"
                },
                forms: {
                        submitOnChange: false,
                        closeOnSubmit: true,
                        handler: CharacterImporter.#onSubmit
                }
        }

        static PARTS = {
                form: {
                        template: "modules/cyberpunkred-importer/templates/importer.hbs"
                }
        }

        async _prepareContext(options) {
                return {
                        actor: this.actor
                };
        }

        static async #onSubmit(event, form, formData) {
                const application = this;
                if (!application.characterData) return;
                const submitBtn = form.querySelector('button[name="import"]');
                submitBtn.disabled = true;
                submitBtn.textContent = "Importing...";
                try {
                        await importCharacter(application.characterData, application.actor);
                } catch (err) {
                        console.error(err);
                        ui.notifications.error("Import failed: " + err.message);
                        throw err;
                }
        }

        _onRender(context, options) {
                const html = this.element;
                const input = html.querySelector(".character-import-code");
                const nameDisplay = html.querySelector(".character-import-name");
                const messageDisplay = html.querySelector(".character-import-message");
                const submitBtn = html.querySelector('button[name="import"]');

                let lastCode = '';
                input.addEventListener("input", async (e) => {
                        const code = e.target.value.toUpperCase();
                        if (code === lastCode) return;
                        lastCode = code;

                        if (/[A-Z0-9]{6}/.test(code)) {
                                nameDisplay.textContent = 'Loading data...';
                                nameDisplay.classList.remove('invalid-code');
                                nameDisplay.style.color = "";
                                submitBtn.disabled = true;
                                try {
                                        this.characterData = await loadCharacter(code);
                                        submitBtn.disabled = false;
                                        const characterType = getCharacterType(this.characterData);
                                        nameDisplay.textContent = `${characterType} to Import: ${this.characterData.name}`;

                                        const importMessages = [];
                                        if (isV2Character(this.characterData) && !isQuickInsertAvailable()) {
                                                importMessages.push('This character was exported from the updated app.' +
                                                        ' Importing items such as gear, cyberware, weapons, etc, requires the' +
                                                        ' Quick Insert module to be installed and enabled.');
                                        }
                                        if (isUsingMookSheet(this.actor)) {
                                                importMessages.push(
                                                        'This actor is currently using the Mook sheet. In order to import' +
                                                        ' successfully, this actor will be temporarily set to use the player' +
                                                        ' character sheet during the import process then restored at the end.');
                                        }
                                        messageDisplay.innerHTML = importMessages.length > 0 ? importMessages.join('<br>') : '&nbsp;';
                                } catch (err) {
                                        console.error(err);
                                        nameDisplay.textContent = err.message || err;
                                        nameDisplay.classList.add('invalid-code');
                                        nameDisplay.style.color = "var(--color-error)";
                                        submitBtn.disabled = true;
                                }
                        } else {
                                submitBtn.disabled = true;
                                if (code.length > 0) {
                                        nameDisplay.textContent = 'Invalid code';
                                        nameDisplay.classList.add('invalid-code');
                                        nameDisplay.style.color = "var(--color-error)";
                                } else {
                                        nameDisplay.textContent = '';
                                        nameDisplay.classList.remove('invalid-code');
                                        nameDisplay.style.color = "";
                                }
                                messageDisplay.innerHTML = '&nbsp;';
                        }
                });
        }

        _onClose() {
                if (currentImporter === this) {
                        currentImporter = undefined;
                }
        }
}

function startImport(sheet) {
        if (currentImporter) {
                currentImporter.close();
        }
        currentImporter = new CharacterImporter({actor: sheet.object});
        currentImporter.render(true);
}

async function importCharacter(data, actor) {
        if (actor.type !== 'character' && actor.type !== 'mook') {
                throw new Error('Can only import to characters and mooks');
        }
        console.info('Importing character', data, 'to actor', actor);

        const originalSheetClass = actor?.flags?.core?.sheetClass ?? '';
        const mustReconfigureSheetClass = isUsingMookSheet(actor);
        if (mustReconfigureSheetClass) {
                console.warn(`Temporarily configuring ${actor} to use the Player Character sheet during import.`);
                await actor.update({flags: {core: {sheetClass: 'cyberpunk-red-core.CPRCharacterActorSheet'}}});
        }

        const forWhom = `${data.name} from ${data.code_to_character}`;
        const isV2 = isV2Character(data);

        try {
                await updateLifepath(data, actor);
                ui.notifications.info(`Importing skills for ${forWhom}.`);
                await updateSkills(data, actor, isV2);
                if (isV2) {
                        if (isQuickInsertAvailable()) {
                                ui.notifications.info(`Importing items for ${forWhom}.`);
                                if (!QuickInsert.hasIndex) {
                                        console.warn("Quick Insert index must be built before importing.");
                                        await QuickInsert.forceIndex();
                                }
                                await importItemsV2(data, actor);
                        } else {
                                ui.notifications.warn("Items such as gear and cyberware were not imported." +
                                        " Install the Quick Insert module to import them.");
                        }
                } else {
                        ui.notifications.info(`Importing items for ${forWhom}.`);
                        await importItems(data, actor, isV2);
                }
                // Do this last to overwrite humanity and empathy lost during cyberware installs
                await updateStats(data, actor, isV2);

                if (isV2) {
                        if (isQuickInsertAvailable()) {
                                ui.notifications.info(`Done importing character ${forWhom}. Cyberware must be manually installed.`);
                        } else {
                                ui.notifications.info(`Done importing character ${forWhom}. Gear and cyberware were not imported.`);
                        }
                } else {
                        ui.notifications.info(`Done importing character ${forWhom}. `
                                + 'Max Humanity and Empathy may need to be manually corrected.');
                }
        } catch (e) {
                const errorMessage = `Failed to import ${forWhom}.`;
                ui.notifications.error(errorMessage);
                console.error(errorMessage, e);
        } finally {
                if (mustReconfigureSheetClass) {
                        await actor.update({flags: {core: {sheetClass: originalSheetClass}}});
                }
        }
}