/* ============================================
   Warrior Cats: The Rise of Scourge
   Game Logic - Story, Dialogue, Characters
   ============================================ */

// Story chapters based on the manga
const CHAPTERS = [
  {
    id: 1,
    title: "The Beginning",
    location: "Twoleg House",
    description: "Tiny lives with his littermates in a warm Twoleg house..."
  },
  {
    id: 2,
    title: "The Unwanted",
    location: "Twoleg House",
    description: "Socks and Ruby tell Tiny a terrible secret about unwanted kittens..."
  },
  {
    id: 3,
    title: "Into the Forest",
    location: "The Forest Edge",
    description: "Tiny runs away to prove himself in the wild forest..."
  },
  {
    id: 4,
    title: "The Attack",
    location: "ThunderClan Territory",
    description: "A fearsome apprentice attacks without mercy..."
  },
  {
    id: 5,
    title: "Bluefur's Warning",
    location: "ThunderClan Territory", 
    description: "A blue-gray she-cat stops the attack but offers no comfort..."
  },
  {
    id: 6,
    title: "Return to Twolegplace",
    location: "Twolegplace",
    description: "Tiny returns, scarred and changed forever..."
  },
  {
    id: 7,
    title: "Becoming Scourge",
    location: "Twolegplace Alleys",
    description: "The small kit becomes something much darker..."
  },
  {
    id: 8,
    title: "Leader of BloodClan",
    location: "BloodClan Territory",
    description: "Scourge rises to lead the most feared cats in the city..."
  }
];

// Characters in the story
const CHARACTERS = {
  tiny: {
    name: "Tiny",
    color: "#1a1a1a",
    eyeColor: "#87CEEB",
    description: "A small black kit with one white paw and ice-blue eyes",
    hasWhitePaw: true
  },
  socks: {
    name: "Socks",
    color: "#2a2a2a",
    eyeColor: "#FFD700",
    markings: "white paws",
    description: "Tiny's brother - gray with white paws, mean and confident",
    personality: "bully"
  },
  ruby: {
    name: "Ruby",
    color: "#8B4513",
    eyeColor: "#90EE90",
    description: "Tiny's sister - brown tabby, follows Socks' lead",
    personality: "follower"
  },
  tigerpaw: {
    name: "Tigerpaw",
    color: "#8B4513",
    eyeColor: "#FFD700",
    markings: "dark tabby stripes",
    description: "A massive dark tabby apprentice with amber eyes full of hatred",
    personality: "aggressive"
  },
  bluefur: {
    name: "Bluefur",
    color: "#4682B4",
    eyeColor: "#87CEEB",
    description: "A blue-gray she-cat with piercing blue eyes",
    personality: "stern"
  },
  quince: {
    name: "Quince",
    color: "#F5DEB3",
    eyeColor: "#90EE90",
    description: "Tiny's mother - a loving cream-colored she-cat",
    personality: "loving"
  },
  bone: {
    name: "Bone",
    color: "#f5f5f5",
    eyeColor: "#FFD700",
    description: "A large black and white cat - Scourge's second in command",
    personality: "loyal"
  },
  brick: {
    name: "Brick",
    color: "#CD853F",
    eyeColor: "#DAA520",
    description: "A tough ginger tom from the alleys",
    personality: "tough"
  }
};

