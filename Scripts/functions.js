// #region VARIABLES

let version = 0.027;

let insight = 0;
let hpCurrent = 10;
let hpMax = 10;
let gold = 0;

let ore = 0;
let leather = 0;
let greenHerb = 0;

// Base stats are the players raw stats
let basePower = 0;
let baseStamina = 3;
let baseDefence = 0;
let baseEvasion = 0;
// These are the calculated stats based on other factors like equipped items
let power = 0;
let maxStamina = 0;
let currentStamina = 0;
let defence = 0;
let evasion = 0;

let currentContext = 0;         // Index of the current displayed context. Index related to a certain array, currentContextType indicates what type of context and therefore which array to sear
let currentContextType = 0;     // 1 = Location, 2 = Locked, 3 = Monster, 4 = Item, 5 = NPC, 6 = Misc Action
let storedLocation = 0;         // Anytime we change to a secondary context, store the primary context location
let locationsVisited = [];      // A list of locations we have already visited
let areasVisited = [];          // A list of areas we have already visited

let currentNarration = "";
let currentNarrationIndex = 0;
let narrationOpen = false;
let titleOpen = false;

let activeDirections = [];      // Array that contains which directions (0=north, 1=west, 2=east, 3=south ) have active buttons currently

let inventory = [];             // Inventory contains index numbers for items in the items array
let inventoryOpen = false;
let upgradeMenuOpen = false;
let trainMenuOpen = false;

// Default location for new games is edge_woods
let respawnLocation = {
    context: 0,
    contextType: 0,
    storedLocation: 0
}

let corpseLocation = -1;

// Debug
let showDebugLog = true;
let debugStartContext = "edge_garden";
let debugRespawn = "edge_garden";
let debugWindowActive = false;

// Stats
const insightText = document.querySelector('#insight-text');
const hpText = document.querySelector('#hp-text');
const goldText = document.querySelector('#gold-text');
const inventoryIcon = document.querySelector('#inventory-icon');
// Main Content
const mainTitle =  document.querySelector('#main-title');
const mainTitleText =  document.querySelector('#main-title-text');
const secondaryTitle =  document.querySelector('#secondary-title');
const secondaryTitleText =  document.querySelector('#secondary-title-text');
const secondaryTitleIcon =  document.querySelector('#secondary-title-icon');
const monsterLevelText =  document.querySelector('#monster-level-text');
const mainText =  document.querySelector('#main-text');
const narrationText =  document.querySelector('#narration-text');
const updateText =  document.querySelector('#update-text');
const monsterHpSection =  document.querySelector('#monster-hp-section');
const monsterHpBar =  document.querySelector('#monster-hp-bar-current');
const monsterHpText =  document.querySelector('#monster-hp-text');
const equipmentTitle =  document.querySelector('#equipment-title');
const equipmentSection =  document.querySelector('#equipment-section');
const inventoryTitle =  document.querySelector('#inventory-title');
const inventorySection =  document.querySelector('#inventory-section');
const saleTitle =  document.querySelector('#sale-title');
const saleSection =  document.querySelector('#sale-section');

const hpStat = document.querySelector('#hp-stat');            // Text and icon combined
const insightStat = document.querySelector('#insight-stat');        // Text and icon combined
const goldStat = document.querySelector('#gold-stat');        // Text and icon combined
const powerStat = document.querySelector('#power-stat');            // Text and icon combined
const staminaStat = document.querySelector('#stamina-stat');        // Text and icon combined
const defenceStat = document.querySelector('#defence-stat');        // Text and icon combined
const powerText = document.querySelector('#power-text');
const staminaText = document.querySelector('#stamina-text');
const defenceText = document.querySelector('#defence-text');

const buttonMaster = document.querySelector('#button-master');

//Misc
const debugWindow = document.querySelector('#debug');
const debugButton1 = document.querySelector('#debug-button1');
const debugButton2 = document.querySelector('#debug-button2');
const debugButton2b = document.querySelector('#debug-button2b');
const debugButton3 = document.querySelector('#debug-button3');
const debugButton4 = document.querySelector('#debug-button4');
const debugButton5 = document.querySelector('#debug-button5');
const debugButton6 = document.querySelector('#debug-button6');
const debugButton7 = document.querySelector('#debug-button7');
const resetLocationsCheckbox = document.querySelector('#resetLocations');
let resetLocations = false;     // We use this for debug, when selected on reload we will always re-write locationsModified from locations so that updates to the games content can be tested immediately without needing to reset the whole game

let createdButtons = [];

// #region Containers

// A template for the format of an action object
const protoAction = {
    keyword: "",
    title: "",
    active: true,
    staminaCost: -1,
    location: "",
    func: ""
}

let narrations = [
    {
        keyword: "",
        seen: false,
        text:[]
    }
]

let monsters = [];

let locations = [    
    {
        area: "",
        keyword: "",
        title: "",        
        description: "",
        narration: "",        
        update: "",        
        items: [],
        monsters: [],
        npcs: [],
        north: "",
        west: "",
        east: "",
        south: "",
        up: "",
        down: "",        
    }
]

let npcs = [
    {
        keyword: "",
        title: "",
        shortTitle: "",
        description: "",
        update: "",
        dialogueAvailable: true,
        currentDialogue: 0,
        items: [],
        actions: [
            {
                type: 0,
                title: "",
                keyword: "",
                location: "",
                func: ""
            }            
        ]
    }
];
// ITEM TYPES - WEAPON, ARMOR, TALISMAN
let items = [];
let actions = [];

var config = 
{    
	header: true,
	dynamicTyping: true,
	skipEmptyLines: true
}

const promise1 = fetch('Data/items.csv')
  .then((response) => response.text())
  .then((data) => { 
    items = Papa.parse(data, config).data;
    // Filter out empty rows
    items = items.filter(({ keyword }) => keyword != null);
});

const promise2 = fetch('Data/monsters.csv')
  .then((response) => response.text())
  .then((data) => { 
    monsters = Papa.parse(data, config).data;
    // Filter out empty rows
    monsters = monsters.filter(({ keyword }) => keyword != null);
});

const promise3 = fetch('Data/actions.csv')
  .then((response) => response.text())
  .then((data) => { 
    actions = Papa.parse(data, config).data;
    // Filter out empty rows
    actions = actions.filter(({ keyword }) => keyword != null);
});


// Store these containers at runtime because they will be modified as the player plays
let locationsModified = [];
let monstersModified = []
let npcsModified = []
let itemsModified = []
let narrationsModified = []


// #endregion

//#endregion

// #region GAME CORE

function initializeGame() {

    if (showDebugLog) console.log("InitializeGame - ");
    
    // Check whether there is already a save game
    if (localStorage.getItem('saveExists')) {
        if (showDebugLog) console.log("Save game exists");

        let validVersion = versionCheck();

        if (validVersion)
            load();
        else {
            if (showDebugLog) console.log("Invalid save found - resetting game");
            resetGame();
            return;
        }
                
        updateStats();
        save();

        if (currentContext === -99)
            respawn();
        else
            changeContextDirect(currentContext, currentContextType);
    }
    // No save game, so start a new game
    else {

        if (showDebugLog) console.log("Save game doesn't exist");        
        
        // Using JSON to create deep newButtons of our starting data arrays
        formatData();

        insight = 0;
        hpCurrent = 40;
        hpMax = 40;
        gold = 2;
        ore = 0;
        leather = 0;
        greenHerb = 0;

        // Base stats are the players raw stats
        basePower = 0;
        baseStamina = 3;
        baseDefence = 0;
        baseEvasion = 20;
                        
        updateStats();
        
        currentStamina = maxStamina;

        inventory = [];
        inventory.push("straight_sword","worn_shield","green_cloak","curse_mark", "silver_locket","strange_stone");

        storedLocation = -1;
        locationsVisited = [];
        areasVisited = [];

        let respawnIndex = getContextIndexFromKeyword(debugRespawn, 1);
        respawnLocation = {
            context: respawnIndex,
            contextType: 1,
            storedLocation: -1
        }
        corpseLocation = -1;            

        save();

        let startContext = getContextIndexFromKeyword(debugStartContext, 1);
        changeContextDirect(startContext, 1);
    }
}

// Change our current context - 
// Finds the index of the context we want to go to using the keyword and context type pair as different context types will pull data from different arrays
// We use a keyword instead of relying only on index for human readibility
function changeContext(keyword, contextType) {

    if (showDebugLog) console.log("changeContext - keyword:" + keyword + "   contextType:" + contextType + "   storedLocation:" + storedLocation);

    let entryFound = false;
    // If it's not a secondary context, we look for the new location within locations
    if (contextType === 1) {

        locationsModified.forEach((element, index) => {
            if (element.keyword == keyword) {
                currentContext = index;
                currentContextType = 1;
                storedLocation = -1;
                entryFound = true;
            }
        });    
    }
    else if (contextType > 1) {        
                
        // Search for the context we linked within the monsters group        
        monstersModified.forEach((element, index) => {
            if (element.keyword == keyword) {
                
                if (storedLocation === -1) storedLocation = currentContext;     // Check for null storedLocation, if there is already a value then we are loading directly into this location. The better solution this this issue would be storing the parent context within the child
                currentContext = index;
                currentContextType = 3;
                entryFound = true;
            }
        });

        // If we didn't find the entry as a monster we search for it in items
        if (!entryFound) {

            itemsModified.forEach((element, index) => {
                if (element.keyword == keyword) {
                 
                    if (storedLocation === -1) storedLocation = currentContext;     // Check for null storedLocation, if there is already a value then we are loading directly into this location. The better solution this this issue would be storing the parent context within the child
                    currentContext = index;
                    currentContextType = 4;
                    entryFound = true;
                }
            });
        }

        // If we didn't find the entry as a monster we search for it in npcs
        if (!entryFound) {
            
            npcs.forEach((element, index) => {

                if (element.keyword == keyword) {
                    
                    if (storedLocation === -1) storedLocation = currentContext;     // Check for null storedLocation, if there is already a value then we are loading directly into this location. The better solution this this issue would be storing the parent context within the child
                    currentContext = index;
                    currentContextType = 5;
                    entryFound = true;
                }
            });
        }
    }

    if (entryFound) {

        save();
        updateContext();
    }
    else if (!entryFound) {
        console.error("ChangeContext() - Couldn't find the keyword [" + keyword + "] as contextType: " + contextType);
    }
}

