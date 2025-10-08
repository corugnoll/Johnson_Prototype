This document describes the design for generating runners in Johnson.

# High Level Overview

- The game can generate a set of runners based on generation rules  
- There is an extra “Runner Index” window where generated and previously hired runners are displayed and players can hire them  
- The “Runner Configuration” Portion of the HUD gets replaced by a “Runners” section that displays the currently hired runners and their stat totals and allows players to unhire them  
- The contract resolution gets a general upgrade, now correctly containing contract rewards and also a step during which impact on hired runners is calculated and applied (they level up, take damage etc)  
- A new “Player Level” stat is added to the player’s stat and displayed.   
- The Runner Type and stats still work the same in regards to gates and node-evaluations. Nothing changes on this front.  
- Creating a setup for a “Balancing” csv that contains certain numbers so i can adjust them down the line. 

## Runner Generation and Setup

Runners have the following variables:

- Runner Name: Generated from the name tables  
- Runner Level: int that is the basis for scaling other stats and increases when runners are used in contracts  
- RunnerType: The already existing runner types (Hacker,Face,Ninja,Muscle)  
- RunnerStats: The 4 already existing runner stats (HackerStat,Facestat,Ninjastat,Musclestat)  
- RunnerState: Can be Injured, Ready, Dead  
- HiringState: Can be Hired or Unhired


### Runner Name

The Runner Name is generated from runner\_name\_table.csv  
The game randomly picks one “First Part” (first name) and one “Second Part” (surname) from the table to generate this name. 

### Runner Level

Basis for scaling the RunnerStats and Hiring cost.  
For now runners are only generated on level 1\. This will change in the future, when we implement scaling.

### Runner Type

The already existing types of Hacker, Face, Ninja, Muscle. Each Runner has one of these types. The type should be randomly chosen on generation and then impacts the distribution of RunnerStats and the chance for how Runners improve their stats when leveling up.

### Runner Stats

The already existing Runner Stats of Muscle Stat, Face Stat, Hacker Stat and Ninja Stat.  
Note that this feature has a difference between MVP implementation and later stages  
When a runner levels up they gain a total of 4 points (should be adjustable in balancing csv) that are distributed as follows: 

- 2  (should be adjustable in balancing csv) of those points are always allocated to their main stat (for a Hacker this would be Hacker Stat etc.)  
- The remaining 2  (should be adjustable in balancing csv) are randomly distributed amongst all 4 stats (this includes the main stat, so technically its possible for a level up to give \+4 main stat, even though thats rare)

When a Runner is generated, all of their level ups should be calculated. For example:  
If a level 1 Runner is generated they perform adding of stats once for their Level 1 (meaning they have a total of 4 Stat points).  
If a level 5 Runner is generated, they perform this 5 times (meaning they have a total of 20 Stat points).  
For now the game can only generate Level 1 Runners, but this might change in the future.  
Important: For the initial implementation runners that level up during gameplay on contract completion do NOT gain stat increases. I have only described here how this works so we can easily “unlock” that feature once i decide to add it to the game. In this MVP implementation runners should always stay at lvl 1 with their according stats.

### Runner State

Runners always start out in the “Ready” state.

- Ready Runners can be hired

If during contract resolution certain conditions take place (described in the appropriate section) a “Ready” runner can be moved to “Injured”.

- Injured Runners can be hired

If during contract resolution certain conditions take place (described in the appropriate section) an “Injured” runner can be moved to “Dead”

- Dead Runners cannot be hired anymore

There should be a visual representation of the Runner State in addition to a textfield describing the state. Maybe a small icon or using specific colors to show if they are Ready, Injured or Dead.

## Hiring State

A simple variable that tracks if a runner is hired or not. Determines whether they can be hired or not.  
If the player hires a runner, this gets set to “Hired” until the contract they are in is resolved. After a contract completes, all hired runners in it get set ti unhired.  
If the player “unhires” the runner via the button in the runners screen this gets set to “Unhired” again.

## Runner Index

The Runner Index is an extra window that can be accessed from the main playing area via a button.  
It has 2 tabs:

1) Generated Runners: Displays all runners from the currently generated batch. It should be easy to adjust the number of a batch during development, so the window should get the ability to potentially scroll and contain more elements. For now we start with 5  (should be adjustable in balancing csv).  
2) Previously Hired: Displays all runners the player has previously hired during this playsession, even if they are dead. Should be sorted by “last hired” at the top.

It should have a grid-like structure where each grid-slot is obtained by one runner. The player can see all of the Runner Variables in a compact way.  
It also has a “Close” button that closes the window again.  
The window should be positioned in a way that the “Runners” section is still visible.

### Hire Button

In this window, each Runner has a “Hire” button that counts for them that also displays the hiring-cost and if the runner can be hired or not. (Should they be Dead that button is greyed out).  
The button is displayed normally if a player could hire the runner. The conditions to check here are:

- Player has enough “Money” (player stats money) to hire the Runner for its cost  
- Player has free Runner slots for this contract  
- Runner is not dead

The button is displayed in an uninteractive state if either of the conditions above is not met. There should be a clear indication (maybe text close to the button) that tells players WHY they cannot hire the runner.

