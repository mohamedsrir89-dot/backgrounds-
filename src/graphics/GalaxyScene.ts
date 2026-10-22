import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { WallpaperConfig, GameMetrics, GameState, AppMode } from '../types/galaxy';
import { GALAXY_THEMES } from './themes';
import { NebulaShader, StarPointsShader, createGlowTexture, createNebulaPuffTexture } from './shaders';
import { soundEngine } from '../audio/soundEngine';

// Pre-allocated reusable math helpers (Zero GC in render loop)
const _vec3 = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();
const _colorC = new THREE.Color();

interface CollectibleItem {
  mesh: THREE.Group;
  type: 'crystal' | 'hazard';
  active: boolean;
  radius: number;
}

interface ShootingStar {
  line: THREE.Line;
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export class GalaxyEngine {
  public container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private frameId: number = 0;
  private isSoftwareGl: boolean = false;
  private clock: THREE.Clock = new THREE.Clock();

  // Scene Components
  private nebulaMesh!: THREE.Mesh;
  private nebulaMaterial!: THREE.ShaderMaterial;
  private nebulaPuffsGroup!: THREE.Group;
  private starfieldMesh!: THREE.Points;
  private starGeometry!: THREE.BufferGeometry;
  private starMaterial!: THREE.ShaderMaterial;
  private shootingStars: ShootingStar[] = [];
  private shootingStarGroup!: THREE.Group;

  // S26 Nano-Probe (Procedural 3-12 part ship for Game Mode)
  private probeShip!: THREE.Group;
  private probeWarpCore!: THREE.Mesh;
  private probeThrusterTrail!: THREE.Points;
  private probeShieldBubble!: THREE.Mesh;

  // Game elements
  private gameItems: CollectibleItem[] = [];
  private gameItemsGroup!: THREE.Group;
  private warpLinesMesh!: THREE.LineSegments;
  private particleBurstGroup!: THREE.Group;
  private particlePool: { mesh: THREE.Points; life: number; maxLife: number; active: boolean }[] = [];

  // Configuration and state
  private config: WallpaperConfig;
  private appMode: AppMode = 'wallpaper-studio';
  private gameState: GameState = 'title';
  private onMetricsUpdate?: (metrics: GameMetrics) => void;
  private onGameOver?: () => void;

  // Interaction & Physics State
  private pointerNorm = new THREE.Vector2(0, 0);
  private targetPointerNorm = new THREE.Vector2(0, 0);
  private vortexPos = new THREE.Vector2(0, 0);
  private vortexForce = 0;
  private targetVortexForce = 0;
  private cameraShake = 0;
  private hitstopTimer = 0;

  // Game Physics State
  private shipPos = new THREE.Vector3(0, 0, 0);
  private shipVelocity = new THREE.Vector2(0, 0);
  private shipBanking = 0;
  private isBoosting = false;
  private gameSpeed = 35;
  private keysHeld: Record<string, boolean> = {};

  private metrics: GameMetrics = {
    score: 0,
    multiplier: 1,
    energy: 100,
    distanceLightYears: 0,
    crystalsCollected: 0,
    shields: 3,
    speed: 35,
    highScore: 0,
  };

  constructor(container: HTMLElement, config: WallpaperConfig) {
    this.container = container;
    this.config = { ...config };
    this.init();
  }

  private init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Detect software WebGL as per Three.js directives
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Initialize WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // Needed for screenshot / wallpaper snapshot export
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 18);