// Used to go directly to a known context
function changeContextDirect(contextIndex, contextType) {
    
    narrationOpen = false;

    let keyword = "";
    switch (contextType) {
        case 1://Location
            keyword = locationsModified[contextIndex].keyword;
            break;
        case 3://Monster
            keyword = monstersModified[contextIndex].keyword;
            break;
        case 4://Item
            //Items aren't contexts
            break;
        case 5://NPC
            keyword = npcsModified[contextIndex].keyword;
            break;                
    }

    changeContext(keyword, contextType);
}

// Update the UI to reflect a change in context, or other significant changes in the gameplay state
function updateContext() {    
    
    if (showDebugLog) console.log("updateContext - currentContext: " + currentContext + "       currentContextType: " + currentContextType + "    storedLocation: " + storedLocation);

    resetUpdateText();
    collapseStats();
    narrationText.style.display = "none";
    updateText.style.display = "none";
    monsterHpSection.style.display = "none";
    inventoryTitle.style.display = "none";
    equipmentTitle.style.display = "none";
    saleTitle.style.display = "none";

    // If we are updating to a location type - 
    if (currentContextType === 1) {    

        // Check if we are entering a new area and should show the title card first
        if (locationsModified[currentContext].area != "") {

            let areaVisited = areasVisited.indexOf(locationsModified[currentContext].area) != -1;
            if (!areaVisited) {
                displayTitle();
                return;
            }
        }

        // Check if we've already visited this location
        let locationVisited = locationsVisited.indexOf(locationsModified[currentContext].keyword) != -1;        

        // First time visiting this location, check whether there is a narration to play first
        if (!locationVisited) {
            
            // Check whether this location has a narration keyword
            if (locationsModified[currentContext].narration != undefined && locationsModified[currentContext].narration != "") {
                
                // Check if the matching narration to this keyword has already been seen                
                if (narrationsModified[getElementFromKeyword(locationsModified[currentContext].narration, narrations)] != undefined && !narrationsModified[getElementFromKeyword(locationsModified[currentContext].narration, narrations)].seen) {

                    displayNarration(locationsModified[currentContext].narration);
                    return;
                }
            }

            // If the description for this context is empty, that means it's only narration and we shouldn't add it to visited. If we did, players could get linked back to it and it would be empty as narration doesn't appear the second time visiting
            if (locationsModified[currentContext].description != "") {
                locationsVisited.push(currentContext);
                save();
            }
            
            // Check if there is narration text, then show it as this is the first time visiting
            if (locationsModified[currentContext].update != undefined && locationsModified[currentContext].update != "") {
                narrationText.style.display = "block";
                narrationText.innerText = locationsModified[currentContext].update;  // Add the narration text so it appears before the main text for the locat                
            }
        }

        mainTitle.classList = "";        
        mainTitleText.classList = "";
        secondaryTitle.style.display = "none";
        
        mainTitleText.innerText = locationsModified[currentContext].title;        
        mainText.innerText = locationsModified[currentContext].description;         
    }
    // If currentLocationType != 1 - We are currently in a secondary context
    else if (currentContextType != 1) {
        
        mainTitleText.innerText = locationsModified[storedLocation].title;
        mainTitleText.classList = "secondary";        
        secondaryTitle.style.display = "flex";
        
        // Change the array of actions we are looking at depending on the context type
        switch (currentContextType) {
            // 3 = Monster
            case 3:
                secondaryTitleIcon.classList = "monster";
                secondaryTitleIcon.innerText = monstersModified[currentContext].level;
                secondaryTitleText.innerText = monstersModified[currentContext].title;
                mainText.innerText = monstersModified[currentContext].description;

                expandStats();

                monsterHpSection.style.display = "block";
                updateMonsterUI();
                
                // Some contexts have update text that should display when the player enters their context
                if (monstersModified[currentContext].update != undefined && monstersModified[currentContext].update != "")
                    addUpdateText(monstersModified[currentContext].update);                

                break;
            // 4 = Item
            case 4:
                break;
            // 4 = NPC
            case 5:
                secondaryTitleIcon.classList = "npc";
                secondaryTitleIcon.innerText = "";
                secondaryTitleText.innerText = npcsModified[currentContext].title;
                mainText.innerText = npcsModified[currentContext].description;                

                // Some contexts have update text that should display when the player enters their context
                if (npcsModified[currentContext].update != undefined && npcsModified[currentContext].update != "")
                    addUpdateText(npcsModified[currentContext].update);  

                break;
        }
    }

    updateButtons();
}

function clearCreatedButtons() {

    createdButtons.forEach((element) => {        
        element.remove();
    });
    createdButtons = [];
}

function createButton() {

    const clone = buttonMaster.cloneNode(true);

    let newButton = {
        button: clone,
        buttonText: clone.querySelector('.button-text'),
        staminaCostSection: clone.querySelector('.stamina-cost-section'),
        staminaCost: clone.querySelector('.stamina-cost-text'),
        itemCostSection: clone.querySelector('.item-cost-section'),
        itemCostText: clone.querySelector('.item-cost-text'),
        buttonChevron: clone.querySelector('.button-chevron'),
        descriptionText: clone.querySelector('.description-section'),
        buttonStatSection: clone.querySelector('.button-stat-section'),
        secondaryButton: clone.querySelector('.secondary-action-button'),
        secondaryButtonText: clone.querySelector('.secondary-button-text'),
        upgradeMaterialCost: clone.querySelector('.upgrade-material-cost'),
        powerText: clone.querySelector('.button-power-text'),
        staminaText: clone.querySelector('.button-stamina-text'),
        defenceText: clone.querySelector('.button-defence-text'),
        buttonLevelIcon: clone.querySelector('#button-level-icon')
    }

    newButton.button.style.display = "flex";
    newButton.button.classList.remove('active');
    newButton.buttonChevron.style.display = "none";
    newButton.staminaCostSection.style.display = "none";
    newButton.itemCostSection.style.display = "none";
    newButton.descriptionText.style.display = "none";
    newButton.buttonStatSection.style.display = "none";
    newButton.secondaryButton.style.display = "none";            
    newButton.upgradeMaterialCost.style.display = "none";
    newButton.buttonLevelIcon.style.display = "none";

    newButton.button.onmouseover = (event) => { newButton.buttonChevron.querySelector('img').classList.add('hover'); };
    newButton.button.onmouseleave = (event) => { newButton.buttonChevron.querySelector('img').classList.remove('hover'); };

    return newButton;
}

