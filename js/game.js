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
  currentNarrationIndex: 0,
  talkedTo: {}, // Track who we've talked to
  storyProgress: 0, // Track story progress in chapter
  lastTalkedCat: null
};

// Cat figures in the scene
let catFigures = [];

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
const emotionsPanel = document.getElementById('emotions-panel');
const helpPanel = document.getElementById('help-panel');
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
  
  // Make sure all screens start hidden except loading
  titleScreen.classList.add('hidden');
  savesScreen.classList.add('hidden');
  gameScreen.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  controlsHelp.classList.add('hidden');
  dialogueBox.classList.add('hidden');
  narrationBox.classList.add('hidden');
  chapterOverlay.classList.add('hidden');
  battleScreen.classList.add('hidden');
  mobileControls.classList.add('hidden');
  interactHint.classList.add('hidden');
  emotionsPanel.classList.add('hidden');
  helpPanel.classList.add('hidden');
  
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
    // Don't respond if loading screen is still visible
    if (!loadingScreen.classList.contains('hidden')) return;
    // If title screen is visible, go to saves
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
  
  // Action buttons
  document.getElementById('btn-sit').addEventListener('click', () => {
    toggleSit();
  });
  
  document.getElementById('btn-lie').addEventListener('click', () => {
    toggleLieDown();
  });
  
  document.getElementById('btn-jump').addEventListener('click', () => {
    jump();
  });
  
  document.getElementById('btn-meow').addEventListener('click', () => {
    GameData.SoundManager.playMeow();
    showEmote('meow');
  });
  
  document.getElementById('btn-emotions').addEventListener('click', () => {
    const panel = document.getElementById('emotions-panel');
    panel.classList.toggle('hidden');
  });
  
  document.getElementById('close-emotions').addEventListener('click', () => {
    document.getElementById('emotions-panel').classList.add('hidden');
  });
  
  document.getElementById('btn-help').addEventListener('click', () => {
    document.getElementById('help-panel').classList.remove('hidden');
  });
  
  document.getElementById('close-help-panel').addEventListener('click', () => {
    document.getElementById('help-panel').classList.add('hidden');
  });
  
  // New emotion buttons (big panel)
  document.querySelectorAll('.emotion-btn-big').forEach(btn => {
    btn.addEventListener('click', () => {
      const emote = btn.dataset.emote;
      showEmote(emote);
      document.getElementById('emotions-panel').classList.add('hidden');
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
}

// Initialize Three.js with high quality settings
function initThreeJS() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 5, 50);
  
  // First-person camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0.5, 0);
  camera.rotation.order = 'YXZ';
  
  renderer = new THREE.WebGLRenderer({ canvas: gameCanvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
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

// Create Twoleg House environment - High quality cozy house!
function createTwolegHouse() {
  // === FLOOR - Detailed wooden planks ===
  const floorGroup = new THREE.Group();
  const plankMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xC4A46B,
    roughness: 0.7,
    metalness: 0.05
  });
  const darkPlankMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xA68B5B,
    roughness: 0.75,
    metalness: 0.05
  });
  
  // Create individual floor planks for realism
  for (let x = -15; x < 15; x += 0.8) {
    for (let z = -15; z < 15; z += 4) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.1, 3.9),
        Math.random() > 0.5 ? plankMaterial : darkPlankMaterial
      );
      plank.position.set(x + Math.random() * 0.05, 0.05, z + Math.random() * 0.1);
      plank.receiveShadow = true;
      floorGroup.add(plank);
    }
  }
  scene.add(floorGroup);
  
  // Floor base
  const floorBase = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x3D2817 })
  );
  floorBase.rotation.x = -Math.PI / 2;
  floorBase.position.y = 0;
  scene.add(floorBase);
  
  // === WALLS - Textured cream walls with baseboards ===
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFAF0E6,
    roughness: 0.85,
    metalness: 0
  });
  
  const baseboardMaterial = new THREE.MeshStandardMaterial({
    color: 0xF5F5F5,
    roughness: 0.5
  });
  
  // Back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMaterial);
  backWall.position.set(0, 5, -15);
  backWall.receiveShadow = true;
  scene.add(backWall);
  
  // Baseboard back
  const baseboardBack = new THREE.Mesh(new THREE.BoxGeometry(30, 0.4, 0.1), baseboardMaterial);
  baseboardBack.position.set(0, 0.2, -14.95);
  scene.add(baseboardBack);
  
  // Side walls
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-15, 5, 0);
  leftWall.receiveShadow = true;
  scene.add(leftWall);
  
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(15, 5, 0);
  rightWall.receiveShadow = true;
  scene.add(rightWall);
  
  // Front wall
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMaterial);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, 5, 15);
  scene.add(frontWall);
  
  // Crown molding
  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.3 });
  const crownBack = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 0.2), crownMaterial);
  crownBack.position.set(0, 9.85, -14.9);
  scene.add(crownBack);
  
  // === LUXURIOUS COUCH ===
  const couchGroup = new THREE.Group();
  
  // Rich velvet material
  const velvetMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4A2C2A,
    roughness: 0.9,
    metalness: 0
  });
  
  const leatherMaterial = new THREE.MeshStandardMaterial({
    color: 0x5C4033,
    roughness: 0.4,
    metalness: 0.1
  });
  
  // Couch frame/base
  const couchBase = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.6, 3.2),
    leatherMaterial
  );
  couchBase.position.set(0, 0.3, 0);
  couchBase.castShadow = true;
  couchBase.receiveShadow = true;
  couchGroup.add(couchBase);
  
  // Couch back - curved
  const backShape = new THREE.Shape();
  backShape.moveTo(-4, 0);
  backShape.lineTo(-4, 2.2);
  backShape.quadraticCurveTo(-3.8, 2.5, -3.5, 2.5);
  backShape.lineTo(3.5, 2.5);
  backShape.quadraticCurveTo(3.8, 2.5, 4, 2.2);
  backShape.lineTo(4, 0);
  
  const backGeometry = new THREE.ExtrudeGeometry(backShape, { depth: 0.5, bevelEnabled: false });
  const couchBack = new THREE.Mesh(backGeometry, velvetMaterial);
  couchBack.rotation.x = -Math.PI / 2;
  couchBack.rotation.z = Math.PI;
  couchBack.position.set(0, 0.6, -1.35);
  couchBack.castShadow = true;
  couchGroup.add(couchBack);
  
  // Couch arms - rounded
  const armGeometry = new THREE.CylinderGeometry(0.4, 0.5, 3, 16, 1, false, 0, Math.PI);
  const armL = new THREE.Mesh(armGeometry, velvetMaterial);
  armL.rotation.x = Math.PI / 2;
  armL.position.set(-3.7, 0.9, 0);
  armL.castShadow = true;
  couchGroup.add(armL);
  
  const armR = new THREE.Mesh(armGeometry, velvetMaterial);
  armR.rotation.x = Math.PI / 2;
  armR.position.set(3.7, 0.9, 0);
  armR.castShadow = true;
  couchGroup.add(armR);
  
  // Plush seat cushions
  const cushionMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x5D3A3A,
    roughness: 0.95
  });
  
  for (let i = 0; i < 3; i++) {
    const cushion = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.5, 2.2),
      cushionMaterial
    );
    // Round the cushion edges
    cushion.position.set(-2.5 + i * 2.5, 0.85, 0.2);
    cushion.castShadow = true;
    couchGroup.add(cushion);
    
    // Add pillow details on each cushion
    const pillow = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.8 })
    );
    pillow.scale.set(1.5, 0.6, 1);
    pillow.position.set(-2.5 + i * 2.5, 1.2, -0.8);
    pillow.castShadow = true;
    couchGroup.add(pillow);
  }
  
  // Decorative throw pillow
  const throwPillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.6, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.85 })
  );
  throwPillow.position.set(-3.2, 1.1, 0.5);
  throwPillow.rotation.z = 0.3;
  couchGroup.add(throwPillow);
  
  couchGroup.position.set(-5, 0, -10);
  scene.add(couchGroup);
  
  // === WOVEN CAT BASKET ===
  const basketGroup = new THREE.Group();
  
  // Wicker material
  const wickerMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B7355,
    roughness: 0.95,
    metalness: 0
  });
  
  // Create woven basket effect
  const basketRadius = 1.5;
  const basketHeight = 0.6;
  
  // Basket walls - vertical weave
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const strand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, basketHeight, 8),
      wickerMaterial
    );
    strand.position.set(
      Math.cos(angle) * basketRadius,
      basketHeight / 2,
      Math.sin(angle) * basketRadius
    );
    basketGroup.add(strand);
  }
  
  // Horizontal weave rings
  for (let h = 0.1; h < basketHeight; h += 0.12) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(basketRadius, 0.04, 8, 32),
      wickerMaterial
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = h;
    basketGroup.add(ring);
  }
  
  // Basket rim
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0x6B5344, roughness: 0.8 });
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(basketRadius + 0.05, 0.1, 12, 32),
    rimMaterial
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = basketHeight;
  basketGroup.add(rim);
  
  // Fluffy cushion inside
  const fluffMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFF5EE,
    roughness: 1.0
  });
  const fluffCushion = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    fluffMaterial
  );
  fluffCushion.scale.y = 0.3;
  fluffCushion.position.y = 0.15;
  fluffCushion.castShadow = true;
  basketGroup.add(fluffCushion);
  
  basketGroup.position.set(5, 0, -8);
  scene.add(basketGroup);
  
  // === LARGE WINDOWS WITH DETAILED FRAMES ===
  const createWindow = (x, z) => {
    const windowGroup = new THREE.Group();
    
    // Window glass - with slight blue tint and glow
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xADD8E6,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0,
      clearcoat: 1.0
    });
    
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4), glassMaterial);
    glass.position.z = 0.05;
    windowGroup.add(glass);
    
    // Sky/outside visible through window
    const skyMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4), skyMaterial);
    windowGroup.add(sky);
    
    // White wooden frame
    const frameMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFF5,
      roughness: 0.4,
      metalness: 0.05
    });
    
    // Frame pieces
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.25, 0.15), frameMaterial);
    frameTop.position.set(0, 2.1, 0.1);
    frameTop.castShadow = true;
    windowGroup.add(frameTop);
    
    const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.3, 0.2), frameMaterial);
    frameBottom.position.set(0, -2.1, 0.1);
    windowGroup.add(frameBottom);
    
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.5, 0.15), frameMaterial);
    frameLeft.position.set(-2.4, 0, 0.1);
    windowGroup.add(frameLeft);
    
    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.5, 0.15), frameMaterial);
    frameRight.position.set(2.4, 0, 0.1);
    windowGroup.add(frameRight);
    
    // Window dividers
    const dividerV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4, 0.1), frameMaterial);
    dividerV.position.z = 0.08;
    windowGroup.add(dividerV);
    
    const dividerH = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 0.1), frameMaterial);
    dividerH.position.z = 0.08;
    windowGroup.add(dividerH);
    
    // Window sill
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.15, 0.5),
      frameMaterial
    );
    sill.position.set(0, -2.2, 0.25);
    windowGroup.add(sill);
    
    windowGroup.position.set(x, 5, z);
    return windowGroup;
  };
  
  scene.add(createWindow(-6, -14.9));
  scene.add(createWindow(6, -14.9));
  
  // === ELEGANT COFFEE TABLE ===
  const tableGroup = new THREE.Group();
  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: 0x3D2314,
    roughness: 0.5,
    metalness: 0.1
  });
  
  // Glass top
  const glassTopMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.3,
    roughness: 0.05,
    metalness: 0,
    clearcoat: 1.0
  });
  
  const glassTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.08, 2),
    glassTopMaterial
  );
  glassTop.position.y = 1.05;
  tableGroup.add(glassTop);
  
  // Wood frame under glass
  const woodFrame = new THREE.Mesh(
    new THREE.BoxGeometry(3.3, 0.1, 1.8),
    darkWoodMaterial
  );
  woodFrame.position.y = 0.95;
  woodFrame.castShadow = true;
  tableGroup.add(woodFrame);
  
  // Elegant curved legs
  const legCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.1, 0.3, 0),
    new THREE.Vector3(0.05, 0.6, 0),
    new THREE.Vector3(0, 0.9, 0)
  ]);
  
  const legGeometry = new THREE.TubeGeometry(legCurve, 20, 0.08, 8, false);
  const legPositions = [[-1.4, 0, -0.7], [1.4, 0, -0.7], [-1.4, 0, 0.7], [1.4, 0, 0.7]];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, darkWoodMaterial);
    leg.position.set(...pos);
    leg.castShadow = true;
    tableGroup.add(leg);
  });
  
  // Decorative items on table
  const vaseMaterial = new THREE.MeshStandardMaterial({ color: 0x1E4D6B, roughness: 0.3 });
  const vase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 0.5, 16),
    vaseMaterial
  );
  vase.position.set(0.5, 1.35, 0);
  vase.castShadow = true;
  tableGroup.add(vase);
  
  // Small plant in vase
  const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      plantMaterial
    );
    leaf.scale.set(1, 0.3, 1);
    leaf.position.set(0.5 + (Math.random() - 0.5) * 0.15, 1.55 + i * 0.08, (Math.random() - 0.5) * 0.15);
    tableGroup.add(leaf);
  }
  
  tableGroup.position.set(-5, 0, -5);
  scene.add(tableGroup);
  
  // === PLUSH ARMCHAIR ===
  const armchairGroup = new THREE.Group();
  const fabricMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2F4F4F,
    roughness: 0.9
  });
  
  // Seat
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.6, 2.3),
    fabricMaterial
  );
  seat.position.y = 0.5;
  seat.castShadow = true;
  armchairGroup.add(seat);
  
  // Seat cushion
  const seatCushion = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.35, 2),
    new THREE.MeshStandardMaterial({ color: 0x3A5F5F, roughness: 0.95 })
  );
  seatCushion.position.set(0, 0.95, 0.1);
  seatCushion.castShadow = true;
  armchairGroup.add(seatCushion);
  
  // Back - curved and tufted
  const chairBack = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 2.2, 0.5),
    fabricMaterial
  );
  chairBack.position.set(0, 1.6, -1.1);
  chairBack.castShadow = true;
  armchairGroup.add(chairBack);
  
  // Back cushion
  const backCushion = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 1.8, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x3A5F5F, roughness: 0.95 })
  );
  backCushion.position.set(0, 1.6, -0.8);
  armchairGroup.add(backCushion);
  
  // Arms - rounded
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x2A4545, roughness: 0.85 });
  const armGeom = new THREE.CapsuleGeometry(0.3, 1.8, 8, 16);
  
  const armLeft = new THREE.Mesh(armGeom, armMaterial);
  armLeft.rotation.x = Math.PI / 2;
  armLeft.position.set(-1.1, 1, -0.1);
  armLeft.castShadow = true;
  armchairGroup.add(armLeft);
  
  const armRight = new THREE.Mesh(armGeom, armMaterial);
  armRight.rotation.x = Math.PI / 2;
  armRight.position.set(1.1, 1, -0.1);
  armRight.castShadow = true;
  armchairGroup.add(armRight);
  
  // Wooden legs
  const woodLegMat = new THREE.MeshStandardMaterial({ color: 0x4A3520, roughness: 0.6 });
  const chairLegPositions = [[-0.9, 0, 0.8], [0.9, 0, 0.8], [-0.9, 0, -0.8], [0.9, 0, -0.8]];
  chairLegPositions.forEach(pos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8), woodLegMat);
    leg.position.set(pos[0], 0.2, pos[2]);
    armchairGroup.add(leg);
  });
  
  armchairGroup.position.set(8, 0, -5);
  scene.add(armchairGroup);
  
  // === PERSIAN-STYLE RUG ===
  const rugGroup = new THREE.Group();
  
  // Main rug
  const rugMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B0000,
    roughness: 1.0,
    metalness: 0
  });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), rugMaterial);
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.02;
  rug.receiveShadow = true;
  rugGroup.add(rug);
  
  // Decorative border
  const borderMaterial = new THREE.MeshStandardMaterial({ color: 0xDAA520, roughness: 0.9 });
  const borderWidth = 0.4;
  
  const borderTop = new THREE.Mesh(new THREE.PlaneGeometry(10, borderWidth), borderMaterial);
  borderTop.rotation.x = -Math.PI / 2;
  borderTop.position.set(0, 0.025, -3.3);
  rugGroup.add(borderTop);
  
  const borderBottom = new THREE.Mesh(new THREE.PlaneGeometry(10, borderWidth), borderMaterial);
  borderBottom.rotation.x = -Math.PI / 2;
  borderBottom.position.set(0, 0.025, 3.3);
  rugGroup.add(borderBottom);
  
  const borderLeft = new THREE.Mesh(new THREE.PlaneGeometry(borderWidth, 7), borderMaterial);
  borderLeft.rotation.x = -Math.PI / 2;
  borderLeft.position.set(-4.8, 0.025, 0);
  rugGroup.add(borderLeft);
  
  const borderRight = new THREE.Mesh(new THREE.PlaneGeometry(borderWidth, 7), borderMaterial);
  borderRight.rotation.x = -Math.PI / 2;
  borderRight.position.set(4.8, 0.025, 0);
  rugGroup.add(borderRight);
  
  // Center medallion
  const medallion = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 32),
    new THREE.MeshStandardMaterial({ color: 0x191970, roughness: 0.9 })
  );
  medallion.rotation.x = -Math.PI / 2;
  medallion.position.y = 0.03;
  rugGroup.add(medallion);
  
  const innerMedallion = new THREE.Mesh(
    new THREE.CircleGeometry(0.8, 32),
    new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.9 })
  );
  innerMedallion.rotation.x = -Math.PI / 2;
  innerMedallion.position.y = 0.035;
  rugGroup.add(innerMedallion);
  
  rugGroup.position.set(0, 0, -3);
  scene.add(rugGroup);
  
  // === BOOKSHELF ===
  const bookshelfGroup = new THREE.Group();
  const shelfWood = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.7 });
  
  // Main frame
  const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.1), shelfWood);
  shelfBack.position.z = -0.25;
  bookshelfGroup.add(shelfBack);
  
  // Shelves
  for (let y = 0; y < 4; y++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 0.5), shelfWood);
    shelf.position.y = -1.5 + y * 1.2;
    shelf.castShadow = true;
    bookshelfGroup.add(shelf);
  }
  
  // Side panels
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 0.5), shelfWood);
  sideL.position.set(-1.45, 0.5, 0);
  bookshelfGroup.add(sideL);
  
  const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 0.5), shelfWood);
  sideR.position.set(1.45, 0.5, 0);
  bookshelfGroup.add(sideR);
  
  // Books
  const bookColors = [0x8B0000, 0x006400, 0x00008B, 0x4B0082, 0x8B4513, 0x2F4F4F];
  for (let shelf = 0; shelf < 3; shelf++) {
    let x = -1.2;
    while (x < 1.1) {
      const bookWidth = 0.08 + Math.random() * 0.12;
      const bookHeight = 0.6 + Math.random() * 0.3;
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(bookWidth, bookHeight, 0.35),
        new THREE.MeshStandardMaterial({ 
          color: bookColors[Math.floor(Math.random() * bookColors.length)],
          roughness: 0.8
        })
      );
      book.position.set(x, -1.0 + shelf * 1.2 + bookHeight / 2, 0);
      book.rotation.z = (Math.random() - 0.5) * 0.1;
      bookshelfGroup.add(book);
      x += bookWidth + 0.02;
    }
  }
  
  bookshelfGroup.position.set(13, 2.5, -5);
  bookshelfGroup.rotation.y = -Math.PI / 2;
  scene.add(bookshelfGroup);
  
  // === CAT CHARACTERS - High Quality ===
  // Clear previous cats
  catFigures = [];
  
  // Socks - standing near the rug, looking smug
  const socks = createCatFigure(2, 0, -2, 0x555555, 'Socks', true);
  socks.rotation.y = Math.PI / 2;
  catFigures.push(socks);
  
  // Ruby - near Socks, following his lead
  const ruby = createCatFigure(0, 0, -1, 0x8B4513, 'Ruby');
  ruby.rotation.y = Math.PI / 3;
  catFigures.push(ruby);
  
  // Quince (mother) - resting on the couch
  const quince = createCatFigure(-5, 1.15, -9.5, 0xFFE4B5, 'Quince');
  quince.rotation.y = Math.PI / 6;
  catFigures.push(quince);
  
  // === PREMIUM LIGHTING ===
  scene.background = new THREE.Color(0xFFF8E7);
  scene.fog = new THREE.Fog(0xFFF8E7, 15, 45);
  
  // Main sunlight from windows - warm and bright
  const sunLight = new THREE.DirectionalLight(0xFFF5E6, 1.2);
  sunLight.position.set(0, 15, -20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 50;
  sunLight.shadow.camera.left = -20;
  sunLight.shadow.camera.right = 20;
  sunLight.shadow.camera.top = 20;
  sunLight.shadow.camera.bottom = -20;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);
  
  // Warm ambient fill
  const warmAmbient = new THREE.AmbientLight(0xFFE4C4, 0.4);
  scene.add(warmAmbient);
  
  // Soft hemisphere light for natural sky/ground bounce
  const hemiLight = new THREE.HemisphereLight(0xFFF5E1, 0xC4A46B, 0.3);
  scene.add(hemiLight);
  
  // Point lights for cozy atmosphere
  const lampLight1 = new THREE.PointLight(0xFFD700, 0.5, 8);
  lampLight1.position.set(-5, 2, -5);
  scene.add(lampLight1);
  
  const lampLight2 = new THREE.PointLight(0xFFD700, 0.3, 6);
  lampLight2.position.set(8, 2, -5);
  scene.add(lampLight2);
}

