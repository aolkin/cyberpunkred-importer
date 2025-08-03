v0.4.0
=========

- Add support for importing items such as gear, cyberware, weapons, etc.
  This support leverages the Quick Insert module to search for relevant
  items in the compendiums. While this does introduce an (optional)
  dependency, it also means that any kind of item can be imported,
  including from the DLC and other non-core content.
- Automatic cyberware installation is not handled for these new characters.
  It was always a bit glitchy, so I decided it wasn't worth updating. The
  cyberware will still be added to inventory, but must be installed manually.

v0.3.4
=========

- Started implementing support for the new data model from the app
  update. Skills, stats, and lifepath will be imported now, but all
  of the items such as gear, cyberware, weapons, ammo, and armor
  will not be imported yet.

v0.3.3
=========

- Fix a bug in v0.3.2 where Character sheets would be incorrectly
  recognized as Mook sheets when no override was present.

v0.3.2
=========

- Fix names of a couple items.
- Workaround issue with Mook importing by setting the actor to use the
  Character sheet during the import process and then restoring it at
  the end. Mook importing should hopefully work now!

v0.3.1
=========

- Fix typo preventing import of Grafted Muscle and Bone Lace
- Fix *some* bugs that were preventing successful Mook import. NPC importing
  should be considered in Beta at this time, as it has not been fully tested
  and may corrupt actors and existing data.

v0.3.0
==========

Compatibility with Foundry v11 and CPR System 0.88.2.

v0.2.3
==========

- Import Hats correctly
- Fix issues importing certain types of contacts
- Contact names will now be bolded in the lifepath
- Add error message if the overall import process fails
- A couple more info messages during the import process

v0.2.2
==========

- Attempt to fix bug causing crashes while importing some lifepaths

v0.2.1
==========

- Compatibility fixes for CPR System 0.87

v.0.2.0
==========

Initial "full" version  - supporting for most of the content on the web app:

- Skills and Stats
- Lifepath
- Clothing
- Gear
- Weapons
- Ammo
- Armor
- Cyberware (will prompt you to install it during the import process as well)

Notably, nothing related to roles is supported. There are also a variety of edge cases and a few individual items in some categories that may not be successfully imported.

v0.1.1
==========

- Import stats and skills
- Import lifepath