// Dialogue for Chapter 1
const CHAPTER_1_DIALOGUE = {
  intro_narration: [
    "You open your eyes slowly...",
    "Warm sunlight filters through a window. You're in a cozy Twoleg house.",
    "You are Tiny - a small black kit with one white paw.",
    "Your littermates, Socks and Ruby, are nearby.",
    "This is your home... for now."
  ],
  
  socks_bully_1: {
    speaker: "socks",
    text: "Hey look, it's Tiny! The smallest kit ever born!",
    choices: [
      { text: "Ignore him", next: "socks_bully_2" },
      { text: "\"I'm not that small!\"", next: "socks_mock" },
      { text: "Walk away sadly", next: "walk_away", emotion: "sad" }
    ]
  },
  
  socks_mock: {
    speaker: "socks",
    text: "Ha! Not that small? You're the runt of the litter! Even the Twolegs think so!",
    choices: [
      { text: "\"That's not true!\"", next: "ruby_joins" },
      { text: "Stay quiet", next: "ruby_joins" }
    ]
  },
  
  socks_bully_2: {
    speaker: "socks",
    text: "What's wrong, Tiny? Too scared to talk?",
    next: "ruby_joins"
  },
  
  walk_away: {
    speaker: "narrator",
    text: "You turn away, trying not to let their words hurt you...",
    next: "ruby_joins"
  },
  
  ruby_joins: {
    speaker: "ruby",
    text: "Yeah, Tiny! Why are you so small? Were you born wrong or something?",
    choices: [
      { text: "\"Leave me alone!\"", next: "siblings_laugh" },
      { text: "Say nothing", next: "siblings_laugh", emotion: "sad" }
    ]
  },
  
  siblings_laugh: {
    speaker: "narrator",
    text: "Socks and Ruby laugh together, their eyes gleaming with cruel amusement.",
    next: "quince_appears"
  },
  
  quince_appears: {
    speaker: "quince",
    text: "Now, now, kits. Be nice to your brother. Tiny, come here, little one.",
    choices: [
      { text: "Go to your mother", next: "quince_comfort" },
      { text: "Hesitate", next: "quince_comfort" }
    ]
  },
  
  quince_comfort: {
    speaker: "quince", 
    text: "Don't listen to them, Tiny. You're special in your own way. Size doesn't matter.",
    next: "chapter_1_end"
  },
  
  chapter_1_end: {
    speaker: "narrator",
    text: "But even your mother's words can't erase the doubt growing in your heart...",
    endChapter: true,
    nextChapter: 2
  }
};

// Dialogue for Chapter 2 - The Unwanted
const CHAPTER_2_DIALOGUE = {
  intro_narration: [
    "Days pass in the Twoleg house...",
    "The Twolegs have been acting strange lately.",
    "Visitors come to look at you and your littermates.",
    "Socks and Ruby seem excited. You feel... worried."
  ],
  
  socks_secret: {
    speaker: "socks",
    text: "Hey Tiny... we heard the Twolegs talking. Want to know a secret?",
    choices: [
      { text: "\"What secret?\"", next: "ruby_scary" },
      { text: "\"I don't trust you\"", next: "socks_insist" },
      { text: "Try to walk away", next: "blocked" }
    ]
  },
  
  socks_insist: {
    speaker: "socks",
    text: "Oh, you'll want to hear this. It's about YOUR future, little Tiny.",
    next: "ruby_scary"
  },
  
  blocked: {
    speaker: "narrator",
    text: "Ruby blocks your path, a wicked grin on her face.",
    next: "ruby_scary"
  },
  
  ruby_scary: {
    speaker: "ruby",
    text: "You know what Twolegs do with kittens nobody wants? The ones that are too small?",
    choices: [
      { text: "\"What do they do?\"", next: "socks_reveals", emotion: "scared" },
      { text: "\"You're lying!\"", next: "socks_reveals" }
    ]
  },
  
  socks_reveals: {
    speaker: "socks",
    text: "They THROW them in the river! And nobody ever sees them again...",
    next: "ruby_adds"
  },
  
  ruby_adds: {
    speaker: "ruby",
    text: "The Twolegs were just looking at you, Tiny. They said you're too small to keep...",
    choices: [
      { text: "\"That can't be true!\"", next: "siblings_cruel", emotion: "scared" },
      { text: "Feel your heart racing", next: "siblings_cruel", emotion: "scared" }
    ]
  },
  
  siblings_cruel: {
    speaker: "socks",
    text: "It's true! We heard them! Enjoy your last few days, little brother...",
    next: "alone_narration"
  },
  
  alone_narration: {
    speaker: "narrator", 
    text: "Socks and Ruby walk away laughing. You're left alone with horrible thoughts swirling in your head.",
    next: "tiny_thoughts"
  },
  
  tiny_thoughts: {
    speaker: "narrator",
    text: "Are they telling the truth? Would the Twolegs really... No. You have to prove you're not weak. You have to prove you're BRAVE.",
    next: "decision"
  },
  
  decision: {
    speaker: "narrator",
    text: "Your eyes turn toward the window... toward the dark forest beyond...",
    choices: [
      { text: "\"I'll show them. I'll go into the forest!\"", next: "chapter_2_end" },
      { text: "\"Maybe if I explore outside, they'll see I'm brave...\"", next: "chapter_2_end" }
    ]
  },
  
  chapter_2_end: {
    speaker: "narrator",
    text: "Tonight... you'll prove you're no unwanted kit. Tonight, you'll prove you're a warrior.",
    endChapter: true,
    nextChapter: 3
  }
};