// Create Forest environment - Atmospheric and detailed
function createForest() {
  // === GROUND - Detailed forest floor ===
  const groundGroup = new THREE.Group();
  
  // Base ground
  const groundBase = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ 
      color: 0x2B3D1F,
      roughness: 1.0
    })
  );
  groundBase.rotation.x = -Math.PI / 2;
  groundBase.receiveShadow = true;
  groundGroup.add(groundBase);
  
  // Forest floor details - fallen leaves, dirt patches
  const leafColors = [0x4A5D23, 0x3D4E1C, 0x5C6B2F, 0x4E3D2D, 0x6B5D4D];
  for (let i = 0; i < 200; i++) {
    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 80;
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(0.3 + Math.random() * 0.5, 8),
      new THREE.MeshStandardMaterial({ 
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        roughness: 1.0
      })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, 0.01, z);
    groundGroup.add(patch);
  }
  
  scene.add(groundGroup);
  
  // === TREES - Varied and detailed ===
  const createTree = (x, z, size = 1) => {
    const treeGroup = new THREE.Group();
    const height = 4 + Math.random() * 3;
    
    // Trunk with bark texture feel
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3D2817,
      roughness: 0.95
    });
    
    // Main trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2 * size, 0.35 * size, height, 12),
      trunkMaterial
    );
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);
    
    // Root bumps
    for (let r = 0; r < 5; r++) {
      const angle = (r / 5) * Math.PI * 2;
      const root = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 * size, 8, 8),
        trunkMaterial
      );
      root.scale.set(1, 0.4, 2);
      root.position.set(Math.cos(angle) * 0.3, 0.1, Math.sin(angle) * 0.3);
      root.rotation.y = angle;
      treeGroup.add(root);
    }
    
    // Foliage layers
    const leafMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1B4D1B,
      roughness: 0.9
    });
    const lightLeafMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x228B22,
      roughness: 0.9
    });
    
    // Multiple foliage spheres for fuller look
    const foliagePositions = [
      { y: height, r: 1.8 },
      { y: height + 0.8, r: 1.4 },
      { y: height + 1.4, r: 0.9 },
      { y: height - 0.5, r: 1.5 }
    ];
    
    foliagePositions.forEach((f, i) => {
      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(f.r * size, 16, 16),
        i % 2 === 0 ? leafMaterial : lightLeafMaterial
      );
      foliage.position.y = f.y;
      foliage.position.x = (Math.random() - 0.5) * 0.5;
      foliage.position.z = (Math.random() - 0.5) * 0.5;
      foliage.castShadow = true;
      treeGroup.add(foliage);
    });
    
    treeGroup.position.set(x, 0, z);
    return treeGroup;
  };
  
  // Place trees
  for (let i = 0; i < 60; i++) {
    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 80;
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
    
    const tree = createTree(x, z, 0.7 + Math.random() * 0.6);
    scene.add(tree);
  }
  
  // === UNDERGROWTH - Bushes and ferns ===
  const bushMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2D5A27,
    roughness: 0.95
  });
  
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 60;
    const z = (Math.random() - 0.5) * 60;
    if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;
    
    const bushGroup = new THREE.Group();
    const bushCount = 2 + Math.floor(Math.random() * 3);
    
    for (let b = 0; b < bushCount; b++) {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 12, 12),
        bushMaterial
      );
      bush.position.set(
        (Math.random() - 0.5) * 0.5,
        0.2 + Math.random() * 0.1,
        (Math.random() - 0.5) * 0.5
      );
      bush.scale.y = 0.7;
      bush.castShadow = true;
      bushGroup.add(bush);
    }
    
    bushGroup.position.set(x, 0, z);
    scene.add(bushGroup);
  }
  
  // === ROCKS ===
  const rockMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x5A5A5A,
    roughness: 0.9
  });
  
  for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 70;
    const z = (Math.random() - 0.5) * 70;
    
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.4, 1),
      rockMaterial
    );
    rock.position.set(x, 0.2, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.scale.y = 0.6;
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }
  
  // === FALLEN LOGS ===
  const logMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3D2817,
    roughness: 0.95
  });
  
  for (let i = 0; i < 8; i++) {
    const x = (Math.random() - 0.5) * 50;
    const z = (Math.random() - 0.5) * 50;
    if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
    
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 2 + Math.random() * 2, 12),
      logMaterial
    );
    log.rotation.z = Math.PI / 2;
    log.rotation.y = Math.random() * Math.PI;
    log.position.set(x, 0.2, z);
    log.castShadow = true;
    scene.add(log);
  }
  
  // === MOONLIT ATMOSPHERE ===
  scene.background = new THREE.Color(0x0D1520);
  scene.fog = new THREE.FogExp2(0x0D1520, 0.04);
  
  // Moonlight
  const moonLight = new THREE.DirectionalLight(0xB0C4DE, 0.4);
  moonLight.position.set(20, 30, 10);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 2048;
  moonLight.shadow.mapSize.height = 2048;
  moonLight.shadow.camera.near = 0.5;
  moonLight.shadow.camera.far = 100;
  moonLight.shadow.camera.left = -40;
  moonLight.shadow.camera.right = 40;
  moonLight.shadow.camera.top = 40;
  moonLight.shadow.camera.bottom = -40;
  scene.add(moonLight);
  
  // Ambient night light
  const nightAmbient = new THREE.AmbientLight(0x2F3A4A, 0.3);
  scene.add(nightAmbient);
  
  // Hemisphere for sky/ground color
  const hemiLight = new THREE.HemisphereLight(0x1A2030, 0x1B2D1B, 0.2);
  scene.add(hemiLight);
}

