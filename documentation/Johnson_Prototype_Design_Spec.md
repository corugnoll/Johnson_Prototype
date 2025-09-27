# Overview

This is a prototype for a simulation/puzzle game hybrid. The prototype focuses mostly on the puzzle-side and will be used to playtest the core mechanic of the game with users.  
It should be running in the browser, be easy to fill with new content to test and iterate on based on user feedback.  
The game puts players in the seat of a “Johnson”, a fixer in a cyberpunk-world. They will get to choose contracts and hire “Runners” to execute these contracts.Then they will receive rewards and continue. This is the high level “simulation” loop of the game. We should implement this lightly and have the option to iterate on it and add more to it later.

The core loop we want to test the most is how these contracts play out.  
Contracts are presented as a “Perk Tree”, a set of connected nodes that contain the narrative of the contract but also have effects. These can be seen as a small puzzle that players need to solve. They can choose the input by selecting a group of Runners and then need to choose path through this Perk Tree that minimizes negative effects and maximizes synergistic effects for more rewards.

# Rough Roadmap

Core Features (Must Have)   
1\. Load and display one contract   
2\. Node selection/deselection  
 3\. Effect calculation   
4\. Preview updates   
Phase 2 Features   
1\. Multiple contract handling  
2\. Visual polish

# Game Flow

The following gameflow should be part of the initial prototype:

- Players select contract from Dropdown of Available Contracts  
- The Contract is generated according to Contract Generation  
- Players input the stats of the runners they want to use for this contract  
- Players select the perks they want in the Contract Perk Tree  
- Players can see the outcomes of their choices in a preview section at all times  
- Players select “Execute Contract” and the effects are applied and modify the Player’s Stats accordingly  
- Cleanup: When players select a new contract, the old contract information is removed (pools get emptied etc), the new one is loaded and the runners are reset.

# Tech and Architecture

### **Technology Requirements**

* Platform: Modern web browser  
* Approach: Client-side only (no server required)  
* Complexity: Keep simple \- prototype level, not production  
* Performance: Should handle up to 100 nodes smoothly

### **Recommended Structure**

* Use vanilla JavaScript or a simple framework  
* Organize code into logical modules/files  
* Separate concerns: rendering, game logic, data management  
* No complex build process required for prototype

### **Key Technical Decisions Agents Should Make**

* 1\. Rendering Approach:  
*    \- Canvas-based (better for complex graphics, connection lines)  
*    \- OR DOM-based (simpler for clickable nodes with text)  
*      
* 2\. State Management:  
*    \- How to track selected nodes  
*    \- How to store contract data  
*    \- How to calculate and update pools  
*      
* 3\. File Organization:  
*    \- Logical separation of features  
*    \- Clear naming conventions  
*      
* 4\. Data Flow:  
*    \- How user actions trigger updates  
*    \- How changes propagate through the system

### **Required Capabilities**

* \- Load and parse CSV files  
* \- Render nodes with different visual states  
* \- Draw connections between nodes  
* \- Calculate effects based on conditions  
* \- Update UI sections dynamically  
* \- Handle user interactions (clicks, input fields)  
* \- Reset state when switching contracts

### **External Libraries (Optional)**

* \- CSV parsing: Can use Papa Parse or implement custom parser  
* \- No other external dependencies required

### **Browser Compatibility**

* Target modern browsers only (2020 or newer)  
* No need for legacy browser support

# UI Specifications

## Node Colors

The following Colors should be used for Nodes when drawing them.

| Name in CSV | Hex Code |
| :---- | :---- |
| Red | \#FF6467 |
| Yellow | \#FFDF20 |
| Green | \#FFDF20 |
| Blue | \#51A2FF |
| Purple | \#51A2FF |
| Grey | \#51A2FF |

## Other UI Features

- Create Hover Feedback for interactive elements  
- Create on click feedback for interactive elements  
- Create visual feedback for Node State (Available, Unavailable, Selected) as specified in Node State Table

# Play Area

The play area consists of the following elements:

- Game Board (Center of Screen)  
- Setup Section (Top Left)  
- Game State Section (Top Center)  
- Options Section (Bottom Right)

Here is a quick and dirty mockup of the Play Area detailing where certain sections should be located and a rough plan for their size compared to each other:  
![][image1]

## Game Board Details