// Dialogue for Chapter 3 - Into the Forest
const CHAPTER_3_DIALOGUE = {
  intro_narration: [
    "The moon hangs high in the sky...",
    "You slip through the cat door while everyone sleeps.",
    "The garden is cold. The forest looms ahead - dark and mysterious.",
    "You've never been this far from home before.",
    "Your heart pounds, but you won't turn back now."
  ],
  
  forest_edge: {
    speaker: "narrator",
    text: "The trees tower above you like giants. Strange sounds fill the air. Every shadow seems alive.",
    choices: [
      { text: "Step bravely into the forest", next: "entering_forest" },
      { text: "Take a deep breath first", next: "entering_forest", emotion: "nervous" }
    ]
  },
  
  entering_forest: {
    speaker: "narrator",
    text: "The undergrowth is thick. Leaves crunch under your tiny paws. You smell... other cats?",
    next: "strange_scent"
  },
  
  strange_scent: {
    speaker: "narrator",
    text: "A strong, wild scent hits your nose. It's not like the cats from Twolegplace. These scents are... different. Dangerous.",
    choices: [
      { text: "Keep going deeper", next: "deeper_forest" },
      { text: "Look around nervously", next: "deeper_forest", emotion: "scared" }
    ]
  },
  
  deeper_forest: {
    speaker: "narrator",
    text: "Suddenly, a rustling sound! Something is moving in the bushes ahead...",
    next: "tigerpaw_appears"
  },
  
  tigerpaw_appears: {
    speaker: "narrator",
    text: "A massive shape bursts from the undergrowth! A tabby cat - bigger than any cat you've ever seen - blocks your path. His amber eyes burn with hatred.",
    next: "tigerpaw_speaks"
  },
  
  tigerpaw_speaks: {
    speaker: "tigerpaw",
    text: "KITTYPET! You dare set paw in ThunderClan territory?!",
    choices: [
      { text: "\"I-I didn't know! I'm sorry!\"", next: "tigerpaw_attacks", emotion: "scared" },
      { text: "Try to run!", next: "tigerpaw_blocks" },
      { text: "Stand your ground shakily", next: "tigerpaw_mocks" }
    ]
  },
  
  tigerpaw_mocks: {
    speaker: "tigerpaw",
    text: "Ha! Look at this pathetic scrap of fur trying to be brave! I'll teach you what happens to trespassers!",
    next: "tigerpaw_attacks"
  },
  
  tigerpaw_blocks: {
    speaker: "narrator",
    text: "The massive apprentice is too fast! He cuts off your escape, claws gleaming in the moonlight.",
    next: "tigerpaw_attacks"
  },
  
  tigerpaw_attacks: {
    speaker: "tigerpaw",
    text: "I am TIGERPAW of ThunderClan! And you will learn to FEAR that name!",
    startBattle: true,
    enemy: "tigerpaw"
  }
};

// Battle system
const BATTLE_CONFIG = {
  tigerpaw: {
    name: "Tigerpaw",
    hp: 100,
    damage: 95, // Almost one-hit KO
    description: "He's massive and terrifying. You have no chance.",
    attacks: [
      { name: "Savage Slash", damage: 95, text: "Tigerpaw's claws rake across your face!" },
      { name: "Crushing Bite", damage: 90, text: "Tigerpaw bites down hard!" },
      { name: "Powerful Swipe", damage: 85, text: "A massive paw slams into you!" }
    ],
    // This battle is meant to be lost
    onDefeat: "tigerpaw_defeats_tiny"
  }
};

