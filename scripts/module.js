import {loadCharacter} from "./firebase.js";

import {updateLifepath} from "./importers/lifepath.js";
import {updateStats} from "./importers/stats.js";
import {updateSkills} from "./importers/skills.js";

import {importItems, importItemsV2, loadItemDatabases} from "./importers/items.js";

const CHARACTER_TYPE_MAP = {
        0: 'Character',
        1: 'NPC',
}

let currentDialog;

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */
Hooks.once("ready", async () => {
        await loadItemDatabases();
});

Hooks.on("getActorSheetHeaderButtons", getActorSheetHeaderButtons);

/* -------------------------------------------- */
/*  Header Button                               */
/* -------------------------------------------- */

/**
 * @param {ActorSheet} sheet
 * @param {ApplicationHeaderButton[]} buttons
 */
function getActorSheetHeaderButtons(sheet, buttons) {
        if (!game.user.can("FILES_UPLOAD")) return;

        buttons.unshift({
                label: game.i18n.localize("CPRImporter.Dialog.ImportButton"),
                icon: "fa-solid fa-cloud-arrow-down",
                class: "aolkin-cyberpunkred-importer",
                onclick: () => startImport(sheet)
        });
}

/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */

function isV2Character(character) {
        return character.version === 2;
}

function getCharacterType(character) {
        if (isV2Character(character)) {
                return character.characterType;
        }

        return game.i18n.localize(CHARACTER_TYPE_MAP[character.character_type_id]);
}

function isQuickInsertAvailable() {
        return window.QuickInsert !== undefined;
}

function isUsingMookSheet(actor) {
        const currentSheetClass = actor?.flags?.core?.sheetClass ||
                game.settings.get("core", "sheetClasses")?.Actor?.[actor.type];

        return currentSheetClass === 'cyberpunk-red-core.CPRMookActorSheet';
}

/* -------------------------------------------- */
/*  Dialog                                      */
/* -------------------------------------------- */

function startImport(sheet) {
        currentDialog?.close();

        const dialog = new Dialog({
                title: game.i18n.localize(
                        "CPRImporter.Dialog.Title"
                ),
                // language=HTML
                content: `
                        <div class="character-import">
                                <label class="character-import-label">
                                        ${game.i18n.localize("CPRImporter.Dialog.Label")}
                                </label>
                                <input
                                        class="character-import-code"
                                        type="text"
                                        placeholder="${game.i18n.localize("CPRImporter.Dialog.Placeholder")}"
                                />

                                <div class="character-import-text">
                                        <div class="character-import-name"></div>
                                        <div class="character-import-message"></div>
                                </div>
                        </div>`,

                buttons: {
                        import: {
                                icon: '<i class="fa-solid fa-cloud-arrow-down"></i>',
                                label: game.i18n.localize("CPRImporter.Dialog.ImportButton"),

                                callback: async () => {
                                        if (!dialog.characterData) return;

                                        await importCharacter(
                                                dialog.characterData,
                                                sheet.actor
                                        );
                                }
                        }
                },

                default: "import",

                close: () => {
                        if (currentDialog === dialog) {
                                currentDialog = undefined;
                        }
                }
        });

        currentDialog = dialog;
        dialog.render(true);

        Hooks.once("renderDialog", (_dialog, html) => {
                if (_dialog !== dialog) return;
                const root = html[0];

                const input = root.querySelector(
                        ".character-import-code"
                );

                const nameDisplay = root.querySelector(
                        ".character-import-name"
                );

                const messageDisplay = root.querySelector(
                        ".character-import-message"
                );

                const importButton = root.querySelector(
                        "[data-button='import']"
                );

                importButton.disabled = true;
                let lastCode = "";

                input.addEventListener("input", async (event) => {
                        const code = event.target.value
                                .toUpperCase()
                                .trim();

                        event.target.value = code;

                        if (code === lastCode) return;
                        lastCode = code;

                        if (!/^[A-Z0-9]{6}$/.test(code)) {
                                importButton.disabled = true;

                                if (code.length > 0) {
                                        nameDisplay.textContent = game.i18n.localize("CPRImporter.Status.InvalidCode");
                                        nameDisplay.classList.add("invalid-code");
                                } else {
                                        nameDisplay.textContent = "";
                                }

                                messageDisplay.innerHTML = "";
                                return;
                        }

                        try {
                                nameDisplay.textContent = game.i18n.localize("CPRImporter.Status.Loading");

                                nameDisplay.classList.remove(
                                        "invalid-code"
                                );

                                const characterData = await loadCharacter(code);
                                dialog.characterData = characterData;
                                importButton.disabled = false;
                                const characterType = getCharacterType(characterData);
                                nameDisplay.textContent =
                                        game.i18n.format(
                                                "CPRImporter.Import.CharacterToImport",
                                                {
                                                        type: characterType,
                                                        name: characterData.name
                                                }
                                        );

                                const importMessages = [];

                                if (isV2Character(characterData) && !isQuickInsertAvailable()) {
                                        importMessages.push(
                                                game.i18n.localize("CPRImporter.Messages.QuickInsertRequired")
                                        );
                                }

                                if (isUsingMookSheet(sheet.actor)) {
                                        importMessages.push(
                                                game.i18n.localize("CPRImporter.Messages.MookSheetWarning")
                                        );
                                }

                                messageDisplay.innerHTML =
                                        importMessages.length > 0
                                                ? importMessages.join("<br>")
                                                : "";

                        } catch (error) {
                                console.error(error);

                                importButton.disabled = true;

                                nameDisplay.textContent =
                                        error.message ?? String(error);

                                nameDisplay.classList.add(
                                        "invalid-code"
                                );
                        }
                });
        });
}