function updateButtons()  {        
    
    if (showDebugLog) console.log("updateButtons() - ");

    clearCreatedButtons();

    let contextActions = [];
    let items = [];
    let monsters = [];
    let npcs = [];    
    activeDirections = [];

    let lastButtonConfigured = null;          // We will store each button we configure as this, so that when we reach the right point, we can add special formatting to it
    
    if (narrationOpen) {

        contextActions.push({
            keyword: "next",
            title: "Next",
            active: true,
            staminaCost: -1,
            location: "",
            func: "continueNarration"
        });
    }
    else if (titleOpen) {

        contextActions.push({
            keyword: "continue",
            title: "Continue",
            active: true,
            staminaCost: -1,            
            location: "",
            func: "closeTitle"
        });
    }    
    else if (!narrationOpen && !titleOpen && !trainMenuOpen) {

        switch (currentContextType) {
            case 1://Location            
                
                // NORTH                            
                if (locationsModified[currentContext].north != "") activeDirections.push(0);        // This is used for hotkey navigation with the keyboard (go function)
                contextActions.push({
                    keyword: "north",                                    
                    title: locationsModified[currentContext].north === "" ? "North" : "North to " + locationsModified[getElementFromKeyword(locationsModified[currentContext].north, locationsModified)].title,                
                    active: locationsModified[currentContext].north === "" ?  false : true,
                    location: locationsModified[currentContext].north,
                    func: "",
                });
                // WEST
                if (locationsModified[currentContext].west != "") activeDirections.push(1);        // This is used for hotkey navigation with the keyboard (go function)
                contextActions.push({                
                    keyword: "west",
                    title: locationsModified[currentContext].west === "" ? "West" :"West to " + locationsModified[getElementFromKeyword(locationsModified[currentContext].west, locationsModified)].title,
                    active: locationsModified[currentContext].west === "" ? false : true,
                    location: locationsModified[currentContext].west,
                    func: "",
                });
                // EAST
                if (locationsModified[currentContext].east != "") activeDirections.push(2);        // This is used for hotkey navigation with the keyboard (go function)
                contextActions.push({                
                    keyword: "east",
                    title: locationsModified[currentContext].east === "" ? "East" : "East to " + locationsModified[getElementFromKeyword(locationsModified[currentContext].east, locationsModified)].title,
                    active: locationsModified[currentContext].east === "" ? false : true,
                    location: locationsModified[currentContext].east,
                    func: "",
                });
                // SOUTH
                if (locationsModified[currentContext].south != "") activeDirections.push(3);        // This is used for hotkey navigation with the keyboard (go function)
                contextActions.push({                
                    keyword: "south",
                    title: locationsModified[currentContext].south === "" ? "South" :"South to " + locationsModified[getElementFromKeyword(locationsModified[currentContext].south, locationsModified)].title,
                    active: locationsModified[currentContext].south === "" ? false : true,
                    location: locationsModified[currentContext].south,
                    func: "",
                });
                
                // UP
                if (locationsModified[currentContext].up != "") {
                    contextActions.push({
                        keyword: "up",
                        title: "Up to " + locationsModified[getElementFromKeyword(locationsModified[currentContext].up, locationsModified)].title,
                        active: true,
                        staminaCost: -1,
                        location: locationsModified[currentContext].up,
                        func: ""
                    });
                }
                // Down
                if (locationsModified[currentContext].down != "") {
                    contextActions.push({
                        keyword: "down",
                        title: "Down to " + locationsModified[getElementFromKeyword(locationsModified[currentContext].down, locationsModified)].title,
                        active: true,
                        staminaCost: -1,
                        location: locationsModified[currentContext].down,
                        func: ""
                    });
                }
                
                items = locationsModified[currentContext].items;
                monsters = locationsModified[currentContext].monsters;
                npcs = locationsModified[currentContext].npcs;
                break;
            case 5://NPC

                contextActions = JSON.parse(JSON.stringify(npcsModified[currentContext].actions));

                // Add the default actions for all NPCs
                if (npcsModified[currentContext].dialogueAvailable != null) {
                    contextActions.push({
                        keyword: "talk",
                        title: "Talk",
                        active: true,
                        staminaCost: -1,
                        location: "",
                        func: "talk"
                    });
                }
                contextActions.push({
                    keyword: "leave",
                    title: "Leave",
                    active: true,
                    staminaCost: -1,
                    location: "",
                    func: "returnToPrimaryContext"                    
                });

                items = npcsModified[currentContext].items;
                break;
        }     
    }       

    // If we are currently opening the upgrade menu, we need to cycle through everything in our inventory and get only upgradable items
    if (!narrationOpen && !inventoryOpen && !trainMenuOpen && upgradeMenuOpen) {

        contextActions = [];
        contextActions.push({            
            keyword: "back",
            title: "Back",
            active: true,
            staminaCost: -1,
            location: "",
            func: "exitUpgrade"
            });

        items = [];
        inventory.forEach((element, index) => {

            if (itemsModified[getContextIndexFromKeyword(element, 4)].canUpgrade)
                items.push(element);
        });
    }

    // In the inventory - we inject special items that represent our resources, but only if we have any of that resource
    if (inventoryOpen) {
        
        // We make a deep copy of our inventory to inject these resource items into only while we are viewing the inventory
        items = JSON.parse(JSON.stringify(inventory));
        if (ore > 0) { itemsModified[getContextIndexFromKeyword("ore", 4)].quantity = ore; items.splice(0,0, "ore"); }
        if (leather > 0) { itemsModified[getContextIndexFromKeyword("leather", 4)].quantity = ore; items.splice(0,0, "leather"); }
        if (greenHerb > 0) { itemsModified[getContextIndexFromKeyword("green_herb", 4)].quantity = greenHerb; items.splice(0,0, "green_herb"); }            
    }    
    if (items != undefined && items.length > 0 && items != "") {
                
        // Functionality is defined by the context this button is in:
        // 1: Location    2: Inventory Normal     3: Inventory + Monster      4: Vendor Buy        5: Vendor Upgrade
        let buttonContext = -1;
        // Location
        if (currentContextType === 1) {
            buttonContext = 1;
        }    
        if (currentContextType === 5) {
            buttonContext = 4;
        }
        if (currentContextType != 3 && inventoryOpen) {
            buttonContext = 2;
        }
        if (currentContextType === 3 && inventoryOpen) {
            buttonContext = 3;
        }
        if (!inventoryOpen && upgradeMenuOpen)
            buttonContext = 5;

        // Create a button for each item contained in our array
        items.forEach((element,index) => {
            
            let item = itemsModified[getContextIndexFromKeyword(element, 4)];
            
            let itemCostActive = false;            
            let descriptionTextActive = false;
            let upgradeMaterialCostActive = false

            // Create a new button and return an object with all of it's individual elements parameterized
            const newButton = createButton();
            createdButtons.push(newButton.button);
            lastButtonConfigured = newButton.button;                    
            newButton.button.classList = "nav-button item-button can-hover";
            newButton.buttonChevron.style.display = "block";

            // ITEM NAME
            let itemTitle = item.title;
            if (item.level != undefined && item.level > 0) itemTitle += " +" + item.level;
            if (inventoryOpen && item.quantity != undefined && item.quantity > 0) itemTitle += " [ " + item.quantity + " ]";
            newButton.buttonText.innerText = itemTitle;
            
            // ITEM DESCRIPTION
            if (item.description != undefined && item.description != "") {
                newButton.descriptionText.innerText = item.description;            
                descriptionTextActive = true;
            }
            // STAT SECTION
            let statSectionActive = false;
            if (item.power != 0 || item.stamina != 0  || item.defence != 0 ) {
                
                statSectionActive = true;
                newButton.powerText.innerText = item.power;
                newButton.staminaText.innerText = item.stamina;
                newButton.defenceText.innerText = item.defence;
            }
                    

            // Context specific changes - items behave and display differently depending on the context we find them in, below are the contexts that can contain items          
            // 1: Location = Take    2: Inventory = Equip / Unequip     3: Inventory + Monster = Use     4: Vendor Buy = Purchase        5: Vendor Upgrade = Upgrade
            let secondaryButtonDisplayed = false;
            let secondaryButtonActive = true;  
            switch (buttonContext) {

                // 1: Location = Take 
                case 1:                    
                    document.querySelector("nav").insertBefore(newButton.button, buttonMaster);

                    if (item.canTake) {
                        secondaryButtonDisplayed = true;
                        newButton.secondaryButtonText.innerText = "Take";

                        let _currentContext = currentContext;       // Storing this value as it changes before we can use it to remove the item

                        // Taking different items can have different outcomes depending on the item type
                        if (item.itemType != undefined && item.itemType === "pickupGold")
                            newButton.secondaryButton.onclick = function() {  addGold(item.quantity, "You pickup the coins."); removeItemFromContext(item.keyword, _currentContext); playClick(); };
                        else if (item.itemType != undefined && item.itemType === "pickupInsight")
                            newButton.secondaryButton.onclick = function() {  addInsight(item.quantity, "You pick up the relic and feel it's essence move within you."); removeItemFromContext(item.keyword, _currentContext); playClick(); };
                        else if (item.itemType != undefined && item.itemType === "pickupCorpse")
                            // Check if _currentContext === currentContext, otherwise we can be killed in the same turn we pick up the corpse, then this function will be removing the new corpse
                            newButton.secondaryButton.onclick = function() {  getCorpse(item.quantity, "You search the remains of your lifeless body and recover what you can."); playClick(); };
                        else if (item.itemType != undefined && item.itemType === "pickupHeal")
                            newButton.secondaryButton.onclick = function() {  addHealth(item.quantity, "You eat the health item."); removeItemFromContext(item.keyword, _currentContext); playClick(); };
                        else if (item.itemType != undefined && item.itemType === "pickupGreenHerb")
                            newButton.secondaryButton.onclick = function() {  addGreenHerb(item.quantity, "You pick the young Green Herbs and put them in your pouch."); removeItemFromContext(item.keyword, _currentContext); playClick(); };                
                        else
                            newButton.secondaryButton.onclick = function() {  addToInventory(item.keyword); playClick(); };
                    }
                    else
                        secondaryButtonDisplayed = false;

                    break;

                    // 2: Inventory = Equip / Unequip
                case 2:

                    // The healing item we can use from our inventory
                    if (item.itemType != undefined && item.itemType === "healGreenHerb") {
                        secondaryButtonDisplayed = true;
                        newButton.secondaryButtonText.innerText = "Eat";
                        newButton.secondaryButton.onclick = function() { addHealth(10, "You feel slightly healthier."); greenHerb--; updateButtons(); playClick(); };                        
                        inventorySection.appendChild(newButton.button);
                    }
                    else {

                        if (item.equipped)
                            equipmentSection.appendChild(newButton.button);                    
                        else
                            inventorySection.appendChild(newButton.button);

                        if (item.canEquip) {
                            if (item.equipped)
                                newButton.secondaryButtonText.innerText = "Unequip";                        
                            else
                                newButton.secondaryButtonText.innerText = "Equip";
                        
                            secondaryButtonDisplayed = true;                    
                            newButton.secondaryButton.onclick = function() { toggleEquipped(item.keyword); updateButtons(); playClick(); };
                        }
                    }
                    break;

                    // 3: Inventory + Monster = Use
                case 3:
                    
                    break;

                    // 4: Vendor Buy = Purchase 
                case 4:
                    itemCostActive = true;
                    newButton.itemCostSection.style.display = "flex";
                    newButton.itemCostText.innerText = item.cost;

                    // Check if we can afford this item, style text red if we can't
                    if (item.cost < gold) {
                        newButton.itemCostText.classList = "item-cost-text active";  
                        secondaryButtonActive = true;                      
                    }
                    else {
                        newButton.itemCostText.classList = "item-cost-text inactive";
                        secondaryButtonActive = false;
                    }

                    saleTitle.style.display = "block";
                    saleSection.appendChild(newButton.button);
                    secondaryButtonDisplayed = true;
                    newButton.secondaryButtonText.innerText = "Purchase";
                    newButton.secondaryButton.onclick = function() {  buy(item.keyword, item.cost); playClick(); };
                    break;

                    // 5: Vendor Upgrade = Upgrade
                case 5:
                    
                    let costToUpgrade = item.level * 50 + 100;
                    itemCostActive = true;
                    newButton.itemCostSection.style.display = "flex";
                    newButton.itemCostText.innerText = costToUpgrade;
                    let notEnoughGold = false;

                    // Check if we can afford this item, style text red if we can't
                    if (costToUpgrade < gold) {
                        newButton.itemCostText.classList = "item-cost-text active";  
                        secondaryButtonActive = true;                      
                    }
                    else {
                        newButton.itemCostText.classList = "item-cost-text inactive";
                        notEnoughGold = true;
                        secondaryButtonActive = false;
                    }

                    // Check if we have the necessary materials for this item
                    let oreCost = 0; let leatherCost = 0;
                    if (item.upgradeMaterial != undefined && item.upgradeMaterial.includes("ore"))
                        oreCost = item.level * 3 + 1;
                    if (item.upgradeMaterial != undefined && item.upgradeMaterial.includes("leather"))
                        leatherCost = item.level * 5 + 3;

                    if (oreCost === 0 && leatherCost === 0) {

                        upgradeMaterialCostActive = false;
                    }
                    else {

                        upgradeMaterialCostActive = true;
                        let upgradeMaterialString = "";
                        if (oreCost > 0) upgradeMaterialString += oreCost + " Refined Ore";
                        if (leatherCost > 0) upgradeMaterialString += leatherCost + " Hardened Leather";
                        newButton.upgradeMaterialCost.innerText = upgradeMaterialString;

                        if (!notEnoughGold && ore > oreCost && leather > leatherCost) {
                            newButton.upgradeMaterialCost.classList = "upgrade-material-cost active";                            
                            secondaryButtonActive = true;
                        }
                        else {
                            newButton.upgradeMaterialCost.classList = "upgrade-material-cost inactive";                        
                            secondaryButtonActive = false;
                        }
                    }

                    document.querySelector("nav").insertBefore(newButton.button, buttonMaster);
                    statSectionActive = false;                
                    secondaryButtonDisplayed = true;
                    newButton.secondaryButtonText.innerText = "Upgrade";
                    newButton.secondaryButton.onclick = function() {  upgrade(item.keyword, costToUpgrade, oreCost, leatherCost); playClick(); };
                    break;
            }

            // The function for opening and collapsing the button
            let buttonOpened = false;
            newButton.button.onclick = function() { toggleButton(); playClick(); };           

            function toggleButton() {

                if (buttonOpened) {
                    
                    buttonOpened = false;
                    if (itemCostActive) newButton.itemCostSection.style.display = "flex"; else newButton.itemCostSection.style.display = "none";
                    newButton.button.classList.remove('active');
                    newButton.descriptionText.style.display = "none";
                    newButton.buttonStatSection.style.display = "none";
                    newButton.secondaryButton.style.display = "none";
                    newButton.upgradeMaterialCost.style.display = "none";

                    newButton.buttonChevron.querySelector('img').classList.add('chevron-closed');
                    newButton.buttonChevron.querySelector('img').classList.remove('chevron-open');
                }
                else {
                                        
                    buttonOpened = true;
                    newButton.button.classList.add('active');
                    if (itemCostActive) newButton.itemCostSection.style.display = "flex"; else newButton.itemCostSection.style.display = "none";
                    if (descriptionTextActive) newButton.descriptionText.style.display = "block";
                    if (statSectionActive) newButton.buttonStatSection.style.display = "block";
                    if (secondaryButtonDisplayed) newButton.secondaryButton.style.display = "block";
                    if (upgradeMaterialCostActive) newButton.upgradeMaterialCost.style.display = "block";
                    if (secondaryButtonActive) { newButton.secondaryButton.classList.add('item-button'); newButton.secondaryButton.classList.remove('locked-item-button'); }
                    else { newButton.secondaryButton.classList.remove('item-button'); newButton.secondaryButton.classList.add('locked-item-button'); }

                    newButton.buttonChevron.querySelector('img').classList.add('chevron-open');
                    newButton.buttonChevron.querySelector('img').classList.remove('chevron-closed');
                }
            }

            if (!descriptionTextActive && !statSectionActive && !secondaryButtonDisplayed) {
                newButton.buttonChevron.style.display = "none";
                newButton.button.classList = "nav-button locked-item-button";
            }
        });
    }

    // Setup buttons based on actions within the action array
    if (!inventoryOpen) {
        
        //  MONSTERS
        // Set up any new buttons, starting where we left off
        let nextButton = 0;

        if (monsters != undefined && monsters.length > 0 && monsters != "") {
            
            monsters.forEach((element, index) => {

                const monster = monstersModified[getContextIndexFromKeyword(element, 3)];
                let descriptionTextActive = false;

                const newButton = createButton();
                createdButtons.push(newButton.button);
                lastButtonConfigured = newButton.button;
                newButton.button.classList = "nav-button monster-button can-hover";
                newButton.buttonChevron.style.display = "block";

                // ITEM NAME
                newButton.buttonText.innerText = monster.title;
                // ITEM DESCRIPTION
                if (monster.description != undefined && monster.description != "") {
                    newButton.descriptionText.innerText = monster.description;            
                    descriptionTextActive = true;
                }

                document.querySelector("nav").insertBefore(newButton.button, buttonMaster);

                newButton.buttonLevelIcon.style.display = "block";
                newButton.buttonLevelIcon.innerText = monster.level;
                                
                // The function for opening and collapsing the button
                let buttonOpened = false;
                newButton.button.onclick = function() { toggleButton(); playClick(); };           

                function toggleButton() {

                    if (buttonOpened) {
                        
                        buttonOpened = false;
                        newButton.descriptionText.style.display = "none";
                        newButton.button.classList.remove('active');

                        newButton.buttonChevron.querySelector('img').classList.add('chevron-closed');
                        newButton.buttonChevron.querySelector('img').classList.remove('chevron-open');
                    }
                    else {
                                            
                        buttonOpened = true;
                        newButton.button.classList.add('active');                        
                        if (descriptionTextActive)
                            newButton.descriptionText.style.display = "block";

                        newButton.buttonChevron.querySelector('img').classList.add('chevron-open');
                        newButton.buttonChevron.querySelector('img').classList.remove('chevron-closed');
                    }
                }

                // Add changing of action buttons
            });
        }

        //  NPCS
        // Set up any new buttons, starting where we left off
        if (npcs != undefined && npcs.length > 0 && npcs != "") {
            
            npcs.forEach((element, index) => {

                const npc = npcsModified[getContextIndexFromKeyword(element, 5)];                

                const newButton = createButton();
                createdButtons.push(newButton.button);
                lastButtonConfigured = newButton.button;
                newButton.button.classList = "nav-button npc-button can-hover";                

                // ITEM NAME
                newButton.buttonText.innerText = npc.title;                
                
                document.querySelector("nav").insertBefore(newButton.button, buttonMaster);                                                                
                newButton.button.onclick = function() { changeContext(element, 5); playClick(); };                                                                                
            });
        }

        // CONTEXT ACTIONS
        // Add in the rest of context specific actions (i.e. Buttons for leaving the location etc.)
        if (contextActions.length > 0) {

            if (lastButtonConfigured != null)
                lastButtonConfigured.classList += " spacer";         // Before we create the rest of the buttons, we add some spacing in the list to separate the two categories of buttons

            contextActions.forEach((element, index) => {
                
                let additionalButtonString = "";        // If any additional text needs to be appended to a button                                
                let action = element;

                const newButton = createButton();
                createdButtons.push(newButton.button);                       

                // ITEM NAME                            
                document.querySelector("nav").insertBefore(newButton.button, buttonMaster);                                                                
                
                let buttonActive = true;

                if (action.active) {                

                    // Check for Stamina cost, this could modify the button to not be in an active state
                    if (action.staminaCost > 0) {
                        
                        button.querySelector('.stamina-cost-section').style.display = "flex";
                        button.querySelector('.stamina-cost-text').innerText = action.staminaCost;

                        if (action.staminaCost > currentStamina) {                        
                            button.querySelector('.stamina-cost-text').classList = "stamina-cost-text inactive";
                        }
                        else {
                            buttonActive = false;
                            button.querySelector('.stamina-cost-text').classList = "stamina-cost-text active";
                        }                                                                    
                    }

                    // Check for talk actions as they have a specific parameter that could make it inactive
                    if (element.func === "talk") {

                        if (!npcsModified[currentContext].dialogueAvailable)                          
                            buttonActive = false;                        
                    }                    
    
                    if (buttonActive) {
                        
                        newButton.button.classList = "nav-button action-button can-hover";

                        // If this is a loction action
                        if (action.location != "") {

                            newButton.button.onclick = function() { 
                                changeContext(action.location, 1); 
                                if (element.func != undefined && element.func != "") 
                                    doAction(element.func, true); playClick();
                                recoverStamina() 
                            };
                        }
                        // Otherwise this button is a misc function action
                        else {

                            newButton.button.onclick = function() {doAction(element.func); playClick();};
                        }
                    }                
                }
                
                if (!action.active || !buttonActive) {

                    newButton.button.classList = "nav-button action-button-inactive";
                }
                
                newButton.buttonText.innerText = action.title + additionalButtonString;
            });                                                
        }

        // Here we will configure our buttons by hand, rather than having previously pushed action objects into contextActions, it's just simpler to be able to define our onclick functions directly and not use the func parameter
        if (trainMenuOpen) {                        

            let newButton;
            let buttonActive = true;

            // INCREASE HP
            let increaseHpCost = 1;
            newButton = createButton();            
            createdButtons.push(newButton.button);
            document.querySelector("nav").insertBefore(newButton.button, buttonMaster);        
            newButton.buttonText.innerText = "Feed the Body (" + increaseHpCost + " insight)";
            if (insight >= increaseHpCost) {        
                
                newButton.button.classList = "nav-button action-button can-hover";
                newButton.button.onclick = function() {train("hp", increaseHpCost)};
            }
            else {        
                
                newButton.button.classList = "nav-button action-button-inactive";
                newButton.button.onclick = "";        
            }
            // INCREASE STAMINA
            let increaseStaminaCost = 2;
            newButton = createButton();            
            createdButtons.push(newButton.button);
            document.querySelector("nav").insertBefore(newButton.button, buttonMaster);        
            newButton.buttonText.innerText = "Feed the Breathe (" + increaseStaminaCost + " insight)";
            if (insight >= increaseStaminaCost) {        
                
                newButton.button.classList = "nav-button action-button can-hover";
                newButton.button.onclick = function() {train("stamina", increaseStaminaCost)};
            }
            else {        
                
                newButton.button.classList = "nav-button action-button-inactive";
                newButton.button.onclick = "";        
            }
            // INCREASE POWER
            let increasePowerCost = 3;
            newButton = createButton();            
            createdButtons.push(newButton.button);
            document.querySelector("nav").insertBefore(newButton.button, buttonMaster);        
            newButton.buttonText.innerText = "Feed the Curse Mark (" + increasePowerCost + " insight)";
            if (insight >= increasePowerCost) {        
                
                newButton.button.classList = "nav-button action-button can-hover";
                newButton.button.onclick = function() {train("curse", increasePowerCost)};
            }
            else {        
                
                newButton.button.classList = "nav-button action-button-inactive";
                newButton.button.onclick = "";        
            }
            
            newButton = createButton();            
            createdButtons.push(newButton.button);
            document.querySelector("nav").insertBefore(newButton.button, buttonMaster);        
            newButton.button.classList = "nav-button action-button can-hover";
            newButton.buttonText.innerText = "Exit";
            newButton.button.onclick = function() {trainMenuOpen = false; changeContextDirect(currentContext, currentContextType);};
        }
    }    
}

