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

function startImport(sheet) {
    new Dialog({
        title: 'Import Character from cyberpunkred.com',
        content: `Enter Character Export Code:
    <input class="character-import-code"><br>
    <div class="character-import-name">&nbsp;</div>`,
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
                        const characterType = CHARACTER_TYPE_MAP[characterData.character_type_id];
                        nameDisplay.text(`${characterType} to Import: ${characterData.name}`);
                    } catch (e) {
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
    }).render(true);
}

async function importCharacter(data, actor) {
    if (actor.type !== 'character' && actor.type !== 'mook') {
        throw new Error('Can only import to characters and mooks');
    }
    console.info('Importing character', data, 'to actor', actor);

    const forWhom = `${data.name} from ${data.code_to_character}`;

    try {
        await updateLifepath(data, actor);
        ui.notifications.info(`Importing skills for ${forWhom}.`);
        await updateSkills(data, actor);
        ui.notifications.info(`Importing items for ${forWhom}.`);
        await importItems(data, actor);
        // Do this last to overwrite humanity and empathy lost during cyberware installs
        await updateStats(data, actor);
    } catch (e) {
        const errorMessage = `Failed to import ${forWhom}.`;
        ui.notifications.error(errorMessage);
        console.error(errorMessage, e);
    }

    ui.notifications.info(`Done importing character ${forWhom}. Max Humanity and Empathy may need
     to be manually corrected.`);
}