- Containts Contract Perk Tree and displays its name somewhere visible  
- Section for Synergy Nodes above the Perk Tree  
- Can be scrolled if perk tree is too large to be displayed on one screen

## Setup Section

Here players can select their runner stats.

-  There are always 3 runners per contract.  
- Each has a Dropdown for “Runner Type” (possible choices:Empty, Face, Muscle, Hacker, Ninja)  
- Each has 4 text-fields where users can input integers, one for each Runner-Stat: FaceStat, MuscleStat, HackerStat, NinjaStat  
- Has a sub section that shows the totals of all Runner Stats added from all Runners

## Options Section

A section that contains buttons with functionality to advance gamestate  
Has the following elements:

- Help Button: on hover displays help. Text can be gathered from this file on github: documentation/help.txt  
- Contract Dropdown: Dropdown of all available contracts  
- Select Contract Button: Selects the contract that was selected in the Dropdown and removes the current one, if there is one.  
- Execute Contract: Only clickable if a contract is selected. Executes the current contract.  
- Reset Game: resets the game to its initial state

## Game State Section

Here players see an overview of their current player state. It contains the following elements:

- Amount of PlayerMoney  
- Amount of PlayerRisk  
- Amount of completed Contracts

## Preview Section

Displays the preview of stats for the current contract and Node selection. Whenever a node’s state changes, the whole preview is updated. If no contract is selected, this is empty.  
Has the following information:

- Display Current Stat Pools for: Grit, Veil, Damage, Risk, Money  
- Display Prevented Damage (from Grit)   
- Display Prevented Risk (from Veil)

# Contract Perk Tree

The core of the prototype are the Contract Perk Trees that are displayed on the Game Board.  
They consist of the following components:

- Nodes: The main interactive element of which perk trees are made.  
- Connection Lines: Lines that connect individual nodes visually, they do not have any interactivity at this stage of the prototype.

### Nodes

Nodes are the core part of each contract. They are described in detail in their own design spec section.

## Connection Lines

Connection Lines are drawn between any directly connected Nodes.   
They should always be drawn using straight lines and 90° angles to create a cleanand readable look.

Visual Mockup of how a Contract Perk Tree could look like:  
![][image2]

## 

# Node Design Specs

Nodes are the core interactive element of the prototype.  
Nodes can exist in the following states:

## Node States

A node’s state should be visualized on the node. Node States can change if users click on them.

| State | Behavior | Visualization |
| :---- | :---- | :---- |
| Available | Does not apply its effects Can be clicked to become Selected | Normal node visual |
| Selected | Does apply its effects Can be clicked to become Available (effect is removed) | Outline shows selected state |
| Unavailable | Does not apply its effecs Cannot be clicked on | Desaturated version of normal node visual |

## Node Types

| Type | Behavior | Visualization |
| :---- | :---- | :---- |
| Effect Node | Can be interacted with and apply effects. Is part of the main part of Contract Perk Tree | Rectangle with correct color |
| Gate node | Cannot be interacted with. Is part of the main part of Contract Perk Tree | Pill shaped with correct color. |
| Synergy Node | Can be interacted with. Is displayed above contract perk tree. | Rectangle with correct color. |

## Node Effects

### Components

Effects have the components outlied in this table.  
In the CSV Effect Column they will be written as follows:  
 {Condition};{Operator};{Amount};{Stat}

| Component | Format | Example |
| :---- | :---- | :---- |
| Condition | See Condition Table | Runnertype,Hacker,Muscle |
| Operator | See Operator Table | \* |
| Amount | Integer | 5 |
| Stat | Any Valid Stat Name | Grit |

### Condition Table

| Condition | Format | Behavior |
| :---- | :---- | :---- |
| None (Default) | None | Apply Effect Directly |
| RunnerType | RunnerType,{Type1},{Type2},... | Sum Types across Runners  |
| RunnerStat | RunnerStat,{Stat1},{Stat2},…,{Threshold} | Sum stats across all runners, divide by threshold (round down) |
| NodeColor | NodeColor,{Color1},{Color2},... | Sum colors across all selected nodes |
| NodeColorCombo | NodeColorCombo,{Color1},Color2},... | Count complete sets selected nodes of all specified colors. Each node can only count once. |

### Operator Table

| Symbol | Effect |
| :---- | :---- |
| \+ | Addition |
| \- | Subtraction |
| \* | Multiplication |