// 0 = North 1 = West 2 = East 3 = South 4 = Next
function go(direction) {
        
    let dir = "";

    // This function only works while in a location context
    if (currentContextType === 1 || narrationOpen) {
        
        if (direction != 4 && activeDirections.indexOf(direction) === -1) { if (showDebugLog) console.log("go - [" + direction + "] is not an active direction."); return; }
                
        switch (direction) {
            case 0:
                dir = "North";                
                break;
            case 1:
                dir = "West";                
                break;
            case 2:
                dir = "East";                
                break;
            case 3:
                dir = "South";                
                break;            
        }
        
        let buttonToClick = null;
        createdButtons.forEach((element) => {
            
            if (direction != 4) {

                if (element.innerText.includes(dir)) {
                    if (element.style.display === "flex")
                        buttonToClick = element;
                }
            }
            else {
                
                if (element.innerText.includes("Next") || element.innerText.includes("Continue")) {
                    if (element.style.display === "flex")
                        buttonToClick = element;
                }
            }                                    
        });

        if (buttonToClick != null) {            
            buttonToClick.onclick();
        }
        else
            console.error("go - didn't find the right button");
    }
}

// Add an action to a specified context at the index, index -1 = append to the end of the list
function addActionToContext(context, contextType, action, index) {
    
    // First check whether context is an int or a string, if it's a string then we've been given a keyword and must first find the proper index
    let contextInt = 0;
    if (!Number.isInteger(parseInt(context))) {

        contextInt = getContextIndexFromKeyword(context, contextType);
        if (contextInt === -1) {
            console.error("addActionToContext() - Tried to add an action using a keyword [" + context + "] but couldn't find that context in the given contextType [" + contextType +"].");
            return;
        }
    }
    else
        contextInt = parseInt(context);


    switch (contextType) {
        case 1://Location
            if (index == -1)
                locationsModified[contextInt].actions.push(action);
            else
                locationsModified[contextInt].actions.splice(index, 0, action);            
            break;
        case 3://Monster
            if (index == -1)
                monstersModified[contextInt].actions.push(action);
            else
                monstersModified[contextInt].actions.splice(index, 0, action);
            
            break;
        case 4://Item
            if (index == -1)
                itemsModified[contextInt].actions.push(action);
            else
                itemsModified[contextInt].actions.splice(index, 0, action);            // Store this in case this is our current context
            break;
        case 5://NPC
            if (index == -1)
                npcsModified[contextInt].actions.push(action);
            else
                npcsModified[contextInt].actions.splice(index, 0, action);            // Store this in case this is our current context
                
            break; 
        }
        
        save();
        // If this is our current context, we need to update the buttons immediately. Will never be an item
        if (context == currentContext && contextType == currentContextType)
            updateButtons();
}

