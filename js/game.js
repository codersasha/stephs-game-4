/* ============================================
   Warrior Cats: The Rise of Scourge
   Main Game - 3D First Person
   ============================================ */

// Game state
const GameState = {
  chapter: 1,
  dialogueState: null,
  isInDialogue: false,
  isInBattle: false,
  isPaused: false,
  hasScars: false,
  currentSaveSlot: null,
  playerHP: 100,
  enemyHP: 100,
  isLyingDown: false,
  currentNarrationIndex: 0
};

// Three.js variables
let scene, camera, renderer;
let playerVelocity = new THREE.Vector3();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = true;
let isRunning = false;
let clock = new THREE.Clock();
let isMobile = false;

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const loadingBarFill = document.getElementById('loading-bar-fill');
const titleScreen = document.getElementById('title-screen');
const savesScreen = document.getElementById('saves-screen');
const gameScreen = document.getElementById('game-screen');
const gameCanvas = document.getElementById('game-canvas');
const dialogueBox = document.getElementById('dialogue-box');
const narrationBox = document.getElementById('narration-box');
const chapterOverlay = document.getElementById('chapter-overlay');
const battleScreen = document.getElementById('battle-screen');
const pauseMenu = document.getElementById('pause-menu');
const controlsHelp = document.getElementById('controls-help');
const emotionDisplay = document.getElementById('emotion-display');
const emoteWheel = document.getElementById('emote-wheel');
const mobileControls = document.getElementById('mobile-controls');
const interactHint = document.getElementById('interact-hint');

// Initialize loading
function simulateLoading() {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        titleScreen.classList.remove('hidden');
      }, 300);
    }
    loadingBarFill.style.width = progress + '%';
  }, 100);
}

// Start the game
function init() {
  // Check if mobile
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
             ('ontouchstart' in window);
  
  simulateLoading();
  setupEventListeners();
  initThreeJS();
  updateSaveSlots();
}

// Setup event listeners
function setupEventListeners() {
  // Title screen
  document.getElementById('start-btn').addEventListener('click', showSavesScreen);
  document.addEventListener('keydown', (e) => {
    if (!titleScreen.classList.contains('hidden') && !loadingScreen.classList.contains('hidden')) return;
    if (!titleScreen.classList.contains('hidden')) {
      showSavesScreen();
    }
  });
  
  // Saves screen
  document.getElementById('saves-back-btn').addEventListener('click', () => {
    savesScreen.classList.add('hidden');
    titleScreen.classList.remove('hidden');
  });
  
  document.querySelectorAll('.save-slot').forEach(slot => {
    slot.addEventListener('click', (e) => {
      if (e.target.classList.contains('save-slot-delete')) return;
      const slotNum = parseInt(slot.dataset.slot);
      selectSaveSlot(slotNum);
    });
  });
  
  document.querySelectorAll('.save-slot-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const slot = parseInt(btn.dataset.slot);
      if (confirm('Delete this save?')) {
        GameData.SaveManager.deleteSave(slot);
        updateSaveSlots();
      }
    });
  });
  
  // Pause menu
  document.getElementById('hud-menu-btn').addEventListener('click', togglePause);
  document.getElementById('pause-resume').addEventListener('click', togglePause);
  document.getElementById('pause-controls').addEventListener('click', () => {
    pauseMenu.classList.add('hidden');
    controlsHelp.classList.remove('hidden');
  });
  document.getElementById('close-controls').addEventListener('click', () => {
    controlsHelp.classList.add('hidden');
    pauseMenu.classList.remove('hidden');
  });
  document.getElementById('pause-save').addEventListener('click', () => {
    saveGame();
    alert('Game saved!');
  });
  document.getElementById('pause-quit').addEventListener('click', () => {
    if (confirm('Quit to menu? Unsaved progress will be lost.')) {
      quitToMenu();
    }
  });
  
  // Keyboard controls
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  
  // Emote buttons
  document.querySelectorAll('.emote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emote = btn.dataset.emote;
      showEmote(emote);
      emoteWheel.classList.add('hidden');
    });
  });
  
  // Battle buttons
  document.querySelectorAll('.battle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      performBattleAction(action);
    });
  });
  
  // Mobile controls
  if (isMobile) {
    setupMobileControls();
  }
  
  // Dialogue/Narration continue
  document.addEventListener('click', handleContinue);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      handleContinue();
    }
  });
  
  // Window resize
  window.addEventListener('resize', onWindowResize);
}