// After Tigerpaw defeats Tiny
const CHAPTER_4_DIALOGUE = {
  tigerpaw_defeats_tiny: {
    speaker: "narrator",
    text: "Pain explodes across your face. Tigerpaw's claws leave deep, burning wounds. You crumple to the ground.",
    next: "tigerpaw_continues"
  },
  
  tigerpaw_continues: {
    speaker: "tigerpaw",
    text: "Pathetic! Is this the best a kittypet can do? You're not even worth killing!",
    next: "about_to_strike"
  },
  
  about_to_strike: {
    speaker: "narrator",
    text: "Tigerpaw raises his paw for another strike. His eyes show no mercy, only cruel enjoyment...",
    next: "bluefur_arrives"
  },
  
  bluefur_arrives: {
    speaker: "narrator",
    text: "\"TIGERPAW! STOP!\"",
    next: "bluefur_speaks"
  },
  
  bluefur_speaks: {
    speaker: "bluefur",
    text: "What do you think you're doing?! This is just a kit!",
    next: "tigerpaw_argues"
  },
  
  tigerpaw_argues: {
    speaker: "tigerpaw",
    text: "It's a kittypet, Bluefur! Trespassing on our territory! I was just—",
    next: "bluefur_scolds"
  },
  
  bluefur_scolds: {
    speaker: "bluefur",
    text: "You were attacking a helpless kit! Is this what ThunderClan warriors do? Go back to camp. NOW.",
    next: "tigerpaw_leaves"
  },
  
  tigerpaw_leaves: {
    speaker: "tigerpaw",
    text: "Fine. But remember this day, kittypet. Remember my face. This isn't over...",
    next: "tigerpaw_gone"
  },
  
  tigerpaw_gone: {
    speaker: "narrator",
    text: "Tigerpaw stalks away into the shadows, but his amber eyes burn into your memory.",
    next: "bluefur_warning"
  }
};

// Chapter 5 - Bluefur's Warning  
const CHAPTER_5_DIALOGUE = {
  bluefur_warning: {
    speaker: "bluefur",
    text: "You. Kit. Can you stand?",
    choices: [
      { text: "Try to stand shakily", next: "barely_standing" },
      { text: "Whimper in pain", next: "barely_standing", emotion: "sad" }
    ]
  },
  
  barely_standing: {
    speaker: "narrator",
    text: "Every muscle screams in pain. Blood drips from the wounds on your face. But somehow, you stand.",
    next: "bluefur_cold"
  },
  
  bluefur_cold: {
    speaker: "bluefur",
    text: "Listen carefully, kit. You do not belong here. This forest belongs to the Clans.",
    choices: [
      { text: "\"But I just wanted—\"", next: "bluefur_interrupts" },
      { text: "Stay silent", next: "bluefur_continues" }
    ]
  },
  
  bluefur_interrupts: {
    speaker: "bluefur",
    text: "I don't care what you wanted. Go back to your Twolegs. Never return to this forest.",
    next: "bluefur_final"
  },
  
  bluefur_continues: {
    speaker: "bluefur",
    text: "Go back where you came from. This is your only warning.",
    next: "bluefur_final"
  },
  
  bluefur_final: {
    speaker: "bluefur",
    text: "If I see you here again... I won't stop the next warrior who finds you.",
    next: "bluefur_leaves"
  },
  
  bluefur_leaves: {
    speaker: "narrator", 
    text: "The blue-gray she-cat turns and vanishes into the forest, leaving you alone in the dark.",
    next: "tiny_alone"
  },
  
  tiny_alone: {
    speaker: "narrator",
    text: "You stand there, bleeding, shaking. You came to prove you were brave... and all you found was pain.",
    next: "journey_home"
  },
  
  journey_home: {
    speaker: "narrator",
    text: "Slowly, painfully, you begin the long walk back home. Something inside you has changed forever.",
    endChapter: true,
    nextChapter: 6
  }
};

