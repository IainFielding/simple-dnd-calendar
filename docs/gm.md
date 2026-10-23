# GM Guide

Everything a GM sets up for Simple D&D Calendar, from turning the calendar on to the settings that dress it for your campaign.

The module replaces the look of D&D 5e's own calendar. The calendar's date, time, festivals and seasons are still D&D 5e's, set in D&D 5e's settings. Simple D&D Calendar adds the bar, the sky, the moons and the settings below.

## Getting started

### 1. Install and enable the module

Install the module as described in the [README](../README.md#installing), then turn on **Simple D&D Calendar** under **Manage Modules** in a D&D 5e world. It needs Foundry VTT 14 and D&D 5e 6.x.

### 2. Turn on D&D 5e's calendar

D&D 5e's calendar is off in a new world, and Simple D&D Calendar only shows once it's on.

The first time a GM loads the world with the module active, the module offers to turn it on. Choose **Turn It On**. If you choose **Not Now**, it won't ask again, but you can turn the calendar on yourself: in **Game Settings → Configure Settings**, open D&D 5e's **Configure Calendar** and tick **Enabled**.

> **Turning the calendar on changes how items recover.** With the calendar on, D&D 5e recovers items with daily, dawn and dusk uses as time passes, not on a long rest. To keep recovery on rests, set **Daily Recovery Mode** to **Manual Recovery** in the same window.

### 3. Pick your world's calendar

Also in **Configure Calendar**, choose the world's **Calendar**. The world reloads when you change it.

| Calendar | Setting | Festivals | Moons |
| --- | --- | --- | --- |
| Calendar of Harptos | Forgotten Realms | Midwinter, Greengrass, Midsummer, Shieldmeet, Highharvestide, the Feast of the Moon | Selûne, with the Tears of Selûne |
| Calendar of Greyhawk | Greyhawk (Oerth) | Needfest, Growfest, Richfest, Brewfest | Luna and Celene |
| Calendar of Khorvaire | Eberron | None | All twelve, Zarantyr to Vult |
| Gregorian | Earth | None | The Moon |
| Exandrian Calendar | Exandria (Tal'Dorei, Wildemount) | 21 holidays, from New Dawn to Winter's Crest | Catha and Ruidus |
| Solamnic Calendar | Krynn (Dragonlance) | None | Solinari, Lunitari and Nuitari |

The last two are the module's own. They're only in the list once you add them: see [Additional calendars](#additional-calendars).

[The Moons](moons.md) covers each calendar's moons in detail.

### 4. Set the date

Set the starting date with the calendar button on the bar (**Set Date**), or move the time on with the bar's buttons or `/advance`. See [Running time](#running-time).

## Settings

The module's settings are in **Game Settings → Configure Settings → Simple D&D Calendar**. Settings marked **World** are the GM's choice, for everyone. Settings marked **Player** are each player's own choice, for their own screen.

| Setting | Who | Default | What it does |
| --- | --- | --- | --- |
| **Animate Time Changes** | Player | On | Plays a change of time out on the calendar: the clock runs, the wheel turns and the moons move. Off, the calendar jumps straight to the new time. |
| **Calendar Style** | Player | Gilded Night | How the calendar looks: **Gilded Night** (gold on a night sky), **Parchment** (bronze and ink on parchment) or **Underdark** (steel on stone). |
| **Dress the Sky for the Season** | World | None | Trims the rim of the sky round the day wheel. **Follow the Seasons** changes with the year and dresses festival days for the festival. **Just Winter**, **Just Spring**, **Just Summer** or **Just Autumn** keeps to one season all year. |
| **Dress the Bar for Your Adventure** | World | None | Trims the bar for the adventure you're running, or the world it's set in. See [Adventure trims](#adventure-trims). |
| **Darken Scenes at Night** | World | Off | Keeps the active scene's darkness in step with the sky. See [Darkness](#darkness). |
| **Long Summer Days** | World | Off | Moves sunrise and sunset with the seasons: sixteen hours of daylight at midsummer and eight at midwinter. See [Long summer days](#long-summer-days). |
| **Announce Each Dawn** | World | Off | Posts each new day to the chat as the sun rises. See [Dawn announcements](#dawn-announcements). |
| **Additional Calendars** | World | None | A button that opens a list of the module's own calendars to add to D&D 5e's. See [Additional calendars](#additional-calendars). |

D&D 5e's own **Calendar Preferences**, which each user sets for themselves, still apply: **Display Calendar HUD** hides or shows the calendar, and **Date Format** and **Time Format** change how the date and time are written.

### Additional calendars

D&D 5e has calendars for the Forgotten Realms, Greyhawk, Eberron and Earth. The module adds more, for other settings. Click **Choose Calendars** under **Additional Calendars**, tick the ones you want, and **Save**. When the world reloads, they're choices in D&D 5e's **Configure Calendar**, alongside its own.

| Calendar | Setting | Source | Starts |
| --- | --- | --- | --- |
| Exandrian Calendar | Exandria: Tal'Dorei and Wildemount | *Tal'Dorei Campaign Setting Reborn*, *Explorer's Guide to Wildemount* | 836 PD |
| Solamnic Calendar | Krynn | *Dragonlance: Shadow of the Dragon Queen* | 351 AC |

- **Exandria**: eleven months of 27 to 32 days, 328 days in all, and seven-day weeks from Miresen to Da'leysen. Its 21 holidays fall on ordinary days, so the date is still shown, and the holiday is marked beside the sky. The seasons start on the holidays that mark them: the Renewal Festival, Zenith, Harvest's Close and Barren Eve. Where the two books differ, the module follows *Tal'Dorei Campaign Setting Reborn*, the newer.
- **Krynn**: twelve months of four seven-day weeks, from Newkolt to Frostkolt, with the seasons by month as in our own year.

The world's own calendar can't be unticked, as the world would lose it. Pick another calendar in **Configure Calendar** first.

### Adventure trims

Every D&D adventure and campaign setting Wizards of the Coast has published for fifth edition has a trim for the bar, from *Lost Mine of Phandelver* to *Arcana Unleashed*, and there's one for World of Warcraft: 49 in all, listed in **Dress the Bar for Your Adventure** by name. Where a setting and its adventures share a world, they share a trim, and **Also for** says which books it covers.

| Trim | Also for | What it adds to the bar |
| --- | --- | --- |
| Acquisitions Incorporated | | A brass chain in swags, hung with gold coins and contracts under red wax seals |
| Arcana Unleashed | | A ley line, glowing runes, turning arcane circles, and sparkles |
| Arcana Unleashed: Deadfall | | Thay's crimson silk, hung with gold tassels, daggers, and red sigils |
| Astarion's Book of Hungers | | Crimson silk in swags, dark roses at its pins, and blood dripping from it |
| Bigby Presents: Glory of the Giants | | Stone tablets carved with giant runes, glowing frost and fire |
| The Book of Many Things | | The Deck's cards on a purple cord, each with its mark, and stars between |
| Candlekeep Mysteries | | A shelf of books in a row, with candles among them |
| Curse of Strahd and Ravenloft | *Van Richten's Guide to Ravenloft*, *Ravenloft: The Horrors Within* | A dead, thorny vine, cobwebs in the corners, a spider, bats, and drifting mist |
| Descent into Avernus | | A hellish glow, iron spikes, hanging chains, and rising embers |
| Dragon Delves | | A dragon's hoard of coins over the edge, gems of every dragon's colour, and claws gripping it |
| Dragon of Icespire Peak | | Snow-capped peaks, the white dragon wheeling, and falling snow |
| Dragonlance | *Shadow of the Dragon Queen* | Krynn's three moons, white, red and black, and silver lances between them |
| Dragons of Stormwreck Isle | | A wreck's broken timbers, the sea beneath, and lightning |
| Dungeon of the Mad Mage | | Undermountain's brick, Halaster's turning rune gates, and arcane motes |
| Eberron | *Rising from the Last War*, *Forge of the Artificer*, *Forgotten Relics* | The lightning rail, and dragonshards of Siberys, Eberron and Khyber |
| Exandria | *Explorer's Guide to Wildemount*, *Call of the Netherdeep*, *Tal'Dorei Campaign Setting Reborn* | Catha and Ruidus strung on silver, and the swirling sigils and motes of dunamis |
| Forgotten Realms | *Sword Coast Adventurer's Guide*, *Heroes of Faerûn*, *Adventures in Faerûn* | The Weave as a blue ribbon, Mystra's seven-pointed stars, and Selûne's crescents |
| Ghosts of Saltmarsh | | Waves, a fishing net in swags, and shells caught in it |
| Greyhawk | The 2024 *Dungeon Master's Guide* | Castle battlements, with lanterns lit beneath the merlons |
| Heroes of the Borderlands | | The Keep's palisade of sharpened stakes, with round shields hung on it |
| Hoard of the Dragon Queen | | The Cult of the Dragon's purple in swags, with dragon eggs and spilled coins |
| Hold Back the Dead | | A grave's mist, and the dead's hands reaching out of it |
| Journeys through the Radiant Citadel | | Concord jewels of every colour on a gold chain, shining |
| Keys from the Golden Vault | | A gold chain hung with keys, gold bars and coins |
| Locathah Rising | | Kelp, coral, and rising bubbles |
| Lorwyn-Shadowmoor | *Lorwyn: First Light* | Lorwyn's sunlit flowers along one half, giving way to Shadowmoor's thorns and gloom |
| The Lost Laboratory of Kwalish | | Copper pipes, turning gears, and glowing vials |
| Lost Mine of Phandelver | | A mine's rails, pickaxes and lanterns, and Wave Echo Cave's green glow |
| Netheril | *Netheril's Fall* | Floating enclaves crowned with towers, and the gold rings of their mythallars |
| Out of the Abyss | | Stalactites, glowing fungus, and the violet motes of faerzress |
| Phandelver and Below: The Shattered Obelisk | | Dark shards of the obelisk, aberrant tentacles, and a sickly glow |
| Planescape | *Sigil and the Outlands*, *Morte's Planar Parade*, *Turn of Fortune's Wheel* | Razorvine with leaves like blades, and glowing portals |
| Princes of the Apocalypse | | The four elements in turn: air, earth, fire and water |
| Quests from the Infinite Staircase | | A stair climbing along the edge, and doors to other worlds |
| Ravnica | *Guildmasters' Guide to Ravnica* | Stained glass in the ten guilds' colours, and city spires |
| Rime of the Frostmaiden | | A thick crust of snow, long icicles, and falling snow |
| The Rise of Tiamat | | Scales in the five colours of the Dragon Queen's heads, and claws hooked over the edge |
| Scions of Elemental Evil | | The Temple's cracked stone, and the alchemists' signs of the four elements, burning |
| Spelljammer | *Astral Adventurer's Guide*, *Boo's Astral Menagerie*, *Light of Xaryxis* | Wildspace, with orbits, planets ringed and plain, and the stars |
| Storm King's Thunder | | Storm clouds, lightning, and driving rain |
| Strixhaven | *Strixhaven: A Curriculum of Chaos* | The five colleges' pennants on a gold cord |
| Tales from the Yawning Portal | | The tavern's beams, hung with tankards and lanterns |
| Theros | *Mythic Odysseys of Theros*, *Theros: No Silent Secret* | A gold meander, laurel leaves, and the stars of Nyx |
| Tomb of Annihilation | *The Tortle Package* | Jungle leaves and lianas, bright flowers, and skulls |
| Uni and the Hunt for the Lost Horn | | A rainbow, flowers, hearts and sparkles |
| Vecna: Eve of Ruin | | A gloom, necrotic tendrils, and the Eye, watching |
| Waterdeep: Dragon Heist | | A velvet swag hung with the Masked Lords' masks, and gold dragons |
| The Wild Beyond the Witchlight | | Curling ribbons, toadstools, sparkles, and fireflies |
| World of Warcraft | | Riveted bronze plates set with gems, with claws between them |

The adventure trim and the sky's seasonal trim can be used together.

## Running time

Only the GM can move the time. Players see the calendar follow along.

### The bar

| Button | Who sees it | What it does |
| --- | --- | --- |
| ⏪ Rewind | GM | Moves the time back an hour. Hover for a drop-down of other amounts: 7 days, 1 day, 8 hours, 1 hour, 10 minutes or 1 minute. |
| 📅 Set Date | GM | Opens D&D 5e's dialog to set the date and time. |
| 👤 Character Sheet | Players with a character | Opens your character's sheet. |
| ⏩ Advance | GM | Moves the time on an hour, with the same drop-down as Rewind. |
| 👥 Party Sheet | Anyone who can see the party | Opens the party's sheet. |
| ⌃ Collapse | Everyone | Folds the calendar up to the bar alone, or opens it again. Each user's choice is kept. |

Buttons other modules add to D&D 5e's calendar appear on the bar too.

### Chat commands

| Command | Who | What it does |
| --- | --- | --- |
| `/date` | Everyone | Whispers you the date, the time, the season, any festival, and each moon's phase and when it's next full. |
| `/advance 8 hours` | GM | Moves the time on. Amounts can be combined and shortened: `/advance 1 day 6 hours`, `/advance 1d 6h`, `/advance 90 minutes`, `/advance 2w`. A number on its own is hours, and `/advance` on its own is an hour. |
| `/advance dawn` | GM | Moves on to the next dawn, noon, dusk or midnight (`sunrise` and `sunset` work too). |
| `/rewind 90 minutes` | GM | Moves the time back by an amount, or to the last dawn, noon, dusk or midnight. |

Units can be written as seconds (`s`, `sec`), minutes (`m`, `min`), hours (`h`, `hr`), days (`d`) or weeks (`w`, `wk`).

## Darkness

With **Darken Scenes at Night** on, the active scene's darkness follows the sun:

- **Full daylight** until the late afternoon.
- **Fading** through the late afternoon, sunset and twilight, by the height of the sun.
- **Night** once twilight has passed, lightened a little by a bright moon high in the sky.
- **The same in reverse** before dawn.

Things to know:

- **Only the active scene** is changed. Switching scenes brings the new one into step.
- **Scenes with their darkness locked are left alone.** Tick **Darkness Level Lock** in a scene's configuration to keep its darkness as you set it, such as a dungeon that's always dark or a fey glade that's always bright.
- **A GM must be logged in.** The active GM's client updates the scene, so time moved while no GM is connected catches up when one joins.
- Small steps, such as a combat round's six seconds, don't update the scene. The darkness moves once the change is large enough to see.

## Long summer days

With **Long Summer Days** on, sunrise and sunset move with the seasons, from sixteen hours of daylight at midsummer to eight at midwinter. Everything that asks the calendar for sunrise and sunset follows:

- **The day wheel:** the day half grows and shrinks.
- **The scene's darkness.**
- **D&D 5e's dawn and dusk recovery**, and its approximate times of day.
- **The dawn announcements**, and `/advance dawn` and `/advance dusk`.

Off, the sun rises and sets at the calendar's usual hours all year.

## Dawn announcements

With **Announce Each Dawn** on, each new day is posted to the chat as the sun rises, by **The Calendar**:

- The date and the day of the week.
- The first day of a season, when it is one.
- Any festival.
- Any moons full or new that day.

A jump over several days posts only the last dawn, not one for every day passed. As with darkness, a GM must be logged in for the post to be made.

## Troubleshooting

**The calendar doesn't show.**
- Check D&D 5e's calendar is **Enabled** in **Configure Calendar**.
- A player may have turned off **Display Calendar HUD** in their own **Calendar Preferences**.
- Another module that replaces D&D 5e's calendar can stop this one showing. D&D 5e says "The default calendar interface isn't available" when that happens.

**There are no moons, or no festivals.**
- Moons and festivals depend on the world's **Calendar**. Khorvaire, Gregorian and Krynn have no festivals, and a calendar other than D&D 5e's four and the module's own has no moons until a module adds some. See [The Moons](moons.md#changing-the-moons).

**The scene doesn't darken.**
- Check **Darken Scenes at Night** is on, the scene is the active one, and its darkness isn't locked.
- A GM must be logged in.

**Items recover on the wrong schedule.**
- D&D 5e ties item recovery to the calendar being on. Set **Daily Recovery Mode** in **Configure Calendar**: **Calendar Recovery** for time passing, **Manual Recovery** for the rest dialog.

## For module and world-script authors

The moons of any calendar can be changed, or added for a homebrew calendar, with the `sogrom-simple-dnd-calendar.moons` hook. See [Changing the moons](moons.md#changing-the-moons).