// Mobile controls setup
function setupMobileControls() {
  const joystickContainer = document.getElementById('joystick-container');
  const joystickStick = document.getElementById('joystick-stick');
  let joystickActive = false;
  let joystickCenter = { x: 0, y: 0 };
  
  joystickContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    const rect = joystickContainer.getBoundingClientRect();
    joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  });
  
  joystickContainer.addEventListener('touchmove', (e) => {
    if (!joystickActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - joystickCenter.x;
    const dy = touch.clientY - joystickCenter.y;
    const distance = Math.min(Math.sqrt(dx*dx + dy*dy), 40);
    const angle = Math.atan2(dy, dx);
    
    joystickStick.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
    
    // Movement
    moveForward = dy < -10;
    moveBackward = dy > 10;
    moveLeft = dx < -10;
    moveRight = dx > 10;
  });
  
  joystickContainer.addEventListener('touchend', () => {
    joystickActive = false;
    joystickStick.style.transform = '';
    moveForward = moveBackward = moveLeft = moveRight = false;
  });
  
  document.getElementById('mobile-jump').addEventListener('touchstart', () => jump());
  document.getElementById('mobile-interact').addEventListener('touchstart', () => interact());
  document.getElementById('mobile-emote').addEventListener('touchstart', () => {
    emoteWheel.classList.toggle('hidden');
  });
  document.getElementById('mobile-meow').addEventListener('touchstart', () => {
    GameData.SoundManager.playMeow();
    showEmote('meow');
  });
}

// Initialize Three.js
function initThreeJS() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 5, 50);
  
  // First-person camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0.5, 0); // Low like a cat's view
  
  renderer = new THREE.WebGLRenderer({ canvas: gameCanvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);
}

// Create environment based on chapter
function createEnvironment(chapter) {
  // Clear existing objects (except lights)
  scene.children = scene.children.filter(child => 
    child instanceof THREE.Light || child === camera
  );
  
  const chapterData = GameData.CHAPTERS[chapter - 1];
  
  if (chapter <= 2) {
    // Twoleg House - Indoor scene
    createTwolegHouse();
  } else if (chapter <= 5) {
    // Forest
    createForest();
  } else {
    // Twolegplace / Alleys
    createTwolegplace();
  }
}

// Create Twoleg House environment
function createTwolegHouse() {
  // Floor
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);
  
  // Walls
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
  
  // Back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMaterial);
  backWall.position.set(0, 4, -10);
  scene.add(backWall);
  
  // Side walls
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-10, 4, 0);
  scene.add(leftWall);
  
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(10, 4, 0);
  scene.add(rightWall);
  
  // Cat bed
  const bedGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 16);
  const bedMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
  const bed = new THREE.Mesh(bedGeometry, bedMaterial);
  bed.position.set(-3, 0.15, -3);
  scene.add(bed);
  
  // Cushion
  const cushionGeometry = new THREE.SphereGeometry(1.2, 16, 16);
  const cushionMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
  const cushion = new THREE.Mesh(cushionGeometry, cushionMaterial);
  cushion.scale.y = 0.3;
  cushion.position.set(-3, 0.3, -3);
  scene.add(cushion);
  
  // Window (with light coming through)
  const windowGeometry = new THREE.PlaneGeometry(4, 3);
  const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
  const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
  window1.position.set(0, 4, -9.9);
  scene.add(window1);
  
  // Add some simple cat representations (Socks and Ruby)
  createCatFigure(2, 0.5, -5, 0x2a2a2a, 'Socks'); // Socks
  createCatFigure(4, 0.5, -4, 0x8B4513, 'Ruby'); // Ruby
  
  // Update scene background for indoor
  scene.background = new THREE.Color(0x2a2a2a);
  scene.fog = new THREE.Fog(0x2a2a2a, 5, 30);
}

