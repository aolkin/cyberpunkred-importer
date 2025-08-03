![](https://img.shields.io/badge/Foundry-v11-informational)
<!--- Downloads @ Latest Badge -->
![Latest Release Download Count](https://img.shields.io/github/downloads/aolkin/cyberpunkred-importer/latest/module.zip)
<!--- Forge Bazaar Install % Badge -->
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fcyberpunkred-importer&colorB=4aa94a)

# Cyberpunk RED Importer

This module is designed to import character data from cyberpunkred.com (and the
associated mobile apps). It is most useful if you want to let your players
create their characters using the wizards in that app, and then import them
into Foundry. However, it has a number of rough edges, so expect to have to
make a few manual corrections or additions after importing.

To use it, hit the "Import" button on the header of a character sheet and
paste in the six digit code received from the "Export" functionality on
cyberpunkred.com.

Capabilities:
- Import stats
- Import skill levels
- Import lifepath
- Import items such as clothing, gear, cyberware, vehicles, weapons, armor, and ammo
- Import NPCs to Mook Actors. This should be considered mostly functional now,
  but note that the importer will override the Mook sheet class to the player
  Character sheet class during the import, then restore it afterwards, to
  workaround a limitation in the CPR system implementation.

In order to find items to import from the compendiums, this module now has a recommended
dependency on the [Quick Insert module](https://foundryvtt.com/packages/quick-insert).
The importer will still function without this dependency, but it will not attempt to
import any items.

With the Quick Insert module enabled, the importer will attempt to find items silently,
and will pop up the Quick Insert menu if a precise match cannot be found, allowing you
to search for and select an item manually or choose to skip it.

Issues:
- No custom skills or items will be imported at this time.
- Lifepath importing involves a lot of string parsing, so it relies on not
  having modified the structure of the lifepath text box on cyberpunkred.com.
- cyberpunkred.com does not track max humanity and empathy, so you will likely
  need to manually correct both values after import.

If you encounter an issue not mentioned here, please feel free to log a Github
issue against this project.

## Install

Find this in the Foundry module browser or paste
https://github.com/aolkin/cyberpunkred-importer/releases/latest/download/module.json
into the "Install Module" dialog to get started.

## Changelog

See CHANGELOG.MD