### Stat Table

| Stat | Effect |
| :---- | :---- |
| Damage | Tracked as a pool in contract. |
| Risk | Tracked as a pool in contract Total is Added to PlayerRisk Stat on contract completion. |
| Money | Tracked as a pool in contract Total is Added to PlayerMoney Stat on contract completion. |
| Grit | Tracked as a pool in contract. Damage is reduced for each 2 Grit. |
| Veil | Tracked as a pool in contract. Risk is reduced for each 2 Grit. |

### Processing Order

1\. Evaluate condition → get multiplier   
2\. Calculate: base\_value (operator) (amount \* multiplier)   
3\. Apply to stat

### Examples

| CSV Entry | Effect |
| :---- | :---- |
| None;+;2;Damage | When node is selected add 2 to the Damage pool. |
| RunnerType,Muscle;+;1;Veil | For each Runner of Type Muscle, add 1 Veil to the pool. |
| RunnerStat,Muscle,4;\*;2;Grit | For each 4 Points of MuscleStat across all Runners add that number \*2 Grit to the pool. |
| NodeColor,Red,Green;+;1;Damage | For each selected green node and red node add 1 damage to the pool.  |
| NodeColorCombo,Red,Green,Blue;-;3;Risk | For each unique combination of selected Red,Green and Blue nodes, subtract 3 from the Risk pool. |

### Error Handling

Invalid Formats

* Missing semicolons → Log error, skip effect  
* Unknown stat → Log warning, skip effect  
* Invalid operator → Log warning, Default to addition  
* Non-numeric amount → Log warning, Default to 1

### Validation Rules

- Conditions must exist in Condition Table  
- Operators must exist in Operator Table  
- Amount must be integer between \-999 and 999  
- Stat must exist in Stat Table

### Mockup

A mockup of how an effect or synergy Node should look like:  
![][image3]

## Contract Generation

Contract Perk Trees are generated based on data from the contract\_data CSV file.

### Processing Order

1. Get Data from CSV file of the contract  
2. Generate Nodes based on CSV file data  
3. Generate Connection Lines based on CSV file data using only straight lines and 90° angles

### CSV File

Each contract has its own csv file.  
You can find an example CSV on github: Contracts/Contract\_Example1.csv  
Each Row in the CSV represents a node.

| Column Name | Required | Behavior |
| :---- | :---- | :---- |
| Node ID | Yes | The unique identifier of this node in the current tree. |
| Description | Yes | The description to be written on the Node |
| Effect Desc | Yes | Text displayed to users to explain the effect. |
| Effect 1 | Yes | A set of parameters that defines the effect the node has when selected. |
| Effect 2 | No | A set of parameters that defines the effect the node has when selected. Can be empty. |
| Type | Yes | The type of the node. |
| Color | Yes | The color in which the node should be drawn and the color it uses when effects are evaluated.  |
| Layer | No | Number that defines Vertical Position. |
| Slot | No | Defines Horizontal Position inside chosen layer See Slot Table for valid inputs. |
| Connections | No | Semicolon-separated list of connected node IDs, defines which nodes a Connection Line should be drawn to |

### Slot Table

| Name | Position |
| :---- | :---- |
| CE | Center |
| U1 | 1 Above Center |
| U2 | 2 Above Center |
| D1 | 1 Below Center |
| D2 | 2 Below Center |

### Additional Rules

- Nodes of Type “Synergy” are always displayed in their own section above the Contract Perk Tree. They are centered above the tree and ordered from left to right. Thus, these will not have an entry for “Slot” and “Layer”.

## Contract Completion

When a player clicks on the “Complete Contract” button, the following happens:

- Re-Evaluate all Stat pools of this contract by applying Node Effects  
- Apply Synergy Node effects  
- Add contract Risk pool total to PlayerRisk stat  
- Add contract Money pool total to PlayerMoney stat  
- Empty pools, remove contract visuals and logic and reset everything so when a new contract is loaded no problems arise  
- Set RunnerStats to 0, set RunnerTypes to Empty

# Possible Player Actions

- Setup Section:  
  - Select runner type in dropdown  
  - Add runner stat for each runner in text field  
- Contract Area:  
  - Click on nodes to change their state  
  - Drag the screen if tree is larger than visible area to scroll around canvas  
- Options Area:  
  - Click on interactive elements and buttons

## 

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,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>