// Create Forest environment
function createForest() {
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5a27 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  
  // Trees
  for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 80;
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue; // Clear area around player
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 2, z);
    scene.add(trunk);
    
    // Leaves
    const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 5, z);
    scene.add(leaves);
  }
  
  // Night sky
  scene.background = new THREE.Color(0x0a0a1a);
  scene.fog = new THREE.Fog(0x0a0a1a, 3, 25);
  
  // Add moonlight
  const moonLight = new THREE.DirectionalLight(0x9999ff, 0.3);
  moonLight.position.set(10, 20, 10);
  scene.add(moonLight);
}

// Create Twolegplace (alley) environment
function createTwolegplace() {
  // Ground (concrete)
  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  
  // Buildings (simple boxes)
  for (let i = 0; i < 10; i++) {
    const width = 5 + Math.random() * 5;
    const height = 10 + Math.random() * 15;
    const depth = 5 + Math.random() * 5;
    
    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    const buildingMaterial = new THREE.MeshLambertMaterial({ 
      color: new THREE.Color(0.2 + Math.random() * 0.2, 0.2 + Math.random() * 0.1, 0.2 + Math.random() * 0.1)
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    
    const x = (Math.random() - 0.5) * 40;
    const z = -15 - Math.random() * 20;
    building.position.set(x, height / 2, z);
    scene.add(building);
  }
  
  // Dumpster
  const dumpsterGeometry = new THREE.BoxGeometry(3, 2, 2);
  const dumpsterMaterial = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });
  const dumpster = new THREE.Mesh(dumpsterGeometry, dumpsterMaterial);
  dumpster.position.set(-5, 1, -8);
  scene.add(dumpster);
  
  // Dark atmosphere
  scene.background = new THREE.Color(0x1a1a1a);
  scene.fog = new THREE.Fog(0x1a1a1a, 2, 20);
}

// Create a simple cat figure
function createCatFigure(x, y, z, color, name) {
  const group = new THREE.Group();
  
  // Body
  const bodyGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.scale.set(1, 0.7, 1.3);
  body.position.y = 0.3;
  group.add(body);
  
  // Head
  const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
  const head = new THREE.Mesh(headGeometry, bodyMaterial);
  head.position.set(0, 0.5, 0.35);
  group.add(head);
  
  // Ears
  const earGeometry = new THREE.ConeGeometry(0.08, 0.15, 4);
  const earL = new THREE.Mesh(earGeometry, bodyMaterial);
  earL.position.set(-0.12, 0.7, 0.35);
  group.add(earL);
  
  const earR = new THREE.Mesh(earGeometry, bodyMaterial);
  earR.position.set(0.12, 0.7, 0.35);
  group.add(earR);
  
  // Eyes (glowing)
  const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
  const eyeL = new THREE.Mesh(eyeGeometry, eyeMaterial);
  eyeL.position.set(-0.08, 0.52, 0.55);
  group.add(eyeL);
  
  const eyeR = new THREE.Mesh(eyeGeometry, eyeMaterial);
  eyeR.position.set(0.08, 0.52, 0.55);
  group.add(eyeR);
  
  group.position.set(x, y, z);
  group.userData = { name, isInteractable: true };
  scene.add(group);
  
  return group;
}

