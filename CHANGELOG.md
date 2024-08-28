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