// Create Twolegplace (alley) environment - Gritty urban atmosphere
function createTwolegplace() {
  // === GROUND - Cracked concrete and asphalt ===
  const groundBase = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ 
      color: 0x3A3A3A,
      roughness: 0.95
    })
  );
  groundBase.rotation.x = -Math.PI / 2;
  groundBase.receiveShadow = true;
  scene.add(groundBase);
  
  // Asphalt patches and cracks
  const patchColors = [0x2D2D2D, 0x404040, 0x353535, 0x4A4A4A];
  for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.5) * 50;
    const z = (Math.random() - 0.5) * 50;
    const patch = new THREE.Mesh(
      new THREE.PlaneGeometry(1 + Math.random() * 2, 0.5 + Math.random()),
      new THREE.MeshStandardMaterial({ 
        color: patchColors[Math.floor(Math.random() * patchColors.length)],
        roughness: 0.9
      })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = Math.random() * Math.PI;
    patch.position.set(x, 0.01, z);
    scene.add(patch);
  }
  
  // Puddles
  const puddleMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x2A3540,
    roughness: 0.1,
    metalness: 0.3,
    clearcoat: 1.0
  });
  
  for (let i = 0; i < 8; i++) {
    const x = (Math.random() - 0.5) * 40;
    const z = (Math.random() - 0.5) * 40;
    const puddle = new THREE.Mesh(
      new THREE.CircleGeometry(0.5 + Math.random() * 1, 16),
      puddleMaterial
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, 0.02, z);
    scene.add(puddle);
  }
  
  // === BUILDINGS - Detailed brick buildings ===
  const createBuilding = (x, z, width, height, depth) => {
    const buildingGroup = new THREE.Group();
    
    // Main structure
    const brickColors = [0x8B4513, 0x6B3D2E, 0x5C4033, 0x704030, 0x604030];
    const brickMaterial = new THREE.MeshStandardMaterial({
      color: brickColors[Math.floor(Math.random() * brickColors.length)],
      roughness: 0.9
    });
    
    const main = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      brickMaterial
    );
    main.position.y = height / 2;
    main.castShadow = true;
    main.receiveShadow = true;
    buildingGroup.add(main);
    
    // Windows
    const windowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1A1A2E,
      roughness: 0.3,
      metalness: 0.2
    });
    const litWindowMaterial = new THREE.MeshBasicMaterial({ color: 0xFFE4B5 });
    
    const windowRows = Math.floor(height / 3);
    const windowCols = Math.floor(width / 2);
    
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const isLit = Math.random() > 0.7;
        const window = new THREE.Mesh(
          new THREE.PlaneGeometry(0.8, 1.2),
          isLit ? litWindowMaterial : windowMaterial
        );
        window.position.set(
          -width / 2 + 1 + col * 2,
          2 + row * 3,
          depth / 2 + 0.01
        );
        buildingGroup.add(window);
        
        // Window frame
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x2F2F2F });
        const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.05), frameMat);
        frameTop.position.set(window.position.x, window.position.y + 0.6, depth / 2 + 0.02);
        buildingGroup.add(frameTop);
      }
    }
    
    // Roof edge
    const roofEdge = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.3, 0.3, depth + 0.3),
      new THREE.MeshStandardMaterial({ color: 0x2F2F2F, roughness: 0.8 })
    );
    roofEdge.position.y = height + 0.15;
    buildingGroup.add(roofEdge);
    
    buildingGroup.position.set(x, 0, z);
    return buildingGroup;
  };
  
  // Place buildings along sides
  scene.add(createBuilding(-12, -15, 8, 18, 8));
  scene.add(createBuilding(-12, -25, 6, 14, 7));
  scene.add(createBuilding(12, -15, 7, 20, 8));
  scene.add(createBuilding(12, -26, 8, 16, 7));
  scene.add(createBuilding(0, -30, 10, 12, 6));
  
  // === DUMPSTER - Detailed ===
  const dumpsterGroup = new THREE.Group();
  
  const dumpsterMat = new THREE.MeshStandardMaterial({ 
    color: 0x2D4A2D,
    roughness: 0.7,
    metalness: 0.3
  });
  
  // Main container
  const dumpsterBody = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.8, 2),
    dumpsterMat
  );
  dumpsterBody.position.y = 0.9;
  dumpsterBody.castShadow = true;
  dumpsterGroup.add(dumpsterBody);
  
  // Lid (slightly open)
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.1, 2),
    dumpsterMat
  );
  lid.position.set(0, 1.85, 0.3);
  lid.rotation.x = -0.3;
  dumpsterGroup.add(lid);
  
  // Wheels
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.6 });
  [[-1.2, 0], [1.2, 0]].forEach(pos => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16),
      wheelMat
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos[0], 0.15, 1);
    dumpsterGroup.add(wheel);
  });
  
  // Trash bags visible
  const trashMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const bag = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      trashMat
    );
    bag.position.set(-0.5 + i * 0.6, 1.9 + Math.random() * 0.2, (Math.random() - 0.5) * 0.5);
    bag.scale.set(1, 0.7, 1);
    dumpsterGroup.add(bag);
  }
  
  dumpsterGroup.position.set(-5, 0, -8);
  scene.add(dumpsterGroup);
  
  // === SCATTERED DEBRIS ===
  // Cardboard boxes
  const cardboardMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.95 });
  for (let i = 0; i < 6; i++) {
    const x = -8 + Math.random() * 16;
    const z = -5 - Math.random() * 10;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.5 + Math.random() * 0.5, 0.3 + Math.random() * 0.3, 0.4 + Math.random() * 0.3),
      cardboardMat
    );
    box.position.set(x, 0.2, z);
    box.rotation.y = Math.random() * Math.PI;
    box.castShadow = true;
    scene.add(box);
  }
  
  // Trash cans
  const trashCanMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.6, metalness: 0.4 });
  [-8, 8].forEach(x => {
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 0.9, 16),
      trashCanMat
    );
    can.position.set(x, 0.45, -4);
    can.castShadow = true;
    scene.add(can);
    
    // Lid
    const canLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16),
      trashCanMat
    );
    canLid.position.set(x + 0.1, 0.95, -4);
    canLid.rotation.z = 0.3;
    scene.add(canLid);
  });
  
  // === CHAIN LINK FENCE ===
  const fenceMat = new THREE.MeshStandardMaterial({ 
    color: 0x6B6B6B,
    roughness: 0.5,
    metalness: 0.6
  });
  
  // Fence posts
  for (let x = -20; x <= 20; x += 5) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 3, 8),
      fenceMat
    );
    post.position.set(x, 1.5, 10);
    post.castShadow = true;
    scene.add(post);
  }
  
  // Fence mesh (simplified as planes)
  const fenceMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 3),
    new THREE.MeshStandardMaterial({ 
      color: 0x7A7A7A,
      roughness: 0.4,
      metalness: 0.5,
      transparent: true,
      opacity: 0.7
    })
  );
  fenceMesh.position.set(0, 1.5, 10);
  scene.add(fenceMesh);
  
  // === STREET LAMP ===
  const lampGroup = new THREE.Group();
  
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, metalness: 0.6 });
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 5, 8),
    poleMat
  );
  pole.position.y = 2.5;
  lampGroup.add(pole);
  
  // Lamp head
  const lampHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.3, 0.3),
    poleMat
  );
  lampHead.position.set(0.3, 5, 0);
  lampGroup.add(lampHead);
  
  // Light bulb
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xFFE4B5 })
  );
  bulb.position.set(0.3, 4.8, 0);
  lampGroup.add(bulb);
  
  // Point light from lamp
  const lampLight = new THREE.PointLight(0xFFE4B5, 0.8, 12);
  lampLight.position.set(0.3, 4.8, 0);
  lampLight.castShadow = true;
  lampGroup.add(lampLight);
  
  lampGroup.position.set(6, 0, -2);
  scene.add(lampGroup);
  
  // Second lamp
  const lamp2 = lampGroup.clone();
  lamp2.position.set(-6, 0, -12);
  scene.add(lamp2);
  
  // === DARK URBAN ATMOSPHERE ===
  scene.background = new THREE.Color(0x12141A);
  scene.fog = new THREE.FogExp2(0x12141A, 0.05);
  
  // Dim ambient
  const ambientLight = new THREE.AmbientLight(0x3A4050, 0.3);
  scene.add(ambientLight);
  
  // Slight moonlight
  const moonLight = new THREE.DirectionalLight(0x6080A0, 0.2);
  moonLight.position.set(-10, 20, 10);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 2048;
  moonLight.shadow.mapSize.height = 2048;
  scene.add(moonLight);
}