// Key controls
function onKeyDown(e) {
  if (GameState.isPaused || GameState.isInDialogue || GameState.isInBattle) {
    if (e.code === 'Escape') {
      if (controlsHelp.classList.contains('hidden') === false) {
        controlsHelp.classList.add('hidden');
      } else {
        togglePause();
      }
    }
    return;
  }
  
  switch (e.code) {
    case 'KeyW': moveForward = true; break;
    case 'KeyS': moveBackward = true; break;
    case 'KeyA': moveLeft = true; break;
    case 'KeyD': moveRight = true; break;
    case 'Space': jump(); break;
    case 'ShiftLeft': isRunning = true; break;
    case 'KeyE': interact(); break;
    case 'KeyQ': 
      GameData.SoundManager.playMeow();
      showEmote('meow');
      break;
    case 'KeyC': toggleLieDown(); break;
    case 'Escape': togglePause(); break;
    
    // Emotions
    case 'Digit1': showEmote('happy'); break;
    case 'Digit2': showEmote('sad'); break;
    case 'Digit3': showEmote('angry'); break;
    case 'Digit4': showEmote('scared'); break;
    case 'Digit5': showEmote('curious'); break;
    case 'Digit6': showEmote('tired'); break;
  }
}

function onKeyUp(e) {
  switch (e.code) {
    case 'KeyW': moveForward = false; break;
    case 'KeyS': moveBackward = false; break;
    case 'KeyA': moveLeft = false; break;
    case 'KeyD': moveRight = false; break;
    case 'ShiftLeft': isRunning = false; break;
  }
}

// Movement
function updateMovement(delta) {
  if (GameState.isPaused || GameState.isInDialogue || GameState.isInBattle || GameState.isLyingDown) return;
  
  const speed = isRunning ? 8 : 4;
  const direction = new THREE.Vector3();
  
  if (moveForward) direction.z -= 1;
  if (moveBackward) direction.z += 1;
  if (moveLeft) direction.x -= 1;
  if (moveRight) direction.x += 1;
  
  direction.normalize();
  direction.multiplyScalar(speed * delta);
  
  // Apply to camera
  camera.position.x += direction.x;
  camera.position.z += direction.z;
  
  // Gravity
  playerVelocity.y -= 9.8 * delta;
  camera.position.y += playerVelocity.y * delta;
  
  // Ground collision
  if (camera.position.y < 0.5) {
    camera.position.y = 0.5;
    playerVelocity.y = 0;
    canJump = true;
  }
  
  // Bounds
  camera.position.x = Math.max(-45, Math.min(45, camera.position.x));
  camera.position.z = Math.max(-45, Math.min(45, camera.position.z));
}

// Mouse look (desktop)
let isPointerLocked = false;

gameCanvas.addEventListener('click', () => {
  if (!gameScreen.classList.contains('hidden') && !GameState.isInDialogue && !GameState.isPaused) {
    gameCanvas.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  isPointerLocked = document.pointerLockElement === gameCanvas;
});

document.addEventListener('mousemove', (e) => {
  if (!isPointerLocked) return;
  
  const sensitivity = 0.002;
  camera.rotation.y -= e.movementX * sensitivity;
  camera.rotation.x -= e.movementY * sensitivity;
  camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
});

// Actions
function jump() {
  if (canJump && !GameState.isLyingDown) {
    playerVelocity.y = 5;
    canJump = false;
  }
}

function toggleLieDown() {
  GameState.isLyingDown = !GameState.isLyingDown;
  if (GameState.isLyingDown) {
    camera.position.y = 0.2;
  }
}

function interact() {
  // For now, just continue dialogue or interact with nearby objects
  if (GameState.isInDialogue) return;
  
  // Check for nearby interactable objects
  // This would be expanded to check actual proximity
  console.log('Interact pressed');
}

function showEmote(emote) {
  const emotes = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    scared: '😨',
    curious: '🤔',
    tired: '😴',
    meow: '😺'
  };
  
  const icon = emotes[emote] || '😺';
  document.getElementById('emotion-icon').textContent = icon;
  emotionDisplay.classList.remove('hidden');
  
  setTimeout(() => {
    emotionDisplay.classList.add('hidden');
  }, 1000);
}

