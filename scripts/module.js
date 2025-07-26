import { loadCharacter } from "./firebase.js";
import { updateLifepath } from "./importers/lifepath.js"
import { updateStats } from "./importers/stats.js"
import { updateSkills } from "./importers/skills.js"
import { importItems, loadItemDatabases } from "./importers/items.js"

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

Hooks.once('ready', async function() {
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

let currentDialog;

function startImport(sheet) {
    if (currentDialog !== undefined) {
        currentDialog.close();
    }
    const newDialog = new Dialog({
        title: 'Import Character from cyberpunkred.com',
        content: `Enter Character Export Code:
    <input class="character-import-code"><br>
    <div class="character-import-text">
      <div class="character-import-name">&nbsp;</div>
      <div class="character-import-message">&nbsp;</div>
    </div>`,
        buttons: {
            import: {
                icon:  '<i class="fas fa-cloud-download-alt"></i>',
                label: 'Import Character',
                callback: async (html) => {
                    const data = html.find('button').data('characterData')
                    if (!data) return;
                    await importCharacter(data, sheet.object)
                }
            }
        },
        close: html => {
          if (currentDialog === newDialog) {
              currentDialog = undefined;
          }
        },
        render: html => {
            const button = html.find('button');
            const nameDisplay = html.find('.character-import-name')
            button.prop('disabled', true);

            let lastCode = '';
            html.find('.character-import-code').on('keyup change', async (e) => {
                const code = $(e.target).val();
                if (code === lastCode) return;
                lastCode = code;
                if (/[A-Z0-9]{6}/.test(code)) {
                    nameDisplay.text('Loading data...');
                    nameDisplay.removeClass('invalid-code');
                    try {
                        const characterData = await loadCharacter(code);
                        button.data('characterData', characterData);
                        button.prop('disabled', false);
                        const characterType = getCharacterType(characterData);
                        nameDisplay.text(`${characterType} to Import: ${characterData.name}`);

                        const importMessages = [];
                        if (isV2Character(characterData)) {
                            importMessages.push('This character was exported from the updated app.' +
                                ' This update uses a new data model for which support is still in' +
                                ' development. Importing items such as clothing,' +
                                ' weapons, cyberware, etc, is not yet supported.');
                        }
                        if (isUsingMookSheet(sheet.object)) {
                            importMessages.push(
                                'This actor is currently using the Mook sheet. In order to import' +
                                ' successfully, this actor will be temporarily set to use the player' +
                                ' character sheet during the import process then restored at the end.');
                        }
                        html.find('.character-import-message').html(
                            importMessages.length > 0 ? importMessages.join('<br>') : '&nbsp;');
                    } catch (e) {
                        console.error(e);
                        nameDisplay.text(e);
                        nameDisplay.addClass('invalid-code');
                        button.prop('disabled', true);
                    }
                } else {
                    button.prop('disabled', true);
                    if (code.length > 0) {
                        nameDisplay.text('Invalid code');
                        nameDisplay.addClass('invalid-code');
                    } else {
                        nameDisplay.text('');
                    }
                }
            })
        }
    });
    currentDialog = newDialog;
    newDialog.render(true);
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
        await actor.update({ flags: { core: { sheetClass: 'cyberpunk-red-core.CPRCharacterActorSheet' } } });
    }

    const forWhom = `${data.name} from ${data.code_to_character}`;
    const isV2 = isV2Character(data);

    try {
        await updateLifepath(data, actor);
        ui.notifications.info(`Importing skills for ${forWhom}.`);
        await updateSkills(data, actor, isV2);
        if (isV2) {
            ui.notifications.warn("Clothing, gear, cyberware, etc imports not yet supported from new characters.")
        } else {
            ui.notifications.info(`Importing items for ${forWhom}.`);
            await importItems(data, actor, isV2);
        }
        // Do this last to overwrite humanity and empathy lost during cyberware installs
        await updateStats(data, actor, isV2);
    } catch (e) {
        const errorMessage = `Failed to import ${forWhom}.`;
        ui.notifications.error(errorMessage);
        console.error(errorMessage, e);
    }

    if (mustReconfigureSheetClass) {
        await actor.update({ flags: { core: { sheetClass: originalSheetClass } } });
    }

    ui.notifications.info(`Done importing character ${forWhom}. Max Humanity and Empathy may need
     to be manually corrected.`);
}