// Create high-quality realistic cat figure
function createCatFigure(x, y, z, color, name, hasWhitePaws = false) {
  const group = new THREE.Group();
  
  // Fur-like material
  const furMaterial = new THREE.MeshStandardMaterial({ 
    color,
    roughness: 0.95,
    metalness: 0
  });
  
  // Slightly darker shade for depth
  const darkerColor = new THREE.Color(color).multiplyScalar(0.8);
  const darkFurMaterial = new THREE.MeshStandardMaterial({
    color: darkerColor,
    roughness: 0.95,
    metalness: 0
  });
  
  // === BODY - Realistic cat proportions ===
  // Main body (torso)
  const bodyGeometry = new THREE.CapsuleGeometry(0.28, 0.6, 16, 32);
  const body = new THREE.Mesh(bodyGeometry, furMaterial);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.35, 0);
  body.scale.set(1, 1, 0.85);
  body.castShadow = true;
  group.add(body);
  
  // Chest/shoulders (front of body)
  const chest = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 32, 32),
    furMaterial
  );
  chest.scale.set(0.9, 0.85, 0.8);
  chest.position.set(0, 0.38, 0.35);
  chest.castShadow = true;
  group.add(chest);
  
  // Hindquarters
  const hind = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 32, 32),
    furMaterial
  );
  hind.scale.set(0.95, 0.85, 0.9);
  hind.position.set(0, 0.35, -0.35);
  hind.castShadow = true;
  group.add(hind);
  
  // === HEAD - Detailed cat head ===
  const headGroup = new THREE.Group();
  
  // Main head shape
  const headBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 32, 32),
    furMaterial
  );
  headBase.scale.set(1, 0.9, 0.95);
  headBase.castShadow = true;
  headGroup.add(headBase);
  
  // Snout/muzzle
  const snout = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 32, 32),
    furMaterial
  );
  snout.scale.set(0.8, 0.6, 0.7);
  snout.position.set(0, -0.05, 0.18);
  headGroup.add(snout);
  
  // Cheeks
  const cheekL = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    furMaterial
  );
  cheekL.position.set(-0.12, -0.02, 0.12);
  headGroup.add(cheekL);
  
  const cheekR = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    furMaterial
  );
  cheekR.position.set(0.12, -0.02, 0.12);
  headGroup.add(cheekR);
  
  // === EARS - Triangular with inner detail ===
  const earMaterial = furMaterial;
  const earInnerMat = new THREE.MeshStandardMaterial({ 
    color: 0xE8B4B8,
    roughness: 0.7
  });
  
  // Create ear shape
  const earShape = new THREE.Shape();
  earShape.moveTo(0, 0);
  earShape.lineTo(-0.06, 0);
  earShape.lineTo(0, 0.15);
  earShape.lineTo(0.06, 0);
  earShape.lineTo(0, 0);
  
  const earGeometry = new THREE.ExtrudeGeometry(earShape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3
  });
  
  const earL = new THREE.Mesh(earGeometry, earMaterial);
  earL.position.set(-0.1, 0.18, 0);
  earL.rotation.set(-0.2, -0.15, -0.2);
  earL.castShadow = true;
  headGroup.add(earL);
  
  const earR = new THREE.Mesh(earGeometry, earMaterial);
  earR.position.set(0.1, 0.18, 0);
  earR.rotation.set(-0.2, 0.15, 0.2);
  earR.castShadow = true;
  headGroup.add(earR);
  
  // Inner ears
  const innerEarGeom = new THREE.PlaneGeometry(0.06, 0.1);
  const earInnerL = new THREE.Mesh(innerEarGeom, earInnerMat);
  earInnerL.position.set(-0.1, 0.22, 0.015);
  earInnerL.rotation.set(-0.2, -0.15, -0.2);
  headGroup.add(earInnerL);
  
  const earInnerR = new THREE.Mesh(innerEarGeom, earInnerMat);
  earInnerR.position.set(0.1, 0.22, 0.015);
  earInnerR.rotation.set(-0.2, 0.15, 0.2);
  headGroup.add(earInnerR);
  
  // === EYES - Realistic cat eyes ===
  const eyeColors = {
    'Tiny': 0x87CEEB,    // Ice blue
    'Scourge': 0x87CEEB,
    'Quince': 0x90EE90,  // Soft green
    'Socks': 0xDAA520,   // Amber
    'Ruby': 0xB8860B     // Dark amber
  };
  const eyeColor = eyeColors[name] || 0xFFD700;
  
  // Eye sockets (slight indent)
  const eyeSocketMat = new THREE.MeshStandardMaterial({ color: darkerColor, roughness: 0.9 });
  
  [-1, 1].forEach(side => {
    const socketX = side * 0.09;
    
    // Eye white/sclera
    const sclera = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.3 })
    );
    sclera.scale.set(1, 0.7, 0.5);
    sclera.position.set(socketX, 0.05, 0.18);
    headGroup.add(sclera);
    
    // Iris
    const iris = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 32),
      new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.3 })
    );
    iris.position.set(socketX, 0.05, 0.21);
    headGroup.add(iris);
    
    // Pupil (vertical slit)
    const pupilShape = new THREE.Shape();
    pupilShape.ellipse(0, 0, 0.008, 0.03, 0, Math.PI * 2);
    const pupilGeom = new THREE.ShapeGeometry(pupilShape);
    const pupil = new THREE.Mesh(
      pupilGeom,
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    pupil.position.set(socketX, 0.05, 0.215);
    headGroup.add(pupil);
    
    // Eye shine/reflection
    const shine = new THREE.Mesh(
      new THREE.CircleGeometry(0.012, 16),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    );
    shine.position.set(socketX + 0.015, 0.065, 0.22);
    headGroup.add(shine);
  });
  
  // === NOSE - Detailed cat nose ===
  const noseShape = new THREE.Shape();
  noseShape.moveTo(0, 0);
  noseShape.lineTo(-0.025, 0.015);
  noseShape.quadraticCurveTo(-0.03, 0.03, -0.02, 0.04);
  noseShape.lineTo(0.02, 0.04);
  noseShape.quadraticCurveTo(0.03, 0.03, 0.025, 0.015);
  noseShape.lineTo(0, 0);
  
  const noseGeom = new THREE.ExtrudeGeometry(noseShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2
  });
  
  const noseMat = new THREE.MeshStandardMaterial({ 
    color: 0xE8A0A0,
    roughness: 0.4,
    metalness: 0.1
  });
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.02, 0.26);
  headGroup.add(nose);
  
  // Mouth line
  const mouthCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.03, -0.08, 0.22),
    new THREE.Vector3(0, -0.1, 0.24),
    new THREE.Vector3(0.03, -0.08, 0.22)
  );
  const mouthGeom = new THREE.TubeGeometry(mouthCurve, 12, 0.004, 8, false);
  const mouth = new THREE.Mesh(mouthGeom, new THREE.MeshStandardMaterial({ color: 0x3D2817 }));
  headGroup.add(mouth);
  
  // === WHISKERS ===
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xE8E8E8 });
  [-1, 1].forEach(side => {
    for (let i = 0; i < 3; i++) {
      const whiskerCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(side * 0.1, -0.04 + i * 0.025, 0.2),
        new THREE.Vector3(side * 0.2, -0.05 + i * 0.02, 0.18),
        new THREE.Vector3(side * 0.28, -0.06 + i * 0.015 + Math.random() * 0.02, 0.15)
      );
      const whiskerGeom = new THREE.TubeGeometry(whiskerCurve, 8, 0.003, 4, false);
      const whisker = new THREE.Mesh(whiskerGeom, whiskerMat);
      headGroup.add(whisker);
    }
  });
  
  headGroup.position.set(0, 0.55, 0.5);
  group.add(headGroup);
  
  // === LEGS - Proper cat leg anatomy ===
  const whitePawMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFFAF0,
    roughness: 0.9
  });
  
  const legPositions = [
    { x: -0.15, z: 0.25, front: true },  // Front left
    { x: 0.15, z: 0.25, front: true },   // Front right
    { x: -0.18, z: -0.3, front: false }, // Back left
    { x: 0.18, z: -0.3, front: false }   // Back right
  ];
  
  legPositions.forEach((pos, i) => {
    const legGroup = new THREE.Group();
    
    // Determine paw color
    const isPawWhite = hasWhitePaws || (name === 'Tiny' && i === 0);
    const pawMat = isPawWhite ? whitePawMat : furMaterial;
    
    if (pos.front) {
      // Front leg - straighter
      const upperLeg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.045, 0.15, 8, 16),
        furMaterial
      );
      upperLeg.position.y = 0.2;
      legGroup.add(upperLeg);
      
      const lowerLeg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.04, 0.12, 8, 16),
        furMaterial
      );
      lowerLeg.position.y = 0.08;
      legGroup.add(lowerLeg);
      
      // Paw
      const paw = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        pawMat
      );
      paw.scale.set(1, 0.5, 1.2);
      paw.position.y = 0.025;
      paw.castShadow = true;
      legGroup.add(paw);
    } else {
      // Back leg - more muscular, angled
      const upperLeg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.055, 0.12, 8, 16),
        furMaterial
      );
      upperLeg.position.set(0, 0.22, -0.02);
      upperLeg.rotation.x = 0.3;
      legGroup.add(upperLeg);
      
      const lowerLeg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.04, 0.14, 8, 16),
        furMaterial
      );
      lowerLeg.position.y = 0.1;
      legGroup.add(lowerLeg);
      
      // Paw
      const paw = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        pawMat
      );
      paw.scale.set(1, 0.5, 1.3);
      paw.position.y = 0.025;
      paw.castShadow = true;
      legGroup.add(paw);
    }
    
    legGroup.position.set(pos.x, 0, pos.z);
    group.add(legGroup);
  });
  
  // === TAIL - Elegant curved tail ===
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.32, -0.55),
    new THREE.Vector3(0, 0.45, -0.7),
    new THREE.Vector3(0.05, 0.6, -0.75),
    new THREE.Vector3(0.1, 0.75, -0.65),
    new THREE.Vector3(0.12, 0.85, -0.5)
  ]);
  
  // Tapered tail
  const tailRadii = [0.05, 0.045, 0.04, 0.03, 0.02];
  const tailSegments = [];
  for (let i = 0; i < 5; i++) {
    const t1 = i / 5;
    const t2 = (i + 1) / 5;
    const segmentCurve = new THREE.CatmullRomCurve3([
      tailCurve.getPoint(t1),
      tailCurve.getPoint((t1 + t2) / 2),
      tailCurve.getPoint(t2)
    ]);
    const segment = new THREE.Mesh(
      new THREE.TubeGeometry(segmentCurve, 8, tailRadii[i], 8, false),
      furMaterial
    );
    segment.castShadow = true;
    group.add(segment);
  }
  
  // === SPECIAL MARKINGS ===
  // Tiny/Scourge has distinctive markings
  if (name === 'Tiny' || name === 'Scourge') {
    // Chest marking (lighter)
    const chestMark = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      whitePawMat
    );
    chestMark.scale.set(0.6, 0.5, 0.3);
    chestMark.position.set(0, 0.35, 0.42);
    group.add(chestMark);
  }
  
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
    case 'KeyC': toggleSit(); break;
    case 'KeyX': toggleLieDown(); break;
    case 'KeyH': 
      document.getElementById('help-panel').classList.toggle('hidden');
      break;
    case 'Escape': 
      // Close any open panels first
      if (!document.getElementById('help-panel').classList.contains('hidden')) {
        document.getElementById('help-panel').classList.add('hidden');
      } else if (!document.getElementById('emotions-panel').classList.contains('hidden')) {
        document.getElementById('emotions-panel').classList.add('hidden');
      } else {
        togglePause();
      }
      break;
    
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
let cameraPitch = 0; // Track pitch separately to prevent gimbal lock
let cameraYaw = 0;

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
  
  // Update yaw (left/right) - no limits
  cameraYaw -= e.movementX * sensitivity;
  
  // Update pitch (up/down) - clamped to prevent flipping
  cameraPitch -= e.movementY * sensitivity;
  const maxPitch = Math.PI / 2 - 0.1; // Stop just before straight up/down
  cameraPitch = Math.max(-maxPitch, Math.min(maxPitch, cameraPitch));
  
  // Apply rotation using YXZ order to prevent gimbal lock
  camera.rotation.order = 'YXZ';
  camera.rotation.y = cameraYaw;
  camera.rotation.x = cameraPitch;
});