    // Lighting rig
    const ambientLight = new THREE.AmbientLight(0x0a0d1e, 0.8);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
    keyLight.position.set(5, 10, 8);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7090ff, 0.9);
    rimLight.position.set(-8, -6, -5);
    this.scene.add(rimLight);

    // Procedural Studio Environment
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {}

    // Initialize Components
    this.initNebula();
    this.initStarfield();
    this.initShootingStars();
    this.initProbeShip();
    this.initGameElements();
    this.initWarpTunnel();
    this.initParticlePool();

    // Event listeners
    this.bindEvents();

    // Start render loop
    this.startLoop();
  }

  /**
   * Initializes the Volumetric Nebula background plane with dynamic GLSL shader
   */
  private initNebula() {
    const theme = GALAXY_THEMES[this.config.theme] || GALAXY_THEMES['titanium-violet'];
    
    _colorA.set(theme.primaryColor);
    _colorB.set(theme.secondaryColor);
    _colorC.set(theme.accentColor);
    const dust = new THREE.Color(theme.dustColor);

    this.nebulaMaterial = new THREE.ShaderMaterial({
      vertexShader: NebulaShader.vertexShader,
      fragmentShader: NebulaShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorPrimary: { value: _colorA },
        uColorSecondary: { value: _colorB },
        uColorAccent: { value: _colorC },
        uColorDust: { value: dust },
        uTurbulence: { value: this.config.nebulaTurbulence },
        uBrightness: { value: this.config.nebulaBrightness },
        uScale: { value: this.config.nebulaScale },
        uVortexCenter: { value: new THREE.Vector2(0, 0) },
        uVortexForce: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      depthWrite: false,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const geo = new THREE.PlaneGeometry(65, 65, 32, 32);
    this.nebulaMesh = new THREE.Mesh(geo, this.nebulaMaterial);
    this.nebulaMesh.position.z = -12;
    this.scene.add(this.nebulaMesh);

    // Add layered volumetric 3D nebula puffs for genuine physical depth
    this.nebulaPuffsGroup = new THREE.Group();
    const puffTexture = createNebulaPuffTexture(128);
    const puffCount = 18;

    for (let i = 0; i < puffCount; i++) {
      const pGeo = new THREE.PlaneGeometry(12 + Math.random() * 8, 12 + Math.random() * 8);
      const pCol = (i % 3 === 0) ? _colorA : (i % 3 === 1 ? _colorB : _colorC);
      const pMat = new THREE.MeshBasicMaterial({
        map: puffTexture,
        color: pCol,
        transparent: true,
        opacity: 0.12 + Math.random() * 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const puff = new THREE.Mesh(pGeo, pMat);
      puff.position.set(
        (Math.random() - 0.5) * 28,
        (Math.random() - 0.5) * 28,
        -10 + Math.random() * 8
      );
      puff.rotation.z = Math.random() * Math.PI * 2;
      this.nebulaPuffsGroup.add(puff);
    }
    this.scene.add(this.nebulaPuffsGroup);
  }

  /**
   * Initializes the dynamic starfield with custom twinkle shader and customizable density
   */
  private initStarfield() {
    const starCount = Math.floor(this.config.starDensity);
    const glowTex = createGlowTexture(64);

    this.starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const phases = new Float32Array(starCount);
    const twinkleAmps = new Float32Array(starCount);

    // Stellar spectral classification palettes (O/B blue, A/F white, G yellow, M orange/red)
    const starPalettes = [
      new THREE.Color(0x9db4ff), // O/B Deep blue-white
      new THREE.Color(0xd5e0ff), // A White-blue
      new THREE.Color(0xffffff), // Pure white
      new THREE.Color(0xfff4e8), // F Warm white
      new THREE.Color(0xffd2a1), // G Yellow-gold
      new THREE.Color(0xff9966), // M Orange dwarf
      new THREE.Color(0xdd88ff), // Exotic magenta pulsar
    ];

    for (let i = 0; i < starCount; i++) {
      // Cylindrical/spherical cosmic distribution around camera
      const radius = 3 + Math.pow(Math.random(), 0.6) * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi) - 4;

      const starColor = starPalettes[Math.floor(Math.random() * starPalettes.length)];
      colors[i * 3 + 0] = starColor.r;
      colors[i * 3 + 1] = starColor.g;
      colors[i * 3 + 2] = starColor.b;

      // Sizes: mostly microscopic background dust, occasional bright giant stars
      const isGiant = Math.random() < 0.04;
      sizes[i] = isGiant ? (2.2 + Math.random() * 2.0) : (0.4 + Math.random() * 0.9);

      phases[i] = Math.random() * Math.PI * 2;
      twinkleAmps[i] = 0.3 + Math.random() * 0.7;
    }

    this.starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.starGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.starGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    this.starGeometry.setAttribute('aTwinkleAmp', new THREE.BufferAttribute(twinkleAmps, 1));

    this.starMaterial = new THREE.ShaderMaterial({
      vertexShader: StarPointsShader.vertexShader,
      fragmentShader: StarPointsShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uSizeMultiplier: { value: this.config.starSize },
        uTwinkleSpeed: { value: this.config.starTwinkleSpeed },
        uTexture: { value: glowTex },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.starfieldMesh = new THREE.Points(this.starGeometry, this.starMaterial);
    this.scene.add(this.starfieldMesh);
  }

  /**
   * Shooting stars (meteors) system
   */
  private initShootingStars() {
    this.shootingStarGroup = new THREE.Group();
    const count = 5;

    for (let i = 0; i < count; i++) {
      const lineGeo = new THREE.BufferGeometry();
      const linePositions = new Float32Array(6);
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });

      const line = new THREE.Line(lineGeo, lineMat);
      this.shootingStarGroup.add(line);

      this.shootingStars.push({
        line,
        pos: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        speed: 40 + Math.random() * 25,
        life: 0,
        maxLife: 1.0,
        active: false,
      });
    }

    this.scene.add(this.shootingStarGroup);
  }

  /**
   * Spawns a shooting star across the screen
   */
  public triggerShootingStar(customStart?: { x: number; y: number }) {
    const star = this.shootingStars.find(s => !s.active);
    if (!star) return;

    if (customStart) {
      star.pos.set(customStart.x, customStart.y, -2);
    } else {
      star.pos.set((Math.random() - 0.5) * 20, 8 + Math.random() * 4, -4);
    }

    const angle = -(Math.PI * 0.25) + (Math.random() - 0.5) * 0.4;
    star.dir.set(Math.cos(angle), Math.sin(angle), 0).normalize();
    star.speed = 45 + Math.random() * 25;
    star.life = 0;
    star.maxLife = 0.8 + Math.random() * 0.5;
    star.active = true;

    soundEngine.playRippleChime(1.4);
  }

  /**
   * Procedural 3-12 part S26 Nano-Probe flagship model for game mode
   */
  private initProbeShip() {
    this.probeShip = new THREE.Group();

    // 1. Sleek Titanium Fuselage
    const hullGeo = new THREE.ConeGeometry(0.75, 2.6, 7);
    hullGeo.rotateX(Math.PI / 2);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0x050a1a,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.scale.set(0.9, 0.45, 1.0);
    this.probeShip.add(hull);

    // 2. Dual Swept Titanium Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.2, -0.6);
    wingShape.lineTo(2.0, -1.2);
    wingShape.lineTo(0, -0.5);
    wingShape.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03 });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.3,
    });

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.rotation.x = Math.PI / 2;
    rightWing.position.set(0.1, 0, 0.3);
    this.probeShip.add(rightWing);

    const leftWing = rightWing.clone();
    leftWing.scale.x = -1;
    leftWing.position.set(-0.1, 0, 0.3);
    this.probeShip.add(leftWing);

    // 3. Glowing Ion Warp Core
    const coreGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      wireframe: false,
    });
    this.probeWarpCore = new THREE.Mesh(coreGeo, coreMat);
    this.probeWarpCore.position.set(0, 0.1, 0.2);
    this.probeShip.add(this.probeWarpCore);

    // 4. Energy Deflector Shield Bubble
    const shieldGeo = new THREE.SphereGeometry(1.6, 20, 20);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
    });
    this.probeShieldBubble = new THREE.Mesh(shieldGeo, shieldMat);
    this.probeShip.add(this.probeShieldBubble);

    // 5. Twin Plasma Thruster Trails (Point particles)
    const trailCount = 40;
    const trailPositions = new Float32Array(trailCount * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.35,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    this.probeThrusterTrail = new THREE.Points(trailGeo, trailMat);
    this.probeShip.add(this.probeThrusterTrail);

    this.probeShip.position.set(0, -3.5, 5);
    this.probeShip.visible = false; // Shown in game mode
    this.scene.add(this.probeShip);
  }

  /**
   * Initializes Warp Speed Streak lines (high-speed hyperspace visual effect)
   */
  private initWarpTunnel() {
    const lineCount = 120;
    const positions = new Float32Array(lineCount * 6);

    for (let i = 0; i < lineCount; i++) {
      const radius = 4 + Math.random() * 12;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z1 = -50 + Math.random() * 80;
      const z2 = z1 - (5 + Math.random() * 15);

      positions[i * 6 + 0] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z1;

      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0xa5b4fc,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });

    this.warpLinesMesh = new THREE.LineSegments(geo, mat);
    this.warpLinesMesh.visible = false;
    this.scene.add(this.warpLinesMesh);
  }

  /**
   * Initializes collectible crystals and cosmic hazards for Game mode
   */
  private initGameElements() {
    this.gameItemsGroup = new THREE.Group();
    const itemCount = 25;

    for (let i = 0; i < itemCount; i++) {
      const itemGroup = new THREE.Group();
      const isCrystal = i % 3 !== 0; // 66% crystals, 33% antimatter hazards

      if (isCrystal) {
        // Luminous Stardust Crystal (Icosahedron with wireframe aura)
        const innerGeo = new THREE.IcosahedronGeometry(0.55, 0);
        const innerMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          roughness: 0.1,
          metalness: 0.9,
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);

        const outerGeo = new THREE.IcosahedronGeometry(0.7, 1);
        const outerMat = new THREE.MeshBasicMaterial({
          color: 0x7dd3fc,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        });
        const outer = new THREE.Mesh(outerGeo, outerMat);

        itemGroup.add(inner);
        itemGroup.add(outer);

        this.gameItems.push({
          mesh: itemGroup,
          type: 'crystal',
          active: false,
          radius: 0.85,
        });
      } else {
        // Rogue Antimatter Singularity (Tumbling faceted dark asteroid with hot core)
        const rockGeo = new THREE.DodecahedronGeometry(0.8, 1);
        const rockMat = new THREE.MeshStandardMaterial({
          color: 0x1e1b4b,
          roughness: 0.8,
          metalness: 0.3,
          emissive: 0x4c0519,
          emissiveIntensity: 0.6,
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);

        const dangerRingGeo = new THREE.TorusGeometry(1.0, 0.05, 8, 24);
        const dangerRingMat = new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          wireframe: true,
        });
        const ring = new THREE.Mesh(dangerRingGeo, dangerRingMat);
        ring.rotation.x = Math.PI / 2;

        itemGroup.add(rock);
        itemGroup.add(ring);

        this.gameItems.push({
          mesh: itemGroup,
          type: 'hazard',
          active: false,
          radius: 1.1,
        });
      }

      this.gameItemsGroup.add(itemGroup);
    }

    this.scene.add(this.gameItemsGroup);
  }

  /**
   * Pre-allocated particle explosion pool for impact and pickup bursts
   */
  private initParticlePool() {
    this.particleBurstGroup = new THREE.Group();
    const poolSize = 6;

    for (let p = 0; p < poolSize; p++) {
      const pCount = 50;
      const positions = new Float32Array(pCount * 3);
      const velocities = new Float32Array(pCount * 3);

      for (let i = 0; i < pCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 2.0 + Math.random() * 5.0;

        velocities[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
        velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        velocities[i * 3 + 2] = Math.cos(phi) * speed;
      }

      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pGeo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));

      const pMat = new THREE.PointsMaterial({
        color: 0x67e8f9,
        size: 0.45,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });

      const burst = new THREE.Points(pGeo, pMat);
      burst.visible = false;
      this.particleBurstGroup.add(burst);

      this.particlePool.push({
        mesh: burst,
        life: 0,
        maxLife: 0.6,
        active: false,
      });
    }

    this.scene.add(this.particleBurstGroup);
  }

  /**
   * Triggers a burst of particles at a given world position
   */
  private spawnParticleBurst(pos: THREE.Vector3, colorHex: number) {
    const burst = this.particlePool.find(b => !b.active);
    if (!burst) return;

    burst.active = true;
    burst.life = 0;
    burst.mesh.position.copy(pos);
    burst.mesh.visible = true;
    (burst.mesh.material as THREE.PointsMaterial).color.setHex(colorHex);

    // Reset particle vertex positions to center
    const posAttr = burst.mesh.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;
    for (let i = 0; i < array.length; i++) {
      array[i] = 0;
    }
    posAttr.needsUpdate = true;
  }

  /**
   * Touch and pointer interaction bindings
   */
  private bindEvents() {
    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const rect = this.container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

      this.targetPointerNorm.set(x, y);

      // Interactive Nebula Ripple / Swirl activation
      this.targetVortexForce = this.config.interactiveRippleForce * 1.5;
    };

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      soundEngine.startAmbient();
      onPointerMove(e);
      this.targetVortexForce = this.config.interactiveRippleForce * 2.5;

      // In wallpaper studio mode, tap can spark a shooting star or ripple chime
      if (this.appMode !== 'game') {
        soundEngine.playRippleChime(1.1);
        if (Math.random() < 0.6) {
          this.triggerShootingStar();
        }
      } else if (this.gameState === 'playing') {
        // Boost in game mode on touch
        this.isBoosting = true;
        soundEngine.playBoost();
      }
    };

    const onPointerUp = () => {
      this.targetVortexForce = 0;
      this.isBoosting = false;
    };

    this.container.addEventListener('mousemove', onPointerMove);
    this.container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);

    this.container.addEventListener('touchmove', onPointerMove, { passive: true });
    this.container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Keyboard bindings for Game Mode
    const onKeyDown = (e: KeyboardEvent) => {
      this.keysHeld[e.code] = true;

      if (this.appMode === 'game') {
        if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
          this.isBoosting = true;
          soundEngine.playBoost();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysHeld[e.code] = false;
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.isBoosting = false;
      }
    };

    const onBlur = () => {
      this.keysHeld = {};
      this.isBoosting = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // Resize handling
    const onResize = () => {
      if (!this.renderer || !this.camera) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      if (this.nebulaMaterial) {
        this.nebulaMaterial.uniforms.uResolution.value.set(w, h);
      }
      if (this.starMaterial) {
        this.starMaterial.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
      }
    };

    window.addEventListener('resize', onResize);
  }

  /**
   * Main render and physics loop
   */
  private startLoop() {
    const tick = () => {
      const rawDt = this.clock.getDelta();
      // Clamp delta time to avoid simulation explosion
      const dt = Math.min(rawDt, 0.05);

      // Handle hitstop freeze on heavy impacts
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
        this.renderer.render(this.scene, this.camera);
        if (this.isSoftwareGl) this.afterDraw(tick);
        else this.frameId = requestAnimationFrame(tick);
        return;
      }

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  /**
   * Per-frame updates
   */
  private update(dt: number) {
    const time = this.clock.getElapsedTime();

    // Smooth pointer damping
    this.pointerNorm.x = THREE.MathUtils.damp(this.pointerNorm.x, this.targetPointerNorm.x, 8, dt);
    this.pointerNorm.y = THREE.MathUtils.damp(this.pointerNorm.y, this.targetPointerNorm.y, 8, dt);

    // Vortex center and force spring damping
    this.vortexPos.x = THREE.MathUtils.damp(this.vortexPos.x, this.pointerNorm.x, 6, dt);
    this.vortexPos.y = THREE.MathUtils.damp(this.vortexPos.y, this.pointerNorm.y, 6, dt);
    this.vortexForce = THREE.MathUtils.damp(this.vortexForce, this.targetVortexForce, 4, dt);

    // Update Nebula Shader uniforms
    if (this.nebulaMaterial) {
      this.nebulaMaterial.uniforms.uTime.value = time * this.config.nebulaSpeed;
      this.nebulaMaterial.uniforms.uVortexCenter.value.copy(this.vortexPos);
      this.nebulaMaterial.uniforms.uVortexForce.value = this.vortexForce;
      this.nebulaMaterial.uniforms.uTurbulence.value = this.config.nebulaTurbulence;
      this.nebulaMaterial.uniforms.uBrightness.value = this.config.nebulaBrightness;
      this.nebulaMaterial.uniforms.uScale.value = this.config.nebulaScale;
    }

    // Slowly rotate volumetric nebula puffs
    if (this.nebulaPuffsGroup) {
      this.nebulaPuffsGroup.rotation.z = time * 0.015 * this.config.nebulaSpeed;
    }

    // Update Starfield Shader
    if (this.starMaterial) {
      this.starMaterial.uniforms.uTime.value = time;
      this.starMaterial.uniforms.uTwinkleSpeed.value = this.config.starTwinkleSpeed;
      this.starMaterial.uniforms.uSizeMultiplier.value = this.config.starSize;
    }

    // Parallax shift for Galaxy S26 Live Wallpaper feel
    if (this.appMode !== 'game') {
      const px = this.pointerNorm.x * 2.2 * this.config.parallaxStrength;
      const py = this.pointerNorm.y * 1.8 * this.config.parallaxStrength;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, px, 5, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, py, 5, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, 18, 5, dt);
      this.camera.lookAt(0, 0, 0);

      // Random shooting stars based on config rate
      if (this.config.shootingStarRate > 0 && Math.random() < this.config.shootingStarRate * 0.012) {
        this.triggerShootingStar();
      }
    }

    // Update Shooting Stars
    this.updateShootingStars(dt);

    // Particle Burst Pool updates
    this.updateParticlePool(dt);

    // Mode-specific logic
    if (this.appMode === 'game') {
      this.updateGameMode(dt, time);
    }
  }

  private updateShootingStars(dt: number) {
    for (const star of this.shootingStars) {
      if (!star.active) continue;

      star.life += dt;
      if (star.life >= star.maxLife) {
        star.active = false;
        (star.line.material as THREE.LineBasicMaterial).opacity = 0;
        continue;
      }

      // Move forward
      star.pos.addScaledVector(star.dir, star.speed * dt);

      // Tail trailing calculation
      const tailLen = 3.5;
      const head = star.pos;
      _vec3.copy(head).addScaledVector(star.dir, -tailLen);

      const posAttr = star.line.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      arr[0] = head.x; arr[1] = head.y; arr[2] = head.z;
      arr[3] = _vec3.x; arr[4] = _vec3.y; arr[5] = _vec3.z;
      posAttr.needsUpdate = true;

      // Fade envelope
      const progress = star.life / star.maxLife;
      const alpha = Math.sin(progress * Math.PI) * 0.9;
      (star.line.material as THREE.LineBasicMaterial).opacity = alpha;
    }
  }

  private updateParticlePool(dt: number) {
    for (const burst of this.particlePool) {
      if (!burst.active) continue;

      burst.life += dt;
      if (burst.life >= burst.maxLife) {
        burst.active = false;
        burst.mesh.visible = false;
        continue;
      }

      const progress = burst.life / burst.maxLife;
      const posAttr = burst.mesh.geometry.attributes.position as THREE.BufferAttribute;
      const velAttr = burst.mesh.geometry.attributes.aVelocity as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      const velArr = velAttr.array as Float32Array;

      for (let i = 0; i < posArr.length; i += 3) {
        posArr[i + 0] += velArr[i + 0] * dt;
        posArr[i + 1] += velArr[i + 1] * dt;
        posArr[i + 2] += velArr[i + 2] * dt;
      }
      posAttr.needsUpdate = true;

      const mat = burst.mesh.material as THREE.PointsMaterial;
      mat.opacity = (1 - progress) * 0.9;
    }
  }

  /**
   * Game Mode simulation (Title / Playing / Game Over)
   */
  private updateGameMode(dt: number, time: number) {
    if (this.gameState === 'title') {
      // Atmospheric slow cinematic orbital pan around S26 probe
      this.probeShip.visible = true;
      this.probeShip.position.set(0, 0, 4);
      this.probeShip.rotation.y = time * 0.4;
      this.probeShip.rotation.x = Math.sin(time * 0.5) * 0.15;

      this.camera.position.set(Math.cos(time * 0.3) * 8, 2, Math.sin(time * 0.3) * 8 + 4);
      this.camera.lookAt(0, 0, 4);
      return;
    }

    if (this.gameState !== 'playing') return;

    // Responsive Player Input
    let moveX = 0;
    let moveY = 0;

    if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) moveX -= 1;
    if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) moveX += 1;
    if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) moveY -= 1;
    if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) moveY += 1;

    // Add pointer influence for touch / mouse steering
    if (Math.abs(this.pointerNorm.x) > 0.05) moveX += this.pointerNorm.x * 1.5;
    if (Math.abs(this.pointerNorm.y) > 0.05) moveY += this.pointerNorm.y * 1.5;

    // Clamp input magnitude
    const inputLen = Math.hypot(moveX, moveY);
    if (inputLen > 1) {
      moveX /= inputLen;
      moveY /= inputLen;
    }

    const maxSpeed = this.isBoosting ? 26 : 16;
    const accel = 35;

    this.shipVelocity.x = THREE.MathUtils.damp(this.shipVelocity.x, moveX * maxSpeed, accel, dt);
    this.shipVelocity.y = THREE.MathUtils.damp(this.shipVelocity.y, moveY * maxSpeed, accel, dt);

    this.shipPos.x += this.shipVelocity.x * dt;
    this.shipPos.y += this.shipVelocity.y * dt;

    // Playfield boundaries
    const boundX = 9.5;
    const boundY = 6.0;
    this.shipPos.x = THREE.MathUtils.clamp(this.shipPos.x, -boundX, boundX);
    this.shipPos.y = THREE.MathUtils.clamp(this.shipPos.y, -boundY, boundY);

    // Ship Banking rotation (Squash & Roll feel)
    const targetBank = -this.shipVelocity.x * 0.04;
    this.shipBanking = THREE.MathUtils.damp(this.shipBanking, targetBank, 10, dt);

    this.probeShip.position.set(this.shipPos.x, this.shipPos.y, 4);
    this.probeShip.rotation.z = this.shipBanking;
    this.probeShip.rotation.x = -this.shipVelocity.y * 0.02 + 0.1;
    this.probeShip.rotation.y = this.shipVelocity.x * 0.02;

    // Warp core pulsation
    const coreScale = 1 + (this.isBoosting ? 0.6 : 0.2) * Math.sin(time * 15);
    this.probeWarpCore.scale.set(coreScale, coreScale, coreScale);

    // Camera following ship with smooth damping and camera shake
    let shakeOffset = 0;
    if (this.cameraShake > 0) {
      this.cameraShake -= dt * 2.5;
      shakeOffset = (Math.random() - 0.5) * this.cameraShake * 0.6;
    }

    const camTargetX = this.shipPos.x * 0.45 + shakeOffset;
    const camTargetY = this.shipPos.y * 0.45 + 1.2 + shakeOffset;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, camTargetX, 8, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, camTargetY, 8, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, 14, 8, dt);
    this.camera.lookAt(this.shipPos.x * 0.2, this.shipPos.y * 0.2, 0);

    // Forward Game Speed & Light Years
    const currentSpeed = this.isBoosting ? 85 : 45;
    this.gameSpeed = THREE.MathUtils.damp(this.gameSpeed, currentSpeed, 6, dt);
    this.metrics.distanceLightYears += (this.gameSpeed * dt) * 0.01;
    this.metrics.speed = Math.floor(this.gameSpeed);

    // Warp speed lines visibility
    if (this.warpLinesMesh) {
      this.warpLinesMesh.visible = true;
      (this.warpLinesMesh.material as THREE.LineBasicMaterial).opacity = this.isBoosting ? 0.45 : 0.15;
      this.warpLinesMesh.position.z += this.gameSpeed * dt;
      if (this.warpLinesMesh.position.z > 25) {
        this.warpLinesMesh.position.z = -15;
      }
    }

    // Energy drain & regeneration
    if (this.isBoosting) {
      this.metrics.energy = Math.max(0, this.metrics.energy - dt * 25);
      if (this.metrics.energy <= 0) {
        this.isBoosting = false;
      }
    } else {
      this.metrics.energy = Math.min(100, this.metrics.energy + dt * 12);
    }

    // Spawn & update items (Crystals & Hazards)
    this.updateGameItems(dt);

    // Send metrics update to UI
    if (this.onMetricsUpdate) {
      this.onMetricsUpdate({ ...this.metrics });
    }
  }

  private updateGameItems(dt: number) {
    const shipCenter = this.probeShip.position;

    for (const item of this.gameItems) {
      if (!item.active) {
        // Recycle and spawn far ahead
        if (Math.random() < 0.04) {
          item.active = true;
          item.mesh.position.set(
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 10,
            -60 - Math.random() * 20
          );
        }
        continue;
      }

      // Move toward camera
      item.mesh.position.z += this.gameSpeed * dt;
      item.mesh.rotation.x += dt * 1.5;
      item.mesh.rotation.y += dt * 2.0;

      // Collision check with ship
      _vec3.copy(item.mesh.position);
      const dist = _vec3.distanceTo(shipCenter);

      if (dist < item.radius + 0.9) {
        // Hit!
        item.active = false;
        item.mesh.position.z = 20; // push behind

        if (item.type === 'crystal') {
          // Collected crystal!
          this.metrics.crystalsCollected++;
          this.metrics.multiplier = Math.min(8, this.metrics.multiplier + 0.5);
          this.metrics.score += Math.floor(100 * this.metrics.multiplier);
          this.metrics.energy = Math.min(100, this.metrics.energy + 15);
          soundEngine.playStarCollect(this.metrics.multiplier);
          this.spawnParticleBurst(_vec3, 0x38bdf8);
        } else {
          // Hit rogue antimatter hazard!
          this.metrics.shields--;
          this.metrics.multiplier = 1.0;
          this.cameraShake = 1.5;
          this.hitstopTimer = 0.06; // 60ms hitstop
          soundEngine.playImpact();
          this.spawnParticleBurst(_vec3, 0xf43f5e);

          if (this.metrics.shields <= 0) {
            // Game Over!
            this.triggerGameOver();
          }
        }
      } else if (item.mesh.position.z > 15) {
        // Flew past camera, deactivate
        item.active = false;
      }
    }
  }

  private triggerGameOver() {
    this.gameState = 'gameover';
    if (this.metrics.score > this.metrics.highScore) {
      this.metrics.highScore = this.metrics.score;
    }
    if (this.onGameOver) {
      this.onGameOver();
    }
  }

  // ================= Public API =================

  public setMode(mode: AppMode) {
    this.appMode = mode;
    if (mode === 'game') {
      this.gameState = 'title';
      this.probeShip.visible = true;
      if (this.warpLinesMesh) this.warpLinesMesh.visible = true;
    } else {
      this.probeShip.visible = false;
      if (this.warpLinesMesh) this.warpLinesMesh.visible = false;
    }
  }

  public startGame() {
    this.appMode = 'game';
    this.gameState = 'playing';
    this.shipPos.set(0, -1, 4);
    this.shipVelocity.set(0, 0);
    this.metrics = {
      score: 0,
      multiplier: 1,
      energy: 100,
      distanceLightYears: 0,
      crystalsCollected: 0,
      shields: 3,
      speed: 35,
      highScore: this.metrics.highScore,
    };
    // Clear active items
    for (const item of this.gameItems) {
      item.active = false;
    }
    soundEngine.playBoost();
  }

  public pauseGame() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
    }
  }

  public setCallbacks(onMetrics: (m: GameMetrics) => void, onGameOver: () => void) {
    this.onMetricsUpdate = onMetrics;
    this.onGameOver = onGameOver;
  }

  public updateConfig(newConfig: Partial<WallpaperConfig>) {
    this.config = { ...this.config, ...newConfig };

    // Update Theme colors
    if (newConfig.theme && GALAXY_THEMES[newConfig.theme]) {
      const theme = GALAXY_THEMES[newConfig.theme];
      _colorA.set(theme.primaryColor);
      _colorB.set(theme.secondaryColor);
      _colorC.set(theme.accentColor);
      const dust = new THREE.Color(theme.dustColor);

      if (this.nebulaMaterial) {
        this.nebulaMaterial.uniforms.uColorPrimary.value.copy(_colorA);
        this.nebulaMaterial.uniforms.uColorSecondary.value.copy(_colorB);
        this.nebulaMaterial.uniforms.uColorAccent.value.copy(_colorC);
        this.nebulaMaterial.uniforms.uColorDust.value.copy(dust);
      }
    }

    // Update Star Density if changed significantly
    if (newConfig.starDensity !== undefined && this.starGeometry) {
      const newCount = Math.floor(newConfig.starDensity);
      this.starfieldMesh.geometry.setDrawRange(0, Math.min(newCount, this.starGeometry.attributes.position.count));
    }
  }

  /**
   * Captures high-res snapshot of current live wallpaper for download
   */
  public captureSnapshot(width = 1440, height = 3120): string {
    // Render current frame directly to drawing buffer
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.renderer.dispose();
    this.scene.clear();
  }
}