// Remove an action in a given context at the specified index
function removeActionFromContext(context, contextType, index) {

    // First check whether context is an int or a string, if it's a string then we've been given a keyword and must first find the proper index
    let contextInt = 0;
    if (!Number.isInteger(parseInt(context))) {

        contextInt = getContextIndexFromKeyword(context, contextType);
        if (contextInt === -1) {
            console.error("addActionToContext() - Tried to add an action using a keyword [" + context + "] but couldn't find that context in the given contextType [" + contextType +"].");
            return;
        }
    }
    else
        contextInt = parseInt(context);

    switch (contextType) {
        case 1://Location            

            locationsModified[contextInt].actions.splice(index, 1);

            break;
        case 3://Monster            

            monstersModified[contextInt].actions.splice(index, 1);
            break;
        case 4://Item            

            itemsModified[contextInt].actions.splice(index, 1);
            break;
        case 5://NPC            

            npcsModified[contextInt].actions.splice(index, 1);
            break;
        }
        
        save();
        // If this is our current context, we need to update the buttons immediately. Will never be an item
        if (contextInt == currentContext && contextType == currentContextType)
            updateButtons();
}

// Remove action at index, add new one in it's place
function replaceAction(context, contextType, action, index) {

    removeActionFromContext(context, contextType, index);
    addActionToContext(context, contextType, action, index);
}


function displayNarration(narrationKeyword) {
    
    if (showDebugLog) console.log("displayNarration() - ");
        
    if (narrationKeyword != undefined) {
        currentNarration = narrationKeyword;
        currentNarrationIndex = 0;
    }
    else if (narrationKeyword === undefined && currentNarration === "") {
        console.error("displayNarrative - no narrationKeyword provided, currentNarration is undefined as well");
    }        

    narrationOpen = true;
    updateButtons();

    saleTitle.style.display = "none";
    narrationText.style.display = "none";    
    monsterHpSection.style.display = "none";
    mainTitleText.classList = "";;
    mainTitleText.innerText = "";
    secondaryTitle.style.display = "none";
    
    if (narrationsModified[getElementFromKeyword(currentNarration, narrationsModified)].text.length > currentNarrationIndex) {    
        mainText.innerText = narrationsModified[getElementFromKeyword(currentNarration, narrationsModified)].text[currentNarrationIndex];
    }
    else
        console.error("displayNarrative - Narration index [" + currentNarrationIndex + "] is higher than text length [" + narrationsModified[getElementFromKeyword(currentNarration, narrationsModified)].text.length + "]");
}

function continueNarration() {

    if (showDebugLog) console.log("continueNarration() - ");

    currentNarrationIndex++;
    if (narrationsModified[getElementFromKeyword(currentNarration, narrationsModified)].text.length > currentNarrationIndex)
        mainText.innerText = narrationsModified[getElementFromKeyword(currentNarration, narrationsModified)].text[currentNarrationIndex];
    else {
        narrationsModified[getElementFromKeyword(currentNarration, narrationsModified)].seen = true;
        closeNarration();
    }
}

function closeNarration() {

    narrationOpen = false;
    changeContextDirect(currentContext, currentContextType);
}

function displayTitle() {
    
    if (showDebugLog) console.log("displayTitle() - ");
    
    titleOpen = true;
    updateButtons();

    areasVisited += locationsModified[currentContext].area;
    let contextKeyword = locationsModified[currentContext].area + "_title";        

    saleTitle.style.display = "none";
    narrationText.style.display = "none";    
    monsterHpSection.style.display = "none";
    mainTitle.classList = "centered";
    mainTitleText.classList = "";
    mainTitleText.innerText = locationsModified[getContextIndexFromKeyword(contextKeyword, 1)].title;
    secondaryTitle.style.display = "none";        
    mainText.innerText = locationsModified[getContextIndexFromKeyword(contextKeyword, 1)].description;
}

function closeTitle() {

    titleOpen = false;
    changeContextDirect(currentContext, currentContextType);
}

function displayInventory() {
    
    if (showDebugLog) console.log("displayInventory() - ");

    inventoryOpen = true;

    inventoryIcon.classList = "close-inventory";    
    inventoryIcon.onclick = function() { exitInventory(); playClick(); };

    expandStats();    
    updateButtons();

    narrationText.style.display = "none";    
    monsterHpSection.style.display = "none";
    mainTitleText.classList = "";
    secondaryTitle.style.display = "none";

    mainTitleText.innerText = "Traveler";        
    mainText.innerText = "A worn traveler come from a foreign land. Stricken by a mysterious curse. Unable to resist the call.";

    inventoryTitle.style.display = "block";
    equipmentTitle.style.display = "block";
    saleTitle.style.display = "none";
}

function exitInventory() {

    if (showDebugLog) console.log("exitInventory() - ");

    inventoryOpen = false;

    clearInventory();
    changeContextDirect(currentContext, currentContextType);
    if (upgradeMenuOpen)
        displayUpgrade();
    if (narrationOpen)
        displayNarration();
}

function clearInventory() {

    inventoryIcon.classList = "open-inventory";
    inventoryIcon.onclick = function() { displayInventory(); playClick(); };        

    expandStats();

    inventoryTitle.style.display = "none";
    equipmentTitle.style.display = "none";
}

function displayUpgrade() {

    upgradeMenuOpen = true;
    updateButtons();
    expandStats();

    narrationText.style.display = "none";    
    monsterHpSection.style.display = "none";        
         
    mainText.innerText = "Not all weapons can become the stuff of legends, but given the right materials any weapon might become functional.";

    saleTitle.style.display = "none";
}

function exitUpgrade() {

    upgradeMenuOpen = false;
    changeContextDirect(currentContext, currentContextType);
}

function inventoryIndexOf(keyword) {

    let i = -1;
    inventory.forEach((element,index) => {
        
        if (element === keyword) {            
            i = index;
        }
    });

    return i;
}