// Actions
function jump() {
  if (canJump && !GameState.isLyingDown) {
    playerVelocity.y = 5;
    canJump = false;
  }
}

// Sitting state
let isSitting = false;

function toggleSit() {
  if (GameState.isLyingDown) {
    GameState.isLyingDown = false;
  }
  isSitting = !isSitting;
  if (isSitting) {
    camera.position.y = 0.35; // Lower camera when sitting
    showEmote('sitting');
  } else {
    camera.position.y = 0.5; // Normal standing height
  }
}

function toggleLieDown() {
  if (isSitting) {
    isSitting = false;
  }
  GameState.isLyingDown = !GameState.isLyingDown;
  if (GameState.isLyingDown) {
    camera.position.y = 0.15; // Very low - lying down
    showEmote('tired');
  } else {
    camera.position.y = 0.5; // Normal standing height
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
    meow: '😺',
    love: '😻',
    nervous: '😰',
    sitting: '🐱'
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
  
  // Check if we're in a cat conversation
  if (currentCatConversation) {
    advanceCatConversation();
    return;
  }
  
  const currentDialogue = GameData.ALL_DIALOGUE[GameState.dialogueState];
  if (currentDialogue && currentDialogue.choices) return; // Must pick a choice
  
  advanceDialogue();
}

// Cat conversation system
let currentCatConversation = null;
let catConversationLineIndex = 0;
let catConversationCallback = null;

function showCatDialogue(dialogue, callback) {
  currentCatConversation = dialogue;
  catConversationLineIndex = 0;
  catConversationCallback = callback;
  GameState.isInDialogue = true;
  
  showCatDialogueLine();
}

function showCatDialogueLine() {
  if (!currentCatConversation || catConversationLineIndex >= currentCatConversation.lines.length) {
    endCatConversation();
    return;
  }
  
  const line = currentCatConversation.lines[catConversationLineIndex];
  const speaker = currentCatConversation.speaker;
  const speakerColor = currentCatConversation.speakerColor || '#FFFFFF';
  
  // Show dialogue box
  narrationBox.classList.add('hidden');
  dialogueBox.classList.remove('hidden');
  
  // Set speaker name
  const speakerNameEl = document.getElementById('dialogue-speaker-name');
  speakerNameEl.textContent = speaker;
  speakerNameEl.style.color = speakerColor;
  
  // Set text
  document.getElementById('dialogue-text').textContent = line.text;
  
  // Handle choices or continue
  const choicesContainer = document.getElementById('dialogue-choices');
  const continueHint = document.getElementById('dialogue-continue');
  
  choicesContainer.innerHTML = '';
  
  if (line.choices) {
    continueHint.style.display = 'none';
    line.choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-choice';
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        // Show response
        if (choice.response) {
          document.getElementById('dialogue-text').textContent = choice.response;
          choicesContainer.innerHTML = '';
          continueHint.style.display = 'block';
          
          // Set up to continue to next line after showing response
          const nextLineIndex = choice.next !== undefined ? choice.next : catConversationLineIndex + 1;
          
          setTimeout(() => {
            catConversationLineIndex = nextLineIndex;
          }, 100);
        } else {
          catConversationLineIndex = choice.next !== undefined ? choice.next : catConversationLineIndex + 1;
          showCatDialogueLine();
        }
        GameData.SoundManager.playDialogue();
      });
      choicesContainer.appendChild(btn);
    });
  } else {
    continueHint.style.display = 'block';
  }
  
  GameData.SoundManager.playDialogue();
}