### Hiring a Runner

When a player clears the conditions to hire a runner and clicks on the button they hire the runner. This also disables the button and changes their visuals into a “Hired” vis that makes it clear the runner is hired.  
The Runner then is added into an empty runner slot.  
This changes their “HireState” to hired.  
The Hiring Cost to start should be 150 Money (should be adjustable in balancing csv).

### Generate Runners Button

In the “generated runners” tab there should be a button called “Generate Runners”, which triggers a new set of runners to be generated and the current ones are removed from the display and game. They do not need to be saved, only the ones previously hired (and thus in the “Previously Hired” Tab) need to be saved for the duration of the playsession (not into the next session\!).

## Runners Section

The “Runner Configuration” section gets replaced with a new “Runners” section.  
This section has the following elements:

- Displays the 3 Runner Slots for the contract  
- For each Slot displays the information about the runner that is in the slot, or has an “empty” state if no runner is assigned to it yet  
- For each runner there is an “Unhire” button next to them. If the player presses it, the runner gets removed from the slot, their state is set to “Unhired” and the Money used to hire them is returned to the player. The runner can then be re-hired in the usual ways.  
- There is a small “Stat summary” section below the runner slots that shows the total of all of the runner-stats with the currently hired runners  
- There is a button in it that can toggle the “Runner Index” to open or close.

This means that players don’t have the chance to adjust runner types or stats anymore. This is all handled during runner generation and leveling now and the choice players make about which runners to hire replaces this step completely.

## Validation Implications

Currently there is a check if a run can be completed vai the “Validate configuration” button.  
This feature can be removed completely. Players can at any time execute a run. Since this is a playtest i am sitting next to them and can prevent them from performing legal actions. So there is no need to check if all runners are assigned etc anymore.

## Contract Resolution

When a contract gets resolved, the following things happen in order now and should be displayed in the final summary window that already exists:

- Evaluate Damage and Risk: The unprevented damage and risk of the contract are evaluated (see details below).  
- Runner Level Up: All runners that aren’t dead level up. Note that during this MvP this means their stats DONT increase. Later on their Runner Stats will increasein this step.  
- Evaluate Rewards: The run’s Money rewards are added to the player’s stats (as already is the case). Please add that each Contract has a base reward of X that can then of course be modified by nodes.  
- The player’s level (a new stat you should implement that is displayed prominently next to the other player stats) is increased by 1 (should be adjustable in balancing csv).

### Damage and Risk Evaluation

Here is how the Damage and Risk evaluation works:

- For every unprevented point of Damage a random number is chosen and an outcome is chosen from the according damage table (damage\_table.csv).  
- The random number can be rolled between 1 and the maximum in the damage\_table.csv (currently 100, but this can change and should alway take the current version of the CSV into account)  
- Every unprevented risk is still applied to the player-risk as before.

Currently the following damage effects exist. It should be possible to add new ones here easily later on.

| Name | Syntax in CSV | Effect |
| :---- | :---- | :---- |
| Add Injury | Injury | Randomly injure an uninjured Runner. If all runners are injured, randomly kill one of them (set their state to dead) If all runners are dead, nothing happens |
| Kill Runner | Death | Set one already injured runner to Dead. If no runners are injured, randomly pick a non-dead runner and set them to injured If all runners are dead, nothing happens |
| Reduce Rewards | Reduce X | Reduces the contracts rewards by X%.  |
| Extra Rewards | Extra X | Increases the contracts reward by X%. |

### Information Display Update

- The runners that were hired for the run and some info about them should be displayed in this window. The info to be displayed is:  
  - Runner Level (+ the change of the runner gaining \+1 level)  
  - Runner State: Are they dead, injured or ready. This   
- The current reward for the run is displayed prominently.  
- The amount of risk that will be added to the player (aka unprevented risk) is displayed  
- There is a section that contains the damage rolls that can obviously change in size depending on the amount of damage rolls triggered in this contract

The damage and risk step should be presented the following way:

- The game does the rolls for damage one by one and adds each roll’s information. Should the roll change anything (rewards or runner states) that display is also updated.  
- These rolls should be displayed one after the other with a slight delay (maybe 0,2 seconds, should be changeable) in between to create some tension during resolution.  
- Effect of the rolls is displayed to the player. Format for this should be: Damage Roll {\#}: {Rolled Number}. Effect: {describe what effect took place and if it was a damage effect which runner it targeted}  
- This is an example for how this could look like if a player has 5 damage and 3 risk.  
  - Damage Roll 1: 56\. Effect: Rewards Reduced by 10%, New Total Rewards: X  
  - Damage Roll 2: 99: Effect: Rewards Increased by 5%, New Total Rewards: X  
  - Damage Roll 3: 24\. Effect: {RunnerName1} got injured.  
  - Damage Roll 5: 85: Effect: No effect.  
  - Damage Roll 3: 3\. Effect:  {RunnerName1} died.

### Contract Base Reward

The base reward for every contract should be set to 1000 Money (should be adjustable in balancing csv). So every contract has an initial money stat of 1000 when started. 