// Dialogue system
function showDialogue(dialogueId) {
  const dialogue = GameData.ALL_DIALOGUE[dialogueId];
  if (!dialogue) {
    console.error('Dialogue not found:', dialogueId);
    return;
  }
  
  GameState.isInDialogue = true;
  GameState.dialogueState = dialogueId;
  
  if (dialogue.speaker === 'narrator') {
    // Narration
    narrationBox.classList.remove('hidden');
    dialogueBox.classList.add('hidden');
    document.getElementById('narration-text').textContent = dialogue.text;
  } else {
    // Character dialogue
    narrationBox.classList.add('hidden');
    dialogueBox.classList.remove('hidden');
    
    const character = GameData.CHARACTERS[dialogue.speaker];
    document.getElementById('dialogue-speaker-name').textContent = character ? character.name : dialogue.speaker;
    document.getElementById('dialogue-text').textContent = dialogue.text;
    
    // Choices
    const choicesContainer = document.getElementById('dialogue-choices');
    const continueHint = document.getElementById('dialogue-continue');
    
    choicesContainer.innerHTML = '';
    
    if (dialogue.choices) {
      continueHint.style.display = 'none';
      dialogue.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'dialogue-choice';
        btn.textContent = choice.text;
        btn.addEventListener('click', () => {
          if (choice.emotion) {
            showEmote(choice.emotion);
          }
          advanceDialogue(choice.next);
        });
        choicesContainer.appendChild(btn);
      });
    } else {
      continueHint.style.display = 'block';
    }
  }
  
  // Play sound
  GameData.SoundManager.playDialogue();
}

function advanceDialogue(nextId) {
  const currentDialogue = GameData.ALL_DIALOGUE[GameState.dialogueState];
  
  if (!nextId && currentDialogue) {
    nextId = currentDialogue.next;
  }
  
  if (!nextId) {
    // Check for end chapter
    if (currentDialogue && currentDialogue.endChapter) {
      endChapter(currentDialogue.nextChapter);
      return;
    }
    if (currentDialogue && currentDialogue.startBattle) {
      startBattle(currentDialogue.enemy);
      return;
    }
    if (currentDialogue && currentDialogue.isEnding) {
      showEnding();
      return;
    }
    // End dialogue
    GameState.isInDialogue = false;
    dialogueBox.classList.add('hidden');
    narrationBox.classList.add('hidden');
    return;
  }
  
  showDialogue(nextId);
}

function handleContinue(e) {
  if (!GameState.isInDialogue) return;
  
  // Don't continue if clicking a choice button
  if (e && e.target.classList.contains('dialogue-choice')) return;
  
  const currentDialogue = GameData.ALL_DIALOGUE[GameState.dialogueState];
  if (currentDialogue && currentDialogue.choices) return; // Must pick a choice
  
  advanceDialogue();
}

// Show narration sequence (array of texts)
function showNarrationSequence(narrations, callback) {
  GameState.currentNarrationIndex = 0;
  GameState.isInDialogue = true;
  
  function showNext() {
    if (GameState.currentNarrationIndex >= narrations.length) {
      narrationBox.classList.add('hidden');
      GameState.isInDialogue = false;
      if (callback) callback();
      return;
    }
    
    narrationBox.classList.remove('hidden');
    document.getElementById('narration-text').textContent = narrations[GameState.currentNarrationIndex];
    GameState.currentNarrationIndex++;
    GameData.SoundManager.playDialogue();
  }
  
  // Override handleContinue temporarily
  const oldHandler = handleContinue;
  const newHandler = (e) => {
    if (!GameState.isInDialogue) return;
    if (e && e.target.classList.contains('dialogue-choice')) return;
    
    if (GameState.currentNarrationIndex < narrations.length) {
      showNext();
    } else {
      narrationBox.classList.add('hidden');
      GameState.isInDialogue = false;
      document.removeEventListener('click', newHandler);
      if (callback) callback();
    }
  };
  
  document.addEventListener('click', newHandler);
  showNext();
}