function advanceCatConversation() {
  if (!currentCatConversation) return;
  
  const line = currentCatConversation.lines[catConversationLineIndex];
  
  // Don't advance if there are choices
  if (line && line.choices) return;
  
  catConversationLineIndex++;
  
  if (catConversationLineIndex >= currentCatConversation.lines.length) {
    // Check for onEnd handler
    if (line && line.onEnd) {
      handleConversationEnd(line.onEnd);
    }
    endCatConversation();
  } else {
    showCatDialogueLine();
  }
}

function handleConversationEnd(endType) {
  if (endType === 'socks_bully_done') {
    GameState.talkedTo['Socks_intro'] = true;
    if (GameState.talkedTo['Ruby_intro']) {
      GameState.storyProgress = 2; // Both siblings done, can talk to mom
    } else {
      GameState.storyProgress = 1; // One sibling done
    }
  } else if (endType === 'ruby_bully_done') {
    GameState.talkedTo['Ruby_intro'] = true;
    if (GameState.talkedTo['Socks_intro']) {
      GameState.storyProgress = 2; // Both siblings done, can talk to mom
    } else {
      GameState.storyProgress = 1; // One sibling done
    }
  } else if (endType === 'quince_comfort_done') {
    GameState.talkedTo['Quince_comfort'] = true;
    GameState.storyProgress = 3; // Mom comforted you, chapter can continue
    
    // Show narration about what happens next
    setTimeout(() => {
      showNarrationSequence([
        { text: "You feel a little better after talking to your mother..." },
        { text: "But the cruel words of Socks and Ruby still echo in your mind." },
        { text: "Maybe... maybe they're right. Maybe nobody will want you." },
        { text: "You look out the window at the forest beyond..." },
        { text: "What if you could prove them all wrong?" }
      ], () => {
        // Story continues...
      });
    }, 500);
  }
}

