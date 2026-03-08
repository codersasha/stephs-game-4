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

// Create Twoleg House environment - Big cozy house!
function createTwolegHouse() {
  // Nice wooden floor with pattern
  const floorGeometry = new THREE.PlaneGeometry(30, 30);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xB8860B,
    roughness: 0.8,
    metalness: 0.1
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);
  
  // Warm cream walls
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFF8DC,
    roughness: 0.9
  });
  
  // Back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMaterial);
  backWall.position.set(0, 5, -15);
  scene.add(backWall);
  
  // Side walls
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-15, 5, 0);
  scene.add(leftWall);
  
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(15, 5, 0);
  scene.add(rightWall);
  
  // Front wall with door opening
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMaterial);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, 5, 15);
  scene.add(frontWall);
  
  // === BIG COZY COUCH (the "soft sitting-thing") ===
  const couchColor = 0x8B4513; // Brown leather
  const couchMaterial = new THREE.MeshStandardMaterial({ 
    color: couchColor,
    roughness: 0.6
  });
  
  // Couch base
  const couchBase = new THREE.Mesh(
    new THREE.BoxGeometry(8, 1, 3),
    couchMaterial
  );
  couchBase.position.set(-5, 0.5, -10);
  scene.add(couchBase);
  
  // Couch back
  const couchBack = new THREE.Mesh(
    new THREE.BoxGeometry(8, 2, 0.5),
    couchMaterial
  );
  couchBack.position.set(-5, 1.5, -11.25);
  scene.add(couchBack);
  
  // Couch arm left
  const couchArmL = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.5, 3),
    couchMaterial
  );
  couchArmL.position.set(-9, 1, -10);
  scene.add(couchArmL);
  
  // Couch arm right
  const couchArmR = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.5, 3),
    couchMaterial
  );
  couchArmR.position.set(-1, 1, -10);
  scene.add(couchArmR);
  
  // Couch cushions
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0xCD853F, roughness: 0.7 });
  for (let i = 0; i < 3; i++) {
    const cushion = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.4, 2),
      cushionMat
    );
    cushion.position.set(-7.5 + i * 2.5, 1.2, -10);
    scene.add(cushion);
  }
  
  // === CAT BASKET (where you start!) ===
  const basketColor = 0x8B7355;
  const basketMaterial = new THREE.MeshStandardMaterial({ color: basketColor, roughness: 0.9 });
  
  // Basket base (cylinder)
  const basketBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.8, 0.5, 24),
    basketMaterial
  );
  basketBase.position.set(5, 0.25, -8);
  scene.add(basketBase);
  
  // Basket rim
  const basketRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.15, 8, 24),
    basketMaterial
  );
  basketRim.rotation.x = Math.PI / 2;
  basketRim.position.set(5, 0.5, -8);
  scene.add(basketRim);
  
  // Soft cushion inside basket
  const basketCushion = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.3, 0.3, 24),
    new THREE.MeshStandardMaterial({ color: 0xFFE4C4, roughness: 0.8 })
  );
  basketCushion.position.set(5, 0.4, -8);
  scene.add(basketCushion);
  
  // === BIG WINDOWS with sunlight ===
  const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
  
  // Window 1
  const window1 = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), windowMaterial);
  window1.position.set(-5, 5, -14.9);
  scene.add(window1);
  
  // Window frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.2, 0.1), frameMat);
  frameTop.position.set(-5, 7.1, -14.85);
  scene.add(frameTop);
  const frameBot = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.2, 0.1), frameMat);
  frameBot.position.set(-5, 2.9, -14.85);
  scene.add(frameBot);
  
  // Window 2
  const window2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), windowMaterial);
  window2.position.set(5, 5, -14.9);
  scene.add(window2);
  
  // === FURNITURE ===
  
  // Coffee table
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 2), tableMat);
  tableTop.position.set(-5, 1, -5);
  scene.add(tableTop);
  // Table legs
  for (let x of [-1.3, 1.3]) {
    for (let z of [-0.8, 0.8]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 8), tableMat);
      leg.position.set(-5 + x, 0.5, -5 + z);
      scene.add(leg);
    }
  }
  
  // Armchair
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 2.5), chairMat);
  chairSeat.position.set(8, 0.4, -5);
  scene.add(chairSeat);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 0.4), chairMat);
  chairBack.position.set(8, 1.4, -6.05);
  scene.add(chairBack);
  
  // Rug on floor
  const rugMat = new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 1 });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.01, -3);
  scene.add(rug);
  
  // === CAT CHARACTERS ===
  // Socks hiding behind the armchair
  createCatFigure(10, 0.5, -6, 0x555555, 'Socks', true);
  
  // Ruby near the basket (watching)
  createCatFigure(3, 0.5, -6, 0x8B4513, 'Ruby');
  
  // Mother Quince resting on the couch
  createCatFigure(-5, 1.5, -9.5, 0xFFE4B5, 'Quince');
  
  // === LIGHTING for cozy atmosphere ===
  scene.background = new THREE.Color(0xFFF8E7);
  scene.fog = new THREE.Fog(0xFFF8E7, 10, 40);
  
  // Warm sunlight from windows
  const sunLight = new THREE.DirectionalLight(0xFFE4B5, 1);
  sunLight.position.set(0, 10, -10);
  sunLight.castShadow = true;
  scene.add(sunLight);
  
  // Ambient warm light
  const warmAmbient = new THREE.AmbientLight(0xFFE4C4, 0.5);
  scene.add(warmAmbient);
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

