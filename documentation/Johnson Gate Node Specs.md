# Design Specs for “Gate” Nodes

## Comparison to Normal or Synergy Nodes

- “Gates” are a type of node (like “Normal” and “Synergy”).  
- They do not require input in the: “Description” column, since they dont display the text written their.  
- They also do not require input in any of the “Effect” columns, since they dont have any effects themselves. Should an input be inside of these, it will have no effect if the are selected.  
- They do take their information from a new column called “GateCondition”  
- Other Nodes do not require any input in the “GateCondition” and would ignore it if an input was made here, since they are not gates.  
- “Gates” can be normally connected in the tree like “Normal” nodes.

## Game Functionality

- Gates serve as “gating” for progression through the Contract Perk Tree.  
- They need a condition to be fulfilled before they can be selected  
- That condition always looks at the Runner Setup of the run.  
- They have the following conditions:   
  - Amount of Runners of Type: Counts runners of the selected types  
  - Total amount of runner stats: Adds the total of the selected stats for all runners.  
  - We will probably add new conditions later, so this should be expandable.  
- These should function similar to conditions for Effects. The difference is that they dont apply a multiplier, but control if the gate node can be selected.  
- Their condition should be stored in the new “GateEffect” column. The syntax should be similar to how conditions work for Effects. So:  
  - For RunnerType it would be RunnerType:{Type1},{Type2},etc;Amount Example: RunnerType:hacker,muscle;3 would mean: Check all runners and if there are a total of 3 or more runners of type hacker or muscle the condition is fulfilled  
  - For RunnerStat it would be: RunnerStat:{Stat1},{Stat2},etc,;Amount example: RunnerStat:muscle,stealth;4 Across all runners, the sum of their muscle and stealth stats needs to be 4 or higher for the condition to be fulfilled.  
- If the condition is met, the node should be turned active.  
- If the condition is not met, the node should be inactive.  
- If it is a bigger rework to put this information into the “Effect 1” column, we can also add a new column called “GateCondition” that is only used for gates.  
- Gates do have a color but they are NOT counted when nodes of colors are counted for effects from “Normal” or “Synergy” nodes.

## Visuals

The following is true for ingame and also in the editor:

- Gates dont require a “Description”, they only have an “Effect Description”. Thus they only need 1 text field and no divider element  
- Gates should have slightly different shape. Go with a rectangle with rounded edges.

## Editor and Import/Export

- Gates can be added in the editor by setting the “Type” to gate  
- When exporting from the editor, the gate information is correctly stored in the excel so it can be imported into the game  
- Gate nodes are correctly handled in the game as described above when imported  
  