// Chapter 6 - Return to Twolegplace
const CHAPTER_6_DIALOGUE = {
  intro_narration: [
    "Dawn breaks as you finally reach the Twoleg house...",
    "Your wounds have stopped bleeding, but the scars will remain forever.",
    "You are no longer the same kit who left last night.",
    "The forest showed you the truth: this world is cruel to the weak."
  ],
  
  siblings_see_scars: {
    speaker: "socks",
    text: "Whoa... what happened to YOUR face, Tiny? Did you get into a fight?",
    choices: [
      { text: "\"I went to the forest\"", next: "siblings_shocked" },
      { text: "Glare at them silently", next: "siblings_nervous", emotion: "angry" }
    ]
  },
  
  siblings_shocked: {
    speaker: "ruby",
    text: "The FOREST?! You actually went there? Are you crazy?!",
    next: "socks_still_mean"
  },
  
  siblings_nervous: {
    speaker: "narrator",
    text: "Something in your eyes makes Socks take a step back. You've never looked at them like this before.",
    next: "socks_still_mean"
  },
  
  socks_still_mean: {
    speaker: "socks",
    text: "Well, you look terrible! Those scars are ugly. No Twoleg will want you NOW!",
    choices: [
      { text: "\"Maybe I don't need Twolegs\"", next: "cold_response" },
      { text: "Say nothing - just stare", next: "cold_stare", emotion: "angry" }
    ]
  },
  
  cold_response: {
    speaker: "narrator",
    text: "Your voice is different now. Colder. Harder.",
    next: "siblings_leave"
  },
  
  cold_stare: {
    speaker: "narrator", 
    text: "Your ice-blue eyes hold a new darkness. Socks and Ruby suddenly seem uncomfortable.",
    next: "siblings_leave"
  },
  
  siblings_leave: {
    speaker: "socks",
    text: "Whatever, weirdo. Come on, Ruby...",
    next: "alone_again"
  },
  
  alone_again: {
    speaker: "narrator",
    text: "They walk away, but for the first time, YOU feel like the powerful one. You've seen things they never will. Survived things they never could.",
    next: "planning"
  },
  
  planning: {
    speaker: "narrator",
    text: "As you settle into your nest, one thought repeats in your mind: You will NEVER be weak again.",
    endChapter: true,
    nextChapter: 7
  }
};

// Chapter 7 - Becoming Scourge
const CHAPTER_7_DIALOGUE = {
  intro_narration: [
    "Moons pass...",
    "The Twolegs gave Socks and Ruby to new homes.",
    "But you? You left. You chose the streets.",
    "In Twolegplace, you learned to fight. To survive.",
    "To be FEARED."
  ],
  
  alley_intro: {
    speaker: "narrator",
    text: "The alleys of Twolegplace are harsh, but you've become harsher. Cats whisper your name in fear now.",
    next: "brick_challenge"
  },
  
  brick_challenge: {
    speaker: "brick",
    text: "Hey! This is MY alley, little cat! You better run before I—",
    choices: [
      { text: "Unsheathe your reinforced claws", next: "show_claws" },
      { text: "\"You don't know who I am, do you?\"", next: "intimidate" }
    ]
  },
  
  show_claws: {
    speaker: "narrator",
    text: "Your claws gleam in the dim light - reinforced with dog teeth, sharper than any cat's.",
    next: "brick_scared"
  },
  
  intimidate: {
    speaker: "narrator",
    text: "Your voice is ice. Your eyes hold the memory of every fight you've won.",
    next: "brick_scared"
  },
  
  brick_scared: {
    speaker: "brick",
    text: "W-wait... you're... you're Scourge! I'm sorry! I didn't recognize you!",
    choices: [
      { text: "\"Remember my face\"", next: "brick_submits" },
      { text: "\"Leave. Now.\"", next: "brick_submits" }
    ]
  },
  
  brick_submits: {
    speaker: "narrator",
    text: "Brick scrambles away, tail between his legs. Another cat who will spread your legend.",
    next: "bone_arrives"
  },
  
  bone_arrives: {
    speaker: "bone",
    text: "Scourge. More cats are asking to join us. What should I tell them?",
    choices: [
      { text: "\"They must prove their loyalty\"", next: "bloodclan_grows" },
      { text: "\"We're building something powerful\"", next: "bloodclan_grows" }
    ]
  },
  
  bloodclan_grows: {
    speaker: "narrator",
    text: "BloodClan grows stronger every day. Cats from all over Twolegplace flock to your banner.",
    next: "scourge_reflection"
  },
  
  scourge_reflection: {
    speaker: "narrator",
    text: "You look at your reflection in a puddle. Scarred. Fierce. Powerful. The weak little kit called Tiny is dead.",
    endChapter: true,
    nextChapter: 8
  }
};