// Create a better quality cat figure
function createCatFigure(x, y, z, color, name, hasWhitePaws = false) {
  const group = new THREE.Group();
  
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color,
    roughness: 0.8,
    metalness: 0
  });
  
  // Body - more detailed
  const bodyGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.scale.set(1, 0.7, 1.4);
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);
  
  // Head - rounder and cuter
  const headGeometry = new THREE.SphereGeometry(0.32, 32, 32);
  const head = new THREE.Mesh(headGeometry, bodyMaterial);
  head.position.set(0, 0.6, 0.45);
  head.castShadow = true;
  group.add(head);
  
  // Ears - triangular and cute
  const earGeometry = new THREE.ConeGeometry(0.12, 0.2, 4);
  const earInnerMat = new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }); // Pink inside
  
  const earL = new THREE.Mesh(earGeometry, bodyMaterial);
  earL.position.set(-0.18, 0.88, 0.4);
  earL.rotation.z = 0.2;
  group.add(earL);
  
  const earR = new THREE.Mesh(earGeometry, bodyMaterial);
  earR.position.set(0.18, 0.88, 0.4);
  earR.rotation.z = -0.2;
  group.add(earR);
  
  // Inner ears (pink)
  const earInnerL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), earInnerMat);
  earInnerL.position.set(-0.18, 0.86, 0.45);
  earInnerL.rotation.z = 0.2;
  group.add(earInnerL);
  
  const earInnerR = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), earInnerMat);
  earInnerR.position.set(0.18, 0.86, 0.45);
  earInnerR.rotation.z = -0.2;
  group.add(earInnerR);
  
  // Eyes - bigger and more expressive
  const eyeWhiteGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  
  const eyeWhiteL = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
  eyeWhiteL.scale.z = 0.5;
  eyeWhiteL.position.set(-0.12, 0.65, 0.7);
  group.add(eyeWhiteL);
  
  const eyeWhiteR = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
  eyeWhiteR.scale.z = 0.5;
  eyeWhiteR.position.set(0.12, 0.65, 0.7);
  group.add(eyeWhiteR);
  
  // Eye color (pupils)
  const eyeColor = name === 'Tiny' ? 0x87CEEB : (name === 'Quince' ? 0x90EE90 : 0xFFD700);
  const pupilGeometry = new THREE.SphereGeometry(0.05, 16, 16);
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: eyeColor });
  
  const pupilL = new THREE.Mesh(pupilGeometry, pupilMaterial);
  pupilL.position.set(-0.12, 0.65, 0.75);
  group.add(pupilL);
  
  const pupilR = new THREE.Mesh(pupilGeometry, pupilMaterial);
  pupilR.position.set(0.12, 0.65, 0.75);
  group.add(pupilR);
  
  // Black pupils
  const blackPupilGeom = new THREE.SphereGeometry(0.025, 8, 8);
  const blackPupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  const blackL = new THREE.Mesh(blackPupilGeom, blackPupilMat);
  blackL.position.set(-0.12, 0.65, 0.78);
  group.add(blackL);
  
  const blackR = new THREE.Mesh(blackPupilGeom, blackPupilMat);
  blackR.position.set(0.12, 0.65, 0.78);
  group.add(blackR);
  
  // Nose
  const noseGeometry = new THREE.SphereGeometry(0.04, 8, 8);
  const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xFFB6C1 });
  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.scale.set(1.2, 0.8, 0.8);
  nose.position.set(0, 0.55, 0.75);
  group.add(nose);
  
  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8);
  const legMaterial = hasWhitePaws ? 
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 }) : 
    bodyMaterial;
  
  const legPositions = [
    [-0.25, 0.15, 0.3],
    [0.25, 0.15, 0.3],
    [-0.25, 0.15, -0.2],
    [0.25, 0.15, -0.2]
  ];
  
  legPositions.forEach((pos, i) => {
    const useLegMaterial = (hasWhitePaws || (name === 'Tiny' && i === 0)) ? 
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 }) : 
      bodyMaterial;
    const leg = new THREE.Mesh(legGeometry, name === 'Tiny' && i === 0 ? 
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 }) : bodyMaterial);
    leg.position.set(...pos);
    group.add(leg);
  });
  
  // Tail - curved
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.35, -0.5),
    new THREE.Vector3(0, 0.5, -0.7),
    new THREE.Vector3(0.1, 0.7, -0.6),
    new THREE.Vector3(0.15, 0.8, -0.4)
  ]);
  const tailGeometry = new THREE.TubeGeometry(tailCurve, 20, 0.06, 8, false);
  const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
  group.add(tail);
  
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