function displayTrain() {

    if (showDebugLog) console.log("displayTrain() - ");        
    narrationText.style.display = "none";
    updateText.style.display = "none";
    monsterHpSection.style.display = "none";
    mainTitleText.classList = "";
    secondaryTitle.style.display = "none";    
    mainTitleText.innerText = "Seek Guidance";
    mainText.innerText = "You close your eyes and kneel. You feel the earth below and breathe deep the air.";
    
    expandStats();

    trainMenuOpen = true;

    updateButtons();
}

function train(trainType, cost) {

    switch (trainType) {        
        case "hp":
            insight -= cost;
            hpMax += 5;
            hpCurrent += 5;
            break;        
        case "stamina":
            insight -= cost;
            baseStamina += 1;
            break;        
        case "curse":
            insight -= cost;

            let curseMarkIndex = getContextIndexFromKeyword("curse_mark", 4);
            itemsModified[curseMarkIndex].power += 5;
            break;        
    }

    updateStats();
    save();
    displayTrain();
}

// Update the header with current stat values
function updateStats() {
    
    calculateStats();

    insightText.innerText = insight;
    hpText.innerText = hpCurrent + " / " + hpMax;
    goldText.innerText = gold;

    powerText.innerText = power;
    staminaText.innerText = currentStamina + " / " + maxStamina;
    defenceText.innerText = defence;
}

function expandStats() {

    powerStat.style.display = "flex";
    goldStat.style.display = "flex";
    defenceStat.style.display = "flex";
}

function collapseStats() {

    powerStat.style.display = "none";
    goldStat.style.display = "none";
    defenceStat.style.display = "none";
}

// Calculates stats that are based on multiple factors
function calculateStats() {

    power = basePower;
    maxStamina = baseStamina;
    defence = baseDefence;
    evasion = baseEvasion;

    inventory.forEach((element) => {
        
        let index = getContextIndexFromKeyword(element, 4);

        if (itemsModified[index].equipped) {
            power += itemsModified[index].power;
            maxStamina += itemsModified[index].stamina;
            defence += itemsModified[index].defence;
        }
    });
}

function updateMonsterUI() {

    monsterHpText.innerText = monstersModified[currentContext].hpCurrent + "/" + monstersModified[currentContext].hpMax;
    let monsterHpCurrentPercent = monstersModified[currentContext].hpCurrent / monstersModified[currentContext].hpMax * 100;
    // The width of our hp bar is the current hp percentage * 2 because the total width of the bar is 200    
    monsterHpBar.style.width = (monsterHpCurrentPercent * 2 + 1) + 'px';
}

function resetUpdateText() {

    updateText.innerText = "";
    updateText.style.display = "none";
}

function addUpdateText(text) {

    if (updateText.innerText.split(/\r\n|\r|\n/).length > 5) resetUpdateText(); 

    updateText.style.display = "block";
    if (updateText.innerText != "") updateText.innerText += "\n";
    updateText.innerText += text;
}

function removeItemFromContext(keyword, context) {
    console.log("remove item " +keyword);
    locationsModified[context].items = locationsModified[context].items.filter(item => item !== keyword);    
    
    save();

    if (context === currentContext)
        updateButtons();
}

// #endregion

// #region ACTIONS

// Translate a string provided in through the context data into an action
function doAction(actionString, resetText) {
    
    if (resetText)
        resetUpdateText();

    if (actionString === undefined) {
        console.error("doAction() - actionString is undefined");
        return;
    }

    let functionString = actionString;
    let functionArray = [];

    if (actionString.indexOf('|') > -1) {

        // Action string can contain the function name, followed by arguments    
        functionArray = actionString.split("|");
        functionString = functionArray[0];
    }
    
    if (showDebugLog) console.log("doAction() - functionString: " + functionString);

    switch (functionString) {
        case "attack":
            if (functionArray.length === 2)     // attack|staminaCost
                attack(parseInt(functionArray[1]));
            else
                console.error("doAction - Called attack without an additional argument");        
            break;
        case "upgrade":
            displayUpgrade();
            break;
        case "exitUpgrade":
            exitUpgrade();
            break;
        case "recover":
            recover();
            break;
        case "returnToPrimaryContext":
            returnToPrimaryContext();
            break;
        case "talk":
            talk();
            break;
        case "train":
            displayTrain();
            break;
        case "rest":
            rest();
            break;
        case "runAway":
            runAway();
            break;
        case "continueNarration":
            continueNarration();
            break;
        case "closeTitle":
            closeTitle();
            break;
        case "advanceDialogue":
            if (functionArray.length === 2)         // advanceDialogue|npcKeyword
                advanceDialogue(functionArray[1]);
            else
                console.error("doAction - Called advanceDialogue without an additional argument");
            break;
        case "goToNPC":
            if (functionArray.length === 2)     // goToNPC|npcKeyword
                changeContext(functionArray[1], 5);                
            else
                console.error("doAction - Called goToNPC without an additional argument");
            break;
        case "addAction":   // addAction() context (keyword or index), contextType, action, index
            if (functionArray.length === 5) {
                
                addActionToContext(functionArray[1],parseInt(functionArray[2]),JSON.parse(functionArray[3]),parseInt(functionArray[4]));
            }
            else
                console.error("doAction - Called addAction without the correct number of arguments");
            break;
        case "removeAction":  // removeAction() context(keyword or index), contextType, index        
            if (functionArray.length === 4)

                removeActionFromContext(functionArray[1],parseInt(functionArray[2]),parseInt(functionArray[3]));
            else
                console.error("doAction - Called addAction without the correct number of arguments");
            break;
        case "replaceAction":   // replaceAction() context(keyword or index), contextType, action, index
            if (functionArray.length === 5)

                replaceAction(functionArray[1],parseInt(functionArray[2]),JSON.parse(functionArray[3]),parseInt(functionArray[4]));
            else
                console.error("doAction - Called addAction without the correct number of arguments");
            break;
        case "addGold":  
            if (functionArray.length === 3) // addGold|amount|updateString
                
                addGold(parseInt(functionArray[1]),functionArray[2]);                            
            else
                console.error("doAction - Called addGold without the correct number of arguments");
            break;
        case "getCorpse":  
            if (functionArray.length === 3) // addGold|amount|updateString
                
                getCorpse(parseInt(functionArray[1]),functionArray[2]);                            
            else
                console.error("doAction - Called addGold without the correct number of arguments");
            break;
        case "addInsight":  
            if (functionArray.length === 3) // addInsight|amount|updateString
                
                addInsight(parseInt(functionArray[1]),functionArray[2]);                            
            else
                console.error("doAction - Called addGold without the correct number of arguments");
            break;
        case "buy":  
            if (functionArray.length === 3) // buy|item keyword
                                
                buy(functionArray[1],parseInt(functionArray[2]));            
            else
                console.error("doAction - Called buy without the correct number of arguments");
            break;
        case "consoleLog":  // For debug
            console.log("!!!");
            break;
    }
}

function playerActionComplete() {

    if (showDebugLog) console.log("playerActionComplete() - ");
          
    let monsters = [];

    // If current context is a location, search it's actions for monsters and tell them to attack
    if (currentContextType === 1)
        monsters = locationsModified[currentContext].monsters;
    // If we're already fighting a monster, use the stored location to search for monsters
    else if (currentContextType === 3)
        monsters = locationsModified[storedLocation].monsters;

    let playerDead = false;
    if (monsters.length > 0 && monsters != "") {

        monsters.forEach((element, index) => {

            playerDead = triggerEnemyAttack(element);
        });            
    }    

    if (playerDead) return;

    recoverMax(false);
    updateStats();
    save();        
    updateButtons();    
}

function triggerEnemyAttack(monsterKeyword) {

    let monstersActionString = "";  
    let monster = monstersModified[getElementFromKeyword(monsterKeyword, monstersModified)];

    // Evasion chance
    let evasionNumber = Math.floor(Math.random() * 101);                

    if (evasionNumber <= evasion) {

        monstersActionString +=  "You evade the " + monster.shortTitle + "'s attack."                    
    }
    else {      

        let monsterDamage = Math.max(0, monster.power - defence);        
        hpCurrent -= monsterDamage;
        if (monstersActionString != "") monstersActionString += "\n";
        monstersActionString += "The " + monster.shortTitle + " does " + monsterDamage + " damage to you.";
    }

    if (monstersActionString != "") addUpdateText(monstersActionString);

    if (hpCurrent <= 0)
        playerDeath();
}

function recoverStamina() {

    let monstersPresent = false;
    let monsters = [];

    // If current context is a location, search it's actions for monsters and tell them to attack
    if (currentContextType === 1)
        monsters = locationsModified[currentContext].monsters;
    // If we're already fighting a monster, use the stored location to search for monsters
    else if (currentContextType === 3)
        monsters = locationsModified[storedLocation].monsters;
    
    if (monsters.length > 0 && monsters != "") 
        monstersPresent = true;

    if (!monstersPresent)
        recoverMax(false);
}

function spendStamina(cost) {

    if (currentStamina >= cost)
        currentStamina -= cost;
    else {
        console.error("spendStamina - Cost [" + cost + "] is greater than currentStamina [" + currentStamina + "]");
        return;
    }

    updateStats();
    save();

    if (currentStamina === 0) {

        playerActionComplete(true);
    }    
}