/* -------------------------------------------- */
/*  Import */
/* -------------------------------------------- */

async function importCharacter(data, actor) {
        if (
                actor.type !== "character"
                && actor.type !== "mook"
        ) {
                throw new Error(
                        "Can only import to characters and mooks"
                );
        }

        console.info(
                "Importing character",
                data,
                "to actor",
                actor
        );

        const originalSheetClass =
                actor.getFlag("core", "sheetClass") ?? "";

        const mustReconfigureSheetClass =
                isUsingMookSheet(actor);

        if (mustReconfigureSheetClass) {
                console.warn(
                        `Temporarily configuring ${actor.name} `
                        + "to use the Player Character sheet during import."
                );

                await actor.setFlag(
                        "core",
                        "sheetClass",
                        "cyberpunk-red-core.CPRCharacterActorSheet"
                );
        }

        const forWhom =
                `${data.name} from ${data.code_to_character}`;

        const isV2 = isV2Character(data);

        try {
                await updateLifepath(data, actor);

                ui.notifications.info(
                        `Importing skills for ${forWhom}.`
                );

                await updateSkills(data, actor, isV2);

                if (isV2) {
                        if (isQuickInsertAvailable()) {
                                ui.notifications.info(
                                        `Importing items for ${forWhom}.`
                                );

                                if (!QuickInsert.hasIndex) {
                                        console.warn(
                                                "Quick Insert index must be built before importing."
                                        );

                                        await QuickInsert.forceIndex();
                                }

                                await importItemsV2(data, actor);

                        } else {
                                ui.notifications.warn(
                                        "Items such as gear and cyberware "
                                        + "were not imported. Install the "
                                        + "Quick Insert module to import them."
                                );
                        }

                } else {
                        ui.notifications.info(
                                `Importing items for ${forWhom}.`
                        );

                        await importItems(data, actor, isV2);
                }

                await updateStats(data, actor, isV2);

                if (isV2) {
                        if (isQuickInsertAvailable()) {
                                ui.notifications.info(
                                        `Done importing character ${forWhom}. `
                                        + "Cyberware must be manually installed."
                                );

                        } else {
                                ui.notifications.info(
                                        `Done importing character ${forWhom}. `
                                        + "Gear and cyberware were not imported."
                                );
                        }

                } else {
                        ui.notifications.info(
                                `Done importing character ${forWhom}. `
                                + "Max Humanity and Empathy may need "
                                + "to be manually corrected."
                        );
                }

        } catch (error) {
                const errorMessage =
                        `Failed to import ${forWhom}.`;

                ui.notifications.error(errorMessage);

                console.error(errorMessage, error);

        } finally {
                if (mustReconfigureSheetClass) {
                        await actor.setFlag(
                                "core",
                                "sheetClass",
                                originalSheetClass
                        );
                }
        }
}