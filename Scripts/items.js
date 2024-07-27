items = [
    {
        keyword: "strange_stone",
        title: "A strangely shaped stone",
        shortTitle: "stone",
        canEquip: false,
        equipped: false,
        power: 0,
        stamina: 0,
        evasion: 0,        
        actions: [          // Item actions will be added while in a monster sub-context           
        ],
    },
    {
        keyword: "straight_sword",
        title: "An old Rhenish straight sword",
        shortTitle: "sword",
        canEquip: true,
        equipped: false,
        power: 10,
        stamina: 0,
        evasion: 3,        
        actions: [          // Item actions will be added while in a monster sub-context
            {                
                type: 6,
                title: "Attack with piercing strike",
                func: "attack"
            }            
        ],
    },    
    {
        keyword: "silver_locket",
        title: "A simple silver locket",
        shortTitle: "locket",
        canEquip: true,
        equipped: false,
        power: 0,
        stamina: 10,
        evasion: 0,        
        actions: [          // Item actions will be added while in a monster sub-context            
        ],
    },    
    {
        keyword: "worn_shield",
        title: "A battered wooden shield.",
        shortTitle: "shield",
        canEquip: true,
        equipped: false,
        power: 0,
        stamina: 0,
        evasion: 5,        
        actions: [          // Item actions will be added while in a monster sub-context
            {                
                type: 6,
                title: "Block with your shield",
                func: "block"
            }   
        ],
    },    
    {
        keyword: "key",
        title: "A simple brass key",
        shortTitle: "key",
        canEquip: false,
        equipped: false,
        power: 0,
        stamina: 0,
        evasion: 0,        
        actions: [          // Item actions will be added while in a monster sub-context            
        ],
    }    
];