function playerDeath() {

    let updateTextStore = updateText.innerText;
    if (inventoryOpen) {
        clearInventory();
        updateText.innerText = updateTextStore;
    }
    
    // Check if a player corpse exists already, if so destroy it
    if (corpseLocation != -1 && locationsModified[corpseLocation].items.includes("corpse")) {

        removeItemFromContext("corpse", corpseLocation);
    }

    // We are going to create a corpse in the primary location where we are currently
    // Check if we're fighting a monster, in which case we use the stored location instead of current context
    let actualContext = currentContext;
    if (currentContextType === 3)
        actualContext = storedLocation;

    let funcString = "getCorpse|" + gold + "|You recover what gold you can from the corpse"
    // Set the quantity of the corpse item to the amount of gold we are holding
    itemsModified[getContextIndexFromKeyword("corpse", 4)].quantity = gold;
    // Remove all our gold
    gold = 0;
    updateStats();

    corpseLocation = actualContext;    
    locationsModified[corpseLocation].items.push("corpse");

    narrationText.style.display = "none";    
    monsterHpSection.style.display = "none";
    mainTitleText.classList = "";
    secondaryTitle.style.display = "none";    
    mainTitleText.innerText = "";        
    mainText.innerText = "";
    updateText.innerText += "\n\nLife leaves your body as it's torn apart.";
    
    // We're going to create a special button to respawn
    clearCreatedButtons();  // Remove all buttons
    const newButton = createButton();
    createdButtons.push(newButton.button);    
    newButton.button.classList = "nav-button action-button can-hover";                
    newButton.buttonText.innerText = "Awaken";                    
    document.querySelector("nav").insertBefore(newButton.button, buttonMaster);                                                                
    newButton.button.onclick = function() { respawn();};        
    currentContext = -99;   // Save 'dead' state
    save();
}

function respawn() {    

    if (respawnLocation != {}) {

        hpCurrent = hpMax;
        currentStamina = maxStamina;

        // Monsters all heal when you rest
        monstersModified.forEach((element) => {
            element.hpCurrent = element.hpMax;
        });

        updateStats();
        storedLocation = respawnLocation.storedLocation;
        changeContextDirect(respawnLocation.context, respawnLocation.contextType); 
        save();

        if (!(respawnLocation.context === 0 && respawnLocation.contextType === 1))
            addUpdateText("You wake soaked in sweat and trembling. The terrors of the foglands haunting your mind.");
    }
    else
        console.error("respawn() - Trying to respawn with an empty respawnLocation");
}

function attack(staminaCost) {

    if (showDebugLog) console.log("attack() - Attack Power: " + power + "   Stamina Cost: " + staminaCost);         // Unhelpful console log imo
        
    let monster = monstersModified[currentContext];
    
    // Evasion chance
    let evasionNumber = Math.floor(Math.random() * 101);
    if (showDebugLog) console.log("Monster evasion - " + monster.evasion + "  evade number: " + evasionNumber);

    if (evasionNumber <= monster.evasion) {

        let updateString = "The " + monster.shortTitle + " evades your attack."
        addUpdateText(updateString); 
    }
    else {            

        // PLAYER ATTACK
        monster.hpCurrent -= power;
        updateMonsterUI();
            
        let updateString = "You do " + power + " damage to the " + monster.shortTitle + "."
        addUpdateText(updateString);  

        // CHECK FOR MONSTER DEATH
        if (monster.hpCurrent <= 0) {

            monsterDeath();
        }
    }

    spendStamina(staminaCost);    
}

function block(staminaCost) {

    if (showDebugLog) console.log("block() - Defence: " + defence + "   Stamina Cost: " + staminaCost);         // Unhelpful console log imo
                
    let monster = monstersModified[currentContext];
    
    console.log("BLOCK NOT IMPLEMENTED");
    
    spendStamina(staminaCost);
}

function recover() {

    // let maxRecoverAmount = 3;
    // let recoverAmount = maxRecoverAmount;
    
    // if ((maxStamina - currentStamina) < maxRecoverAmount)
    //     recoverAmount = maxStamina - currentStamina;
    
    // currentStamina += recoverAmount; 
    // if (currentStamina >= maxStamina) currentStamina = maxStamina;
    // playerActionComplete(true);
    // updateStats();
    // save();

    // let updateString = "You recover " + recoverAmount + " stamina."
    // addUpdateText(updateString);
}

function recoverMax(isPlayerAction) {

    if (currentStamina != maxStamina) {
        currentStamina = maxStamina;
        if (isPlayerAction) playerActionComplete(true);
        updateStats();
        save();

        // let updateString = "You recover your stamina."
        // addUpdateText(updateString);
    }
}

function runAway() {
    
    let monster = monstersModified[currentContext].keyword;

    spendStamina(1);
    returnToPrimaryContext();    
    triggerEnemyAttack(monster);
}

function monsterDeath() {
    
    let monsterIndex = locationsModified[storedLocation].monsters.indexOf(monstersModified[currentContext].keyword);
    locationsModified[storedLocation].monsters.splice(monsterIndex,1);

    let storedMonsterString = "The " + monstersModified[currentContext].shortTitle + " falls dead at your feet\nYou receive " + monstersModified[currentContext].insight + " insight and " +  monstersModified[currentContext].gold + " gold";

    insight += monstersModified[currentContext].insight;
    gold += monstersModified[currentContext].gold;
    updateStats();
        
    if (monstersModified[currentContext].deathFunc != null) {
        doAction(monstersModified[currentContext].deathFunc, true);
    }
    
    // If there are no other monsters here, we should recover our stamina
    recoverStamina();

    save();

    returnToPrimaryContext();
    addUpdateText(storedMonsterString);
}

function dodge() {
    if (showDebugLog) console.log("didge() - ");    
    spendStamina(1);
}

// This is used specifically to return to the context, but isn't counted as a player action itself, so if a function call this that is a player action, it should call playerActionCompleted itself, like runAway
function returnToPrimaryContext() {

    if (showDebugLog) console.log("returnToPrimaryContext() - ");
    currentContext = storedLocation;
    storedLocation = -1;
    currentContextType = 1;

    save();
    updateContext();    
}

function talk() {

    if (currentContextType == 5) {

        let dialogueString = npcsModified[currentContext].keyword + "_" + npcsModified[currentContext].currentDialogue;
        
        displayNarration(dialogueString);
        npcsModified[currentContext].dialogueAvailable = false;
    }
    else
        console.error("talk - Somehow this was called but the current context is not an NPC")
}

function rest() {

    if (showDebugLog) console.log("rest() - ");

    hpCurrent = hpMax;
    addUpdateText("You kneel for a moment and say a prayer to the Quiet. You feel your soul anchored to this place.\n\nYou lay down on your bedroll and before you know it sleep takes you.");

    // Monsters all heal when you rest
    monstersModified.forEach((element) => {
        element.hpCurrent = element.hpMax;
    });

    respawnLocation = {
        context: currentContext,
        contextType: currentContextType,
        storedLocation: storedLocation
    }

    save();
    updateStats();
}

function advanceDialogue(npcName) {
    
    npcsModified.forEach((element, index) => {

        if (element.keyword == npcName) {
            element.currentDialogue++;

            if (element.dialogue.length > element.currentDialogue) {
                element.dialogueAvailable = true;
            }
        }
    });
}

function addToInventory(keyword) {
    
    if (keyword === "") {

        if (showDebugLog) console.log("addToInventory() - keyword is empty");
        return;
    }

    let item = itemsModified[getContextIndexFromKeyword(keyword, 4)];
    if (item === undefined) {
        console.error("addToInventory() - keyword:" + keyword + " not found in items array");
        return;
    }

    inventory.push(keyword);
    
    let actions = [];
    let items = [];

    // Depending on the contextType, we will splice this item out of a different context
    if (currentContextType === 1) {        
        items = locationsModified[currentContext].items;
    }    
    else if (currentContextType === 5) {        
        items = npcsModified[currentContext].items;
    }
    
    // Find and remove the item from the item list that it was contained in
    let itemIndex = -1;
    items.forEach((element, index) => {

        if (element === keyword) {
            itemIndex = index;
        }
    });
    if (itemIndex != -1) items.splice(itemIndex, 1);

    updateButtons();

    save();
    addUpdateText("The " + item.shortTitle + " has been added to your inventory.");
    spendStamina(1);
}

function buy(keyword, cost) {

    let item = itemsModified[getContextIndexFromKeyword(keyword, 4)];
    if (item === undefined) {
        console.error("buy() - keyword:" + keyword + " not found in items array");
        return;
    }

    if (gold >= cost) {

        gold -= cost;
        addUpdateText("You purchased the " + item.shortTitle + ".");
        addToInventory(keyword);
        updateStats();        
    }
    else
        console.error("buy() - cost greater than gold");
}

function upgrade(keyword, cost, oreCost, leatherCost) {

    let item = itemsModified[getContextIndexFromKeyword(keyword, 4)];
    if (item === undefined) {
        console.error("upgrade() - keyword:" + keyword + " not found in items array");
        return;
    }

    if (gold >= cost && ore > oreCost && leather > leatherCost) {

        gold -= cost;
        ore -= oreCost;
        leather -= leatherCost;
        addUpdateText("You upgrade the " + item.shortTitle + ".");
        item.level += 1;

        if (item.itemType === "weapon")
            item.power += 5;
        if (item.itemType === "armor")
            item.defence += 10;
        if (item.itemType === "shield")
            item.defence += 5;

        updateStats();
        updateButtons();
    }
    else
        console.error("upgrade() - cost greater than gold");
}

function addGold(amount, updateString) {
    
    gold += amount;
    if (updateString != "") 
        addUpdateText(updateString + " ( " + amount + " gold )");    

    updateStats();
    save();
    spendStamina(1);
}

function getCorpse(amount, updateString) {
    
    gold += amount;
    if (updateString != "") 
        addUpdateText(updateString + " ( " + amount + " gold )");    

    removeItemFromContext("corpse", currentContext);
    corpseLocation = -1;

    updateStats();
    save();
    spendStamina(1);
}

function addInsight(amount, updateString) {

    insight += amount;
    if (updateString != "") 
        addUpdateText(updateString + " ( " + amount + " insight )");    

    updateStats();
    save();
    spendStamina(1);
}

function addHealth(amount, updateString) {

    hpCurrent += amount;
    if (hpCurrent > hpMax)
        hpCurrent = hpMax;
    if (updateString != "") 
        addUpdateText(updateString + " ( " + amount + " health )");    

    updateStats();
    save();
    spendStamina(1);
}