// Chapter system
function startChapter(chapterNum) {
  GameState.chapter = chapterNum;
  const chapter = GameData.CHAPTERS[chapterNum - 1];
  
  // Show chapter title
  document.getElementById('chapter-number').textContent = `Chapter ${chapterNum}`;
  document.getElementById('chapter-title').textContent = chapter.title;
  chapterOverlay.classList.remove('hidden');
  
  // Update HUD
  document.getElementById('hud-chapter').textContent = `Chapter ${chapterNum}: ${chapter.title}`;
  document.getElementById('hud-location').textContent = chapter.location;
  
  // Create environment
  createEnvironment(chapterNum);
  
  // Reset player position
  camera.position.set(0, 0.5, 5);
  camera.rotation.set(0, 0, 0);
  
  setTimeout(() => {
    chapterOverlay.classList.add('hidden');
    
    // Get intro narrations for this chapter
    const introKey = `CHAPTER_${chapterNum}_DIALOGUE`;
    const chapterDialogue = window[introKey] || {};
    
    // Start with narration or dialogue based on chapter
    if (chapterNum === 1) {
      showNarrationSequence(GameData.ALL_DIALOGUE.intro_narration || [
        "You open your eyes slowly...",
        "Warm sunlight filters through a window. You're in a cozy Twoleg house.",
        "You are Tiny - a small black kit with one white paw.",
        "Your littermates, Socks and Ruby, are nearby."
      ], () => {
        showDialogue('socks_bully_1');
      });
    } else if (chapterNum === 2) {
      showNarrationSequence(CHAPTER_2_DIALOGUE.intro_narration, () => {
        showDialogue('socks_secret');
      });
    } else if (chapterNum === 3) {
      showNarrationSequence(CHAPTER_3_DIALOGUE.intro_narration, () => {
        showDialogue('forest_edge');
      });
    } else if (chapterNum === 6) {
      showNarrationSequence(CHAPTER_6_DIALOGUE.intro_narration, () => {
        showDialogue('siblings_see_scars');
      });
    } else if (chapterNum === 7) {
      showNarrationSequence(CHAPTER_7_DIALOGUE.intro_narration, () => {
        showDialogue('alley_intro');
      });
    } else if (chapterNum === 8) {
      showNarrationSequence(CHAPTER_8_DIALOGUE.intro_narration, () => {
        showDialogue('final_speech');
      });
    }
  }, 2500);
}

function endChapter(nextChapter) {
  GameState.isInDialogue = false;
  dialogueBox.classList.add('hidden');
  narrationBox.classList.add('hidden');
  
  // Save progress
  saveGame();
  
  // Small delay then start next chapter
  setTimeout(() => {
    startChapter(nextChapter);
  }, 1000);
}

// Battle system
function startBattle(enemyId) {
  GameState.isInBattle = true;
  GameState.isInDialogue = false;
  dialogueBox.classList.add('hidden');
  narrationBox.classList.add('hidden');
  
  const enemy = GameData.BATTLE_CONFIG[enemyId];
  GameState.enemyHP = enemy.hp;
  GameState.playerHP = 100;
  
  document.getElementById('battle-enemy-name').textContent = enemy.name;
  updateBattleHP();
  
  document.getElementById('battle-log').innerHTML = `<p>${enemy.description}</p>`;
  
  battleScreen.classList.remove('hidden');
}

function updateBattleHP() {
  document.getElementById('battle-player-hp-fill').style.width = GameState.playerHP + '%';
  document.getElementById('battle-enemy-hp-fill').style.width = GameState.enemyHP + '%';
}

function performBattleAction(action) {
  const enemy = GameData.BATTLE_CONFIG.tigerpaw;
  const log = document.getElementById('battle-log');
  
  switch (action) {
    case 'attack':
      log.innerHTML += '<p>You swipe at Tigerpaw!</p>';
      GameState.enemyHP -= 5; // Tiny is too weak to do much damage
      break;
    case 'dodge':
      log.innerHTML += '<p>You try to dodge!</p>';
      break;
    case 'hiss':
      log.innerHTML += '<p>You hiss defiantly!</p>';
      GameData.SoundManager.playHiss();
      break;
    case 'flee':
      log.innerHTML += '<p>You try to run, but Tigerpaw is too fast!</p>';
      break;
  }
  
  // Enemy always hits hard
  setTimeout(() => {
    const attack = enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)];
    log.innerHTML += `<p style="color:#ff6666">${attack.text}</p>`;
    GameState.playerHP -= attack.damage;
    GameData.SoundManager.playHurt();
    
    updateBattleHP();
    log.scrollTop = log.scrollHeight;
    
    // Check if battle is over (Tiny loses)
    if (GameState.playerHP <= 0) {
      GameState.playerHP = 0;
      updateBattleHP();
      setTimeout(() => {
        endBattle();
      }, 1000);
    }
  }, 500);
}