// Chapter 8 - Leader of BloodClan
const CHAPTER_8_DIALOGUE = {
  intro_narration: [
    "You stand at the center of Twolegplace...",
    "Hundreds of cats surround you, waiting for your command.",
    "You are Scourge, leader of BloodClan.",
    "And one day... one day you will return to that forest.",
    "One day, Tigerpaw - whoever he's become - will remember your face."
  ],
  
  final_speech: {
    speaker: "narrator",
    text: "The small black kit who was told he was worthless has become the most feared cat in the city.",
    next: "looking_to_forest"
  },
  
  looking_to_forest: {
    speaker: "narrator",
    text: "In the distance, beyond the Twoleg dens, you can see the dark line of trees. The forest.",
    choices: [
      { text: "\"One day, I will make them pay\"", next: "ending" },
      { text: "Remember Tigerpaw's face", next: "ending", emotion: "angry" }
    ]
  },
  
  ending: {
    speaker: "narrator",
    text: "The forest cats thought they were rid of you forever. They were wrong. Scourge never forgets... and Scourge never forgives.",
    next: "game_end"
  },
  
  game_end: {
    speaker: "narrator",
    text: "THE END\n\nThank you for playing The Rise of Scourge!",
    isEnding: true
  }
};

// Combine all dialogue
const ALL_DIALOGUE = {
  ...CHAPTER_1_DIALOGUE,
  ...CHAPTER_2_DIALOGUE,
  ...CHAPTER_3_DIALOGUE,
  ...CHAPTER_4_DIALOGUE,
  ...CHAPTER_5_DIALOGUE,
  ...CHAPTER_6_DIALOGUE,
  ...CHAPTER_7_DIALOGUE,
  ...CHAPTER_8_DIALOGUE
};

// Sound effects using Web Audio API
const SoundManager = {
  audioContext: null,
  
  init() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  },
  
  playMeow() {
    if (!this.audioContext) this.init();
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);
  },
  
  playHiss() {
    if (!this.audioContext) this.init();
    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.audioContext.destination);
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    source.start();
  },
  
  playHurt() {
    if (!this.audioContext) this.init();
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);
  },
  
  playDialogue() {
    if (!this.audioContext) this.init();
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.setValueAtTime(300 + Math.random() * 100, this.audioContext.currentTime);
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.05);
  }
};

// Save/Load system
const SaveManager = {
  SAVE_KEY: 'scourge_saves',
  
  getSaves() {
    const data = localStorage.getItem(this.SAVE_KEY);
    return data ? JSON.parse(data) : { slot1: null, slot2: null, slot3: null };
  },
  
  save(slot, gameState) {
    const saves = this.getSaves();
    saves[`slot${slot}`] = {
      chapter: gameState.chapter,
      dialogueState: gameState.dialogueState,
      hasScars: gameState.hasScars,
      timestamp: Date.now()
    };
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(saves));
  },
  
  load(slot) {
    const saves = this.getSaves();
    return saves[`slot${slot}`];
  },
  
  deleteSave(slot) {
    const saves = this.getSaves();
    saves[`slot${slot}`] = null;
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(saves));
  }
};

// Export for game.js
window.GameData = {
  CHAPTERS,
  CHARACTERS,
  ALL_DIALOGUE,
  BATTLE_CONFIG,
  SoundManager,
  SaveManager
};