// Movement - W forward, A left, S back, D right (relative to camera direction)
function updateMovement(delta) {
  if (GameState.isPaused || GameState.isInDialogue || GameState.isInBattle || GameState.isLyingDown) return;
  
  const speed = isRunning ? 8 : 4;
  
  // Get the direction the camera is facing (ignore vertical tilt)
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  cameraDirection.y = 0; // Keep movement horizontal
  cameraDirection.normalize();
  
  // Get the right vector (perpendicular to camera direction)
  const rightVector = new THREE.Vector3();
  rightVector.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
  rightVector.normalize();
  
  // Calculate movement direction based on keys
  const moveDirection = new THREE.Vector3(0, 0, 0);
  
  if (moveForward) {
    moveDirection.add(cameraDirection); // W - move in direction camera faces
  }
  if (moveBackward) {
    moveDirection.sub(cameraDirection); // S - move opposite to camera
  }
  if (moveLeft) {
    moveDirection.sub(rightVector); // A - move left
  }
  if (moveRight) {
    moveDirection.add(rightVector); // D - move right
  }
  
  // Normalize and apply speed
  if (moveDirection.length() > 0) {
    moveDirection.normalize();
    moveDirection.multiplyScalar(speed * delta);
    
    // Apply movement
    camera.position.x += moveDirection.x;
    camera.position.z += moveDirection.z;
  }
  
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

// Cutscene system - VISUAL cutscenes with actual graphics
function showCutscene(cutsceneData, callback) {
  GameState.isInDialogue = true;
  let currentIndex = 0;
  
  // Create cutscene container
  let cutsceneBox = document.getElementById('cutscene-box');
  if (cutsceneBox) cutsceneBox.remove();
  
  const box = document.createElement('div');
  box.id = 'cutscene-box';
  box.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 1000;
    font-family: 'Nunito', sans-serif;
    overflow: hidden;
  `;
  document.body.appendChild(box);
  
  // Create a separate Three.js scene for cutscenes
  const cutsceneCanvas = document.createElement('canvas');
  cutsceneCanvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
  box.appendChild(cutsceneCanvas);
  
  const cutsceneRenderer = new THREE.WebGLRenderer({ canvas: cutsceneCanvas, antialias: true });
  cutsceneRenderer.setSize(window.innerWidth, window.innerHeight);
  cutsceneRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  const cutsceneScene = new THREE.Scene();
  const cutsceneCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  cutsceneScene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  cutsceneScene.add(dirLight);
  
  // Text overlay
  const textOverlay = document.createElement('div');
  textOverlay.id = 'cutscene-text-overlay';
  textOverlay.style.cssText = `
    position: absolute;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 800px;
    background: rgba(0,0,0,0.8);
    border: 2px solid #87CEEB;
    border-radius: 15px;
    padding: 25px;
    text-align: center;
    color: white;
  `;
  box.appendChild(textOverlay);
  
  // Function to create a cat for cutscene
  function createCutsceneCat(color, x, z, eyeColor = 0xFFD700) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    
    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), mat);
    body.scale.set(1, 0.7, 1.3);
    body.position.y = 0.35;
    group.add(body);
    
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), mat);
    head.position.set(0, 0.6, 0.4);
    group.add(head);
    
    // Ears
    const earMat = mat;
    const earL = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 4), earMat);
    earL.position.set(-0.15, 0.85, 0.35);
    group.add(earL);
    const earR = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 4), earMat);
    earR.position.set(0.15, 0.85, 0.35);
    group.add(earR);
    
    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), eyeMat);
    eyeL.position.set(-0.1, 0.65, 0.65);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), eyeMat);
    eyeR.position.set(0.1, 0.65, 0.65);
    group.add(eyeR);
    
    // Tail
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.3, -0.5),
      new THREE.Vector3(0, 0.5, -0.7),
      new THREE.Vector3(0.1, 0.7, -0.5)
    ]);
    const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 12, 0.05, 8, false), mat);
    group.add(tail);
    
    group.position.set(x, 0, z);
    return group;
  }
  
  // Function to setup different scene backgrounds
  function setupCutsceneBackground(type) {
    // Clear existing objects
    while(cutsceneScene.children.length > 2) { // Keep lights
      cutsceneScene.remove(cutsceneScene.children[2]);
    }
    
    if (type === 'house_exterior') {
      cutsceneScene.background = new THREE.Color(0x87CEEB); // Blue sky
      
      // Ground
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshStandardMaterial({ color: 0x228B22 })
      );
      ground.rotation.x = -Math.PI / 2;
      cutsceneScene.add(ground);
      
      // House
      const house = new THREE.Mesh(
        new THREE.BoxGeometry(8, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0xDEB887 })
      );
      house.position.set(0, 3, -5);
      cutsceneScene.add(house);
      
      // Roof
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(7, 3, 4),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
      );
      roof.position.set(0, 7.5, -5);
      roof.rotation.y = Math.PI / 4;
      cutsceneScene.add(roof);
      
      // Door
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 3, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x654321 })
      );
      door.position.set(0, 1.5, -1);
      cutsceneScene.add(door);
      
      // Windows
      const winMat = new THREE.MeshBasicMaterial({ color: 0xFFFF99 });
      const win1 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), winMat);
      win1.position.set(-2, 4, -0.9);
      cutsceneScene.add(win1);
      const win2 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), winMat);
      win2.position.set(2, 4, -0.9);
      cutsceneScene.add(win2);
      
      cutsceneCamera.position.set(0, 5, 12);
      cutsceneCamera.lookAt(0, 3, -5);
      
    } else if (type === 'house_interior') {
      cutsceneScene.background = new THREE.Color(0xFFF8E7); // Warm interior
      
      // Floor
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(15, 15),
        new THREE.MeshStandardMaterial({ color: 0xB8860B })
      );
      floor.rotation.x = -Math.PI / 2;
      cutsceneScene.add(floor);
      
      // Walls
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xFFF8DC });
      const backWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 8), wallMat);
      backWall.position.set(0, 4, -7);
      cutsceneScene.add(backWall);
      
      // Couch
      const couchMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const couch = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 2), couchMat);
      couch.position.set(-2, 0.5, -4);
      cutsceneScene.add(couch);
      const couchBack = new THREE.Mesh(new THREE.BoxGeometry(5, 1.5, 0.3), couchMat);
      couchBack.position.set(-2, 1.25, -4.85);
      cutsceneScene.add(couchBack);
      
      // Cat basket
      const basket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1, 0.4, 24),
        new THREE.MeshStandardMaterial({ color: 0x8B7355 })
      );
      basket.position.set(3, 0.2, -3);
      cutsceneScene.add(basket);
      
      // Window with light
      const window1 = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 2.5),
        new THREE.MeshBasicMaterial({ color: 0x87CEEB })
      );
      window1.position.set(0, 5, -6.9);
      cutsceneScene.add(window1);
      
      cutsceneCamera.position.set(0, 4, 6);
      cutsceneCamera.lookAt(0, 1, -3);
    }
  }
  
  function showNext() {
    if (currentIndex >= cutsceneData.length) {
      cleanupAndFinish();
      return;
    }
    
    const sceneData = cutsceneData[currentIndex];
    
    if (sceneData.type === 'scene') {
      setupCutsceneBackground(sceneData.background);
      textOverlay.innerHTML = `
        <p style="font-size: 22px; line-height: 1.6; margin: 0;">${sceneData.text}</p>
        <p style="font-size: 13px; color: #888; margin-top: 15px;">Click or press Space to continue</p>
      `;
    } else if (sceneData.type === 'character_intro') {
      // Show the cat being introduced in the scene
      setupCutsceneBackground('house_interior');
      
      // Add the character cat in the center
      let catColor, eyeColor;
      switch(sceneData.name) {
        case 'Quince': catColor = 0xFFE4B5; eyeColor = 0x90EE90; break;
        case 'Socks': catColor = 0x555555; eyeColor = 0xFFD700; break;
        case 'Ruby': catColor = 0x8B4513; eyeColor = 0x90EE90; break;
        case 'Tiny': catColor = 0x1a1a1a; eyeColor = 0x87CEEB; break;
        default: catColor = 0x888888; eyeColor = 0xFFD700;
      }
      
      const cat = createCutsceneCat(catColor, 0, -2, eyeColor);
      cat.scale.set(2, 2, 2); // Make it bigger for intro
      cat.position.y = 0;
      cutsceneScene.add(cat);
      
      // If it's Tiny, add the white paw
      if (sceneData.name === 'Tiny') {
        const whitePaw = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.15, 0.3, 8),
          new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
        );
        whitePaw.position.set(-0.25, 0.15, 0.3);
        cat.add(whitePaw);
      }
      
      cutsceneCamera.position.set(0, 2, 3);
      cutsceneCamera.lookAt(0, 0.8, -2);
      
      const isPlayer = sceneData.isPlayer;
      textOverlay.innerHTML = `
        <div style="font-size: 36px; font-weight: 900; color: ${isPlayer ? '#87CEEB' : '#fff'}; margin-bottom: 5px; font-family: 'Creepster', cursive;">${sceneData.name}</div>
        <div style="font-size: 16px; color: ${isPlayer ? '#87CEEB' : '#e94560'}; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 3px;">${sceneData.title}</div>
        <div style="font-size: 16px; color: #ccc;">${sceneData.description}</div>
        <p style="font-size: 13px; color: #888; margin-top: 15px;">Click or press Space to continue</p>
      `;
    }
    
    GameData.SoundManager.playDialogue();
    currentIndex++;
  }
  
  // Animation loop for cutscene
  let cutsceneAnimating = true;
  function animateCutscene() {
    if (!cutsceneAnimating) return;
    requestAnimationFrame(animateCutscene);
    cutsceneRenderer.render(cutsceneScene, cutsceneCamera);
  }
  animateCutscene();
  
  function cleanupAndFinish() {
    cutsceneAnimating = false;
    document.removeEventListener('click', handleCutsceneContinue);
    document.removeEventListener('keydown', handleCutsceneContinue);
    const box = document.getElementById('cutscene-box');
    if (box) box.remove();
    GameState.isInDialogue = false;
    if (callback) callback();
  }
  
  const handleCutsceneContinue = (e) => {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (e.target.tagName === 'BUTTON') return;
    
    if (currentIndex < cutsceneData.length) {
      showNext();
    } else {
      cleanupAndFinish();
    }
  };
  
  document.addEventListener('click', handleCutsceneContinue);
  document.addEventListener('keydown', handleCutsceneContinue);
  
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
  
  // Player starts in basket for chapter 1 (hiding spot for hide and seek)
  if (chapterNum === 1) {
    // Start by the edge of the couch (hiding spot)
    camera.position.set(-8.5, 0.4, -9);
    camera.rotation.set(0, Math.PI / 4, 0); // Looking toward room
  } else {
    camera.position.set(0, 0.5, 5);
    camera.rotation.set(0, 0, 0);
  }
  
  setTimeout(() => {
    chapterOverlay.classList.add('hidden');
    
    // Chapter 1: Show opening cutscene with character introductions
    if (chapterNum === 1) {
      // Show the opening cutscene first
      showCutscene(GameData.OPENING_CUTSCENE, () => {
        // Then show the hide and seek narration
        showNarrationSequence(GameData.ALL_DIALOGUE.intro_narration || [
          "You press yourself against the edge of the couch, trying to be invisible...",
          "Your heart pounds with excitement. This is hide and seek!",
          "You can hear Socks counting somewhere in the house...",
          "\"...eight... nine... TEN! Ready or not, here I come!\""
        ], () => {
          showDialogue('hide_seek_start');
        });
      });
    } else if (chapterNum === 2) {
      showNarrationSequence(GameData.ALL_DIALOGUE.intro_narration || [], () => {
        showDialogue('socks_secret');
      });
    } else if (chapterNum === 3) {
      showNarrationSequence(GameData.ALL_DIALOGUE.intro_narration || [], () => {
        showDialogue('forest_edge');
      });
    } else if (chapterNum === 6) {
      showNarrationSequence(GameData.ALL_DIALOGUE.intro_narration || [], () => {
        showDialogue('siblings_see_scars');
      });
    } else if (chapterNum === 7) {
      showNarrationSequence(GameData.ALL_DIALOGUE.intro_narration || [], () => {
        showDialogue('alley_intro');
      });
    } else if (chapterNum === 8) {
      showNarrationSequence(GameData.ALL_DIALOGUE.intro_narration || [], () => {
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