function endBattle() {
  battleScreen.classList.add('hidden');
  GameState.isInBattle = false;
  GameState.hasScars = true;
  
  // Show scar overlay
  document.getElementById('scar-text').textContent = "Tigerpaw's claws leave deep scars across your face...";
  document.getElementById('scar-overlay').classList.remove('hidden');
  
  setTimeout(() => {
    document.getElementById('scar-overlay').classList.add('hidden');
    
    // Continue story - Bluefur arrives
    showDialogue('tigerpaw_defeats_tiny');
  }, 2500);
}

// Show ending
function showEnding() {
  GameState.isInDialogue = false;
  narrationBox.classList.add('hidden');
  
  // Show credits or ending screen
  chapterOverlay.classList.remove('hidden');
  document.getElementById('chapter-number').textContent = 'The End';
  document.getElementById('chapter-title').textContent = 'Thank you for playing!';
  
  setTimeout(() => {
    if (confirm('Play again from the beginning?')) {
      GameState.chapter = 1;
      startChapter(1);
    } else {
      quitToMenu();
    }
  }, 3000);
}

// Save/Load
function updateSaveSlots() {
  const saves = GameData.SaveManager.getSaves();
  
  for (let i = 1; i <= 3; i++) {
    const save = saves[`slot${i}`];
    const nameEl = document.getElementById(`slot-${i}-name`);
    const detailsEl = document.getElementById(`slot-${i}-details`);
    const deleteBtn = document.querySelector(`.save-slot-delete[data-slot="${i}"]`);
    
    if (save) {
      const chapter = GameData.CHAPTERS[save.chapter - 1];
      nameEl.textContent = save.hasScars ? 'Tiny (Scarred)' : 'Tiny';
      detailsEl.textContent = `Chapter ${save.chapter}: ${chapter.title}`;
      deleteBtn.classList.remove('hidden');
    } else {
      nameEl.textContent = 'Empty Slot';
      detailsEl.textContent = 'Start a new game';
      deleteBtn.classList.add('hidden');
    }
  }
}

function selectSaveSlot(slot) {
  GameState.currentSaveSlot = slot;
  const save = GameData.SaveManager.load(slot);
  
  savesScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  
  if (isMobile) {
    mobileControls.classList.remove('hidden');
  }
  
  if (save) {
    // Continue from save
    GameState.chapter = save.chapter;
    GameState.hasScars = save.hasScars;
    startChapter(save.chapter);
  } else {
    // New game
    startChapter(1);
  }
}

function saveGame() {
  if (GameState.currentSaveSlot) {
    GameData.SaveManager.save(GameState.currentSaveSlot, GameState);
  }
}

function showSavesScreen() {
  titleScreen.classList.add('hidden');
  savesScreen.classList.remove('hidden');
  updateSaveSlots();
}

function togglePause() {
  GameState.isPaused = !GameState.isPaused;
  
  if (GameState.isPaused) {
    pauseMenu.classList.remove('hidden');
    document.exitPointerLock();
  } else {
    pauseMenu.classList.add('hidden');
    controlsHelp.classList.add('hidden');
  }
}

function quitToMenu() {
  gameScreen.classList.add('hidden');
  titleScreen.classList.remove('hidden');
  pauseMenu.classList.add('hidden');
  GameState.isPaused = false;
  mobileControls.classList.add('hidden');
}

// Window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  
  if (!gameScreen.classList.contains('hidden')) {
    updateMovement(delta);
    renderer.render(scene, camera);
  }
}

// Start everything
init();
animate();