function addGreenHerb(amount, updateString) {

    greenHerb += amount;

    if (updateString != "") 
        addUpdateText(updateString + " ( " + amount + " Green Herb )");    

    updateStats();
    save();
    spendStamina(1);
}

function toggleEquipped(keyword) {
    
    // Double check to make sure this is in our inventory
    if (inventoryIndexOf(keyword) != -1) {

        let item = itemsModified[getContextIndexFromKeyword(keyword,4)];
        
        if (item.equipped) {

            item.equipped = false;
            addUpdateText("You put away the " + item.shortTitle);            
        }
        else {
            item.equipped = true;
            addUpdateText("You equip the " + item.shortTitle);            
        }
        
        updateStats();
        save();
        spendStamina(1);
    }
    else
        console.error("toggleEquipped() - Inventory doesn't contain [" + keyword + "]");
}

// #endregion

// #region UTILITIES

function save() {

    if (showDebugLog) console.log("save");
    localStorage.setItem('saveExists', "!");        // Used to test whether there is a save
    localStorage.setItem('version', JSON.stringify(version));
    localStorage.setItem('currentLocation', JSON.stringify(currentContext));
    localStorage.setItem('storedLocation', JSON.stringify(storedLocation));
    localStorage.setItem('currentLocationType', JSON.stringify(currentContextType));
    localStorage.setItem('locationsVisited', JSON.stringify(locationsVisited));    
    localStorage.setItem('areasVisited', JSON.stringify(areasVisited));    
    localStorage.setItem('insight', JSON.stringify(insight));
    localStorage.setItem('hpCurrent', JSON.stringify(hpCurrent));
    localStorage.setItem('hpMax', JSON.stringify(hpMax));
    localStorage.setItem('maxStamina', JSON.stringify(maxStamina));
    localStorage.setItem('currentStamina', JSON.stringify(currentStamina));
    localStorage.setItem('gold', JSON.stringify(gold));
    localStorage.setItem('ore', JSON.stringify(ore));
    localStorage.setItem('leather', JSON.stringify(leather));
    localStorage.setItem('greenHerb', JSON.stringify(greenHerb));
    localStorage.setItem('basePower', JSON.stringify(basePower));
    localStorage.setItem('baseStamina', JSON.stringify(baseStamina));
    localStorage.setItem('baseDefence', JSON.stringify(baseDefence));    
    localStorage.setItem('baseEvasion', JSON.stringify(baseEvasion));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('respawnLocation', JSON.stringify(respawnLocation));
    localStorage.setItem('corpseLocation', JSON.stringify(corpseLocation));

    localStorage.setItem('locationsModified', JSON.stringify(locationsModified));
    localStorage.setItem('monstersModified', JSON.stringify(monstersModified));
    localStorage.setItem('npcsModified', JSON.stringify(npcsModified));
    localStorage.setItem('itemsModified', JSON.stringify(itemsModified));
    localStorage.setItem('narrationsModified', JSON.stringify(narrationsModified));    
  }
  
  function load() {

    if (showDebugLog) console.log("Load");

    currentContext = JSON.parse(localStorage.getItem('currentLocation'));
    storedLocation = JSON.parse(localStorage.getItem('storedLocation'));       
    currentContextType = JSON.parse(localStorage.getItem('currentLocationType'));
    locationsVisited = JSON.parse(localStorage.getItem('locationsVisited')); 
    areasVisited = JSON.parse(localStorage.getItem('areasVisited'));    
    insight = JSON.parse(localStorage.getItem('insight'));
    hpCurrent = JSON.parse(localStorage.getItem('hpCurrent'));
    maxStamina = JSON.parse(localStorage.getItem('maxStamina'));
    currentStamina = JSON.parse(localStorage.getItem('currentStamina'));
    hpMax = JSON.parse(localStorage.getItem('hpMax'));
    gold = JSON.parse(localStorage.getItem('gold'));
    ore = JSON.parse(localStorage.getItem('ore'));
    greenHerb = JSON.parse(localStorage.getItem('greenHerb'));
    leather = JSON.parse(localStorage.getItem('leather'));
    basePower = JSON.parse(localStorage.getItem('basePower'));
    baseStamina = JSON.parse(localStorage.getItem('baseStamina'));
    baseDefence = JSON.parse(localStorage.getItem('baseDefence'));
    inventory = JSON.parse(localStorage.getItem('inventory'));
    respawnLocation = JSON.parse(localStorage.getItem('respawnLocation'))
    corpseLocation = JSON.parse(localStorage.getItem('corpseLocation'))

    if (!resetLocations) { 
        
        locationsModified = JSON.parse(localStorage.getItem('locationsModified'));       
        monstersModified = JSON.parse(localStorage.getItem('monstersModified'));
        npcsModified = JSON.parse(localStorage.getItem('npcsModified'));
        itemsModified = JSON.parse(localStorage.getItem('itemsModified'));
        narrationsModified = JSON.parse(localStorage.getItem('narrationsModified'));
    }
    else {
        locationsModified = JSON.parse(JSON.stringify(locations));        
        locationsVisited = [];
        monstersModified = JSON.parse(JSON.stringify(monsters));                
        npcsModified = JSON.parse(JSON.stringify(npcs));
        itemsModified = JSON.parse(JSON.stringify(items));
        narrationsModified = JSON.parse(JSON.stringify(narrations));
    }
  }

  function versionCheck() {
    
    let saveVersion = JSON.parse(localStorage.getItem('version'));
    if (showDebugLog) console.log("Current version: " + version + "    Save Version: " + saveVersion);
    return version === saveVersion;
  }

  function resetGame() {

    localStorage.clear();
    clearInventory();
    initializeGame();
  }

  // Get a specific action within a given context
  // i.e. I want to find the "Leave" action within "dark_grotto"
  function getActionIndexFromKeyword(keyword, context, contextType) {
    
    ar = [];
    switch (contextType) {
        case 1://Location
            ar = locationsModified[context].actions;
            break;
        case 3://Monster
        ar = monstersModified[context].actions;
            break;
        case 4://Item
        ar = itemsModified[context].actions;
            break;
        case 5://NPC
        ar = npcsModified[context].actions;
            break;
    }

    let index = -1;
    ar.forEach((element, i) => {        
        if (element.keyword === keyword) {
            
            index = i;            
        }
    });

    if (index === -1) console.error("getActionIndexFromKeyword() - Failed to find keyword [" + keyword + "] in context [" + context + "] of context type [" + contextType + "]");
    return index;
  }

  // Get a specific context of the given type.
  // i.e. I want to find a location named "keyword"
  function getContextIndexFromKeyword(keyword, contextType) {
    
    ar = [];
    let cType = ""
    switch (contextType) {
        case 1://Location
        
            ar = locationsModified;
            cType = "locations";
            break;
        case 3://Monster
            ar = monstersModified;
            cType = "monsters";
            break;
        case 4://Item
            ar = itemsModified;
            cType = "items";
            break;
        case 5://NPC
            ar = npcsModified;
            cType = "npcs";
            break;
    }
    
    let index = -1;
    
    ar.forEach((element, i) => {        
        if (element.keyword === keyword) {
            
            index = i;            
        }
    });
    
    if (index === -1) console.error("getContextIndexFromkeyword() - Failed to find keyword [" + keyword + "] of context type [" + cType + "]");
    return index;
  }

  function getElementFromKeyword(keyword, array) {
    
    if (array === undefined || array === null) console.error("getElementFromKeyword() - keyword [" + keyword + "] No array provided");

    let index = -1;
    
    array.forEach((element, i) => {        
        if (element.keyword === keyword) {
            
            index = i;            
        }
    });
    
    if (index === -1) console.error("getElementFromKeyword() - Failed to find keyword [" + keyword + "] in array: " + array);
    return index;
  }

  // Create an array of actions based on the currently equipped items in the player's inventory
  function generateItemActions(monsterActions) {

    let array = [];        
    inventory.forEach((element,index) => {
        
        let item = itemsModified[getContextIndexFromKeyword(element,4)];
        if (item.canEquip && item.equipped) {
            
            if (item.actions.length > 0) {
                
                item.actions.forEach((element, index) => {
                        
                    array.push(actions[getElementFromKeyword(element, actions)]);            
                });            
            }
        }
    });

    // Add monster specific actions
    // monsterActions.forEach((element,index) => {        
    //     array.push(element);
    // });
    
    arralocation: "",y.push({type: 6, title: "Recover", 
        func: "recover"});

    arralocation: "",y.push({type: 6, title: "Run away", 
        func: "runAway"});

    return array;
  }

  function playClick() {
    
    let audioClipIndex = Math.floor(Math.random() * 5);
    let audioClip = '';
    switch (audioClipIndex) {
        case 0:
            audioClip = 'Audio/clicks/Click_1.wav';
            break;
        case 1:
            audioClip = 'Audio/clicks/Click_2.wav';
            break;
        case 2:
            audioClip = 'Audio/clicks/Click_3.wav';
            break;
        case 3:
            audioClip = 'Audio/clicks/Click_4.wav';
            break;
        case 4:
            audioClip = 'Audio/clicks/Click_5.wav';
            break;
    }

    var audio = new Audio(audioClip);
    audio.play();      
  }

  function formatData() {    
    
    if (showDebugLog) console.log("formatData() - ");

    locationsModified = JSON.parse(JSON.stringify(locations));
    npcsModified = JSON.parse(JSON.stringify(npcs));
    monstersModified = JSON.parse(JSON.stringify(monsters));
    narrationsModified = JSON.parse(JSON.stringify(narrations));

    itemsModified = JSON.parse(JSON.stringify(items));

    itemsModified.forEach((element,index) => {
        
        element.upgradeMaterial != null ? element.upgradeMaterial = element.upgradeMaterial.split(',') : element.upgradeMaterial = [];
        element.actions != null ? element.actions = element.actions.split(',') : element.actions = [];        
    }); 
  }

  // #endregion