function endCatConversation() {
  currentCatConversation = null;
  GameState.isInDialogue = false;
  dialogueBox.classList.add('hidden');
  
  if (catConversationCallback) {
    catConversationCallback();
    catConversationCallback = null;
  }
}

// Update the startCatConversation to use the new system
function startCatConversation(catName) {
  const dialogueKey = getCatDialogueKey(catName);
  const dialogue = GameData.CAT_DIALOGUES?.[dialogueKey];
  
  if (dialogue) {
    GameState.lastTalkedCat = catName;
    showCatDialogue(dialogue);
  }
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
    
    // Legs - so cats aren't floating!
    const legGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.25, 8);
    const legPositions = [
      [-0.2, 0.12, 0.25],  // Front left
      [0.2, 0.12, 0.25],   // Front right
      [-0.2, 0.12, -0.25], // Back left
      [0.2, 0.12, -0.25]   // Back right
    ];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeom, mat);
      leg.position.set(pos[0], pos[1], pos[2]);
      group.add(leg);
    });
    
    // Paws
    const pawGeom = new THREE.SphereGeometry(0.07, 8, 8);
    legPositions.forEach(pos => {
      const paw = new THREE.Mesh(pawGeom, mat);
      paw.scale.y = 0.5;
      paw.position.set(pos[0], 0.02, pos[2]);
      group.add(paw);
    });
    
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
      
    } else if (type === 'house_interior' || type === 'family_scene') {
      cutsceneScene.background = new THREE.Color(0xFFF8E7); // Warm interior
      
      // Floor with planks
      const floorBase = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({ color: 0xB8860B })
      );
      floorBase.rotation.x = -Math.PI / 2;
      cutsceneScene.add(floorBase);
      
      // Walls
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xFFF8DC });
      const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat);
      backWall.position.set(0, 5, -9);
      cutsceneScene.add(backWall);
      
      const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), wallMat);
      leftWall.rotation.y = Math.PI / 2;
      leftWall.position.set(-10, 5, 0);
      cutsceneScene.add(leftWall);
      
      const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), wallMat);
      rightWall.rotation.y = -Math.PI / 2;
      rightWall.position.set(10, 5, 0);
      cutsceneScene.add(rightWall);
      
      // Couch - bigger and nicer
      const couchMat = new THREE.MeshStandardMaterial({ color: 0x4A2C2A, roughness: 0.9 });
      const couch = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 2.5), couchMat);
      couch.position.set(-3, 0.5, -6);
      cutsceneScene.add(couch);
      const couchBack = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 0.4), couchMat);
      couchBack.position.set(-3, 1.5, -7);
      cutsceneScene.add(couchBack);
      const couchArmL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 2.5), couchMat);
      couchArmL.position.set(-5.8, 0.8, -6);
      cutsceneScene.add(couchArmL);
      const couchArmR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 2.5), couchMat);
      couchArmR.position.set(-0.2, 0.8, -6);
      cutsceneScene.add(couchArmR);
      
      // Cushions
      const cushionMat = new THREE.MeshStandardMaterial({ color: 0x5D3A3A, roughness: 0.95 });
      for (let i = 0; i < 3; i++) {
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 1.8), cushionMat);
        cushion.position.set(-4.5 + i * 2, 1.15, -5.8);
        cutsceneScene.add(cushion);
      }
      
      // Cat basket - detailed
      const basketMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });
      const basketBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.5, 24), basketMat);
      basketBase.position.set(5, 0.25, -4);
      cutsceneScene.add(basketBase);
      const basketRim = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.12, 8, 24), basketMat);
      basketRim.rotation.x = Math.PI / 2;
      basketRim.position.set(5, 0.5, -4);
      cutsceneScene.add(basketRim);
      const basketCushion = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.25, 24),
        new THREE.MeshStandardMaterial({ color: 0xFFF5EE })
      );
      basketCushion.position.set(5, 0.35, -4);
      cutsceneScene.add(basketCushion);
      
      // Windows with light
      const winMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
      const window1 = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), winMat);
      window1.position.set(-4, 5, -8.9);
      cutsceneScene.add(window1);
      const window2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), winMat);
      window2.position.set(4, 5, -8.9);
      cutsceneScene.add(window2);
      
      // Rug
      const rug = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 1 })
      );
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0, 0.01, -2);
      cutsceneScene.add(rug);
      
      // Coffee table
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x3D2314 });
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 1.5), tableMat);
      tableTop.position.set(0, 0.8, -2);
      cutsceneScene.add(tableTop);
      
      // If it's a family scene, add ALL the cats!
      if (type === 'family_scene') {
        // Quince (mother) resting on the couch
        const quince = createCutsceneCat(0xFFE4B5, -3, -5.5, 0x90EE90);
        quince.position.y = 1.2;
        quince.rotation.y = Math.PI * 0.1;
        cutsceneScene.add(quince);
        
        // Socks (gray tabby) - playing on the floor
        const socks = createCutsceneCat(0x555555, -1, -1, 0xFFD700);
        socks.rotation.y = -Math.PI / 4;
        cutsceneScene.add(socks);
        
        // Ruby (brown/ginger) - near the basket
        const ruby = createCutsceneCat(0x8B4513, 3, -2, 0x90EE90);
        ruby.rotation.y = Math.PI / 3;
        cutsceneScene.add(ruby);
        
        // Tiny (black with white paw) - YOU! Near the basket
        const tiny = createCutsceneCat(0x1a1a1a, 5, -3, 0x87CEEB);
        tiny.rotation.y = -Math.PI / 2;
        // Add white paw
        const whitePaw = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8),
          new THREE.MeshStandardMaterial({ color: 0xFFFFF0 })
        );
        whitePaw.position.set(-0.2, 0.1, 0.25);
        tiny.add(whitePaw);
        cutsceneScene.add(tiny);
        
        // Camera showing the whole family
        cutsceneCamera.position.set(1, 4, 8);
        cutsceneCamera.lookAt(0, 1, -3);
      } else {
        cutsceneCamera.position.set(0, 4, 6);
        cutsceneCamera.lookAt(0, 1, -3);
      }
      
      // Warm lighting
      const warmLight = new THREE.PointLight(0xFFE4B5, 0.5, 15);
      warmLight.position.set(0, 6, -2);
      cutsceneScene.add(warmLight);
      
    } else if (type === 'hide_and_seek') {
      // Special scene for hide and seek
      cutsceneScene.background = new THREE.Color(0xFFF8E7);
      
      // Floor
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({ color: 0xB8860B })
      );
      floor.rotation.x = -Math.PI / 2;
      cutsceneScene.add(floor);
      
      // Walls
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xFFF8DC });
      const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat);
      backWall.position.set(0, 5, -9);
      cutsceneScene.add(backWall);
      
      // Couch (hiding spot)
      const couchMat = new THREE.MeshStandardMaterial({ color: 0x4A2C2A });
      const couch = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 2.5), couchMat);
      couch.position.set(-4, 0.5, -6);
      cutsceneScene.add(couch);
      const couchBack = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 0.4), couchMat);
      couchBack.position.set(-4, 1.5, -7);
      cutsceneScene.add(couchBack);
      
      // Tiny hiding by the couch edge - YOU!
      const tiny = createCutsceneCat(0x1a1a1a, -6.5, -5, 0x87CEEB);
      tiny.scale.set(0.8, 0.8, 0.8); // Smaller because kit
      tiny.rotation.y = Math.PI / 4;
      const whitePaw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xFFFFF0 })
      );
      whitePaw.position.set(-0.2, 0.1, 0.25);
      tiny.add(whitePaw);
      cutsceneScene.add(tiny);
      
      // Socks counting in the distance
      const socks = createCutsceneCat(0x555555, 4, -2, 0xFFD700);
      socks.rotation.y = Math.PI; // Facing away (counting)
      cutsceneScene.add(socks);
      
      // Camera from Tiny's perspective, looking at hiding spot
      cutsceneCamera.position.set(-5, 2, 0);
      cutsceneCamera.lookAt(-6.5, 0.5, -5);
      
      // Warm lighting
      const warmLight = new THREE.PointLight(0xFFE4B5, 0.6, 15);
      warmLight.position.set(0, 6, -2);
      cutsceneScene.add(warmLight);
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
  
  // Player starting position
  if (chapterNum === 1) {
    // Start in the basket
    camera.position.set(5, 0.5, -8);
    cameraPitch = 0;
    cameraYaw = Math.PI; // Looking out of basket toward room
  } else {
    camera.position.set(0, 0.5, 5);
    cameraPitch = 0;
    cameraYaw = 0;
  }
  // Apply camera rotation
  camera.rotation.order = 'YXZ';
  camera.rotation.x = cameraPitch;
  camera.rotation.y = cameraYaw;
  
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

// Check for nearby cats and trigger conversations
function checkCatProximity() {
  if (GameState.isInDialogue || GameState.isPaused || GameState.isInBattle) return;
  
  const playerPos = camera.position;
  const talkDistance = 2.5; // How close to trigger conversation
  
  for (const cat of catFigures) {
    const catPos = cat.position;
    const distance = Math.sqrt(
      Math.pow(playerPos.x - catPos.x, 2) + 
      Math.pow(playerPos.z - catPos.z, 2)
    );
    
    if (distance < talkDistance) {
      const catName = cat.userData.name;
      
      // Check if we should talk based on story progress
      if (shouldTalkTo(catName)) {
        startCatConversation(catName);
        return;
      }
    }
  }
}

// Determine if we should talk to this cat based on story
function shouldTalkTo(catName) {
  const progress = GameState.storyProgress;
  
  if (GameState.chapter === 1) {
    // Chapter 1 story flow:
    // 0: Just started, talk to Socks or Ruby first (they bully you)
    // 1: After first bully encounter, can talk to the other sibling
    // 2: After both siblings bully you, go to Quince for comfort
    // 3: Story continues
    
    if (progress === 0 && (catName === 'Socks' || catName === 'Ruby')) {
      return !GameState.talkedTo[catName + '_intro'];
    }
    if (progress === 1 && (catName === 'Socks' || catName === 'Ruby')) {
      return !GameState.talkedTo[catName + '_intro'];
    }
    if (progress === 2 && catName === 'Quince') {
      return !GameState.talkedTo['Quince_comfort'];
    }
  }
  
  return false;
}

// Start conversation with a cat
function startCatConversation(catName) {
  const dialogueKey = getCatDialogueKey(catName);
  const dialogue = GameData.CAT_DIALOGUES?.[dialogueKey];
  
  if (dialogue) {
    GameState.lastTalkedCat = catName;
    showDialogue(dialogue);
  }
}

// Get the right dialogue key based on story progress
function getCatDialogueKey(catName) {
  const progress = GameState.storyProgress;
  
  if (GameState.chapter === 1) {
    if (catName === 'Socks' && progress < 2) {
      return 'socks_bully';
    }
    if (catName === 'Ruby' && progress < 2) {
      return 'ruby_bully';
    }
    if (catName === 'Quince' && progress === 2) {
      return 'quince_comfort';
    }
  }
  
  return catName.toLowerCase() + '_default';
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  
  if (!gameScreen.classList.contains('hidden')) {
    updateMovement(delta);
    checkCatProximity();
    renderer.render(scene, camera);
  }
}

// Start everything
init();
animate();
