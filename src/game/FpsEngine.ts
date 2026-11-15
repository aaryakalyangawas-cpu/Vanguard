import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ArenaData,
  createTacticalArena,
  groundHeightAt,
  MountedMgNode,
  resolveHorizontalCollision,
} from './arena';
import { soundEngine } from './audio';
import { buildCombatantRig, CombatantRig } from './botModel';
import { createBulletHoleTexture, createSoftGlowTexture } from './textures';
import {
  DamageDirectionIndicator,
  Difficulty,
  GamePhase,
  HudSnapshot,
  KillFeedItem,
  MapId,
  MatchConfig,
  RadarBlip,
  ScoreboardEntry,
  TeamId,
  WeaponId,
  WeaponRuntimeState,
} from './types';
import { buildWeaponViewmodel, ViewmodelHandle, WEAPON_ORDER, WEAPONS } from './weapons';

const BLUE_CALLSIGNS = ['Vanguard-1', 'Falcon', 'Kestrel', 'Titan', 'Specter'];
const RED_CALLSIGNS = ['Viper', 'Ravager', 'Onyx', 'Phantom', 'Striker'];

const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();
const _vecD = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

interface BallisticBullet {
  pos: THREE.Vector3;
  visualPos: THREE.Vector3;
  vel: THREE.Vector3;
  damage: number;
  headshotMult: number;
  maxRange: number;
  traveled: number;
  gravityScale: number;
  attackerId: string;
  team: TeamId;
  weaponShort: string;
  mesh: THREE.Group;
  whizzed: boolean;
}

interface RocketProjectile {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  attackerId: string;
  team: TeamId;
  life: number;
  smokeAccum: number;
  mesh: THREE.Group;
}

interface FragGrenade {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  attackerId: string;
  team: TeamId;
  fuse: number;
  smokeAccum: number;
  mesh: THREE.Group;
  ledMat: THREE.MeshBasicMaterial;
}

interface SmokePuff {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  startScale: number;
  endScale: number;
}

interface ExplosionWave {
  fireball: THREE.Mesh;
  ring: THREE.Mesh;
  life: number;
  maxLife: number;
  radius: number;
}

interface SparkEffect {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface ShellCasingEffect {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
}

interface CombatantActor {
  id: string;
  name: string;
  team: TeamId;
  isPlayer: boolean;
  weaponId: WeaponId;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw: number;
  pitch: number;
  health: number;
  maxHealth: number;
  alive: boolean;
  respawnTimer: number;
  spawnShieldTimer: number;
  kills: number;
  deaths: number;
  assists: number;
  lastDamagedBy: Record<string, number>;
  rig?: CombatantRig;
  waypointIdx: number;
  strafeDir: number;
  strafeTimer: number;
  fireCooldown: number;
  grenadeCooldown: number;
  reactionTimer: number;
  targetEnemyId: string | null;
  deathAnimTimer: number;
  walkCycle: number;
}

export class FpsEngine {
  private container: HTMLElement;
  private onHudUpdate: (snapshot: HudSnapshot) => void;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private arena!: ArenaData;
  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
  private muzzleLight: THREE.PointLight;
  private explosionLight: THREE.PointLight;
  private explosionLightTimer = 0;

  // Viewmodels
  private weaponPivot: THREE.Group;
  private viewmodels: Record<WeaponId, ViewmodelHandle>;
  private activeWeapon: WeaponId = 'm4a1';
  private lastWeapon: WeaponId = 'mp5';
  private weaponStates: Record<WeaponId, WeaponRuntimeState>;

  // Loop & timing
  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();
  private hudEmitAccum = 0;
  private lobbyOrbitAngle = 0;

  // Match state
  private phase: GamePhase = 'lobby';
  private config: MatchConfig;
  private blueScore = 0;
  private redScore = 0;
  private timeRemaining = 300;
  private winner: TeamId | 'draw' | null = null;
  private killFeed: KillFeedItem[] = [];
  private killFeedSeq = 1;
  private damageIndicators: DamageDirectionIndicator[] = [];
  private dmgSeq = 1;
  private pickupNotice: string | null = null;
  private pickupNoticeTimer = 0;

  // Player state
  private player!: CombatantActor;
  private actors: CombatantActor[] = [];
  private stamina = 100;
  private grounded = true;
  private isAds = false;
  private adsToggle = false;
  private scopeZoomLevel: 1 | 2 = 1;
  private isReloading = false;
  private reloadTimer = 0;
  private fireCooldown = 0;
  private semiTriggerReleased = true;
  private muzzleFlashTimer = 0;
  private recoilOffsetPitch = 0;
  private recoilOffsetYaw = 0;
  private weaponKickZ = 0;
  private weaponKickRotX = 0;
  private boltKick = 0;
  private walkBobPhase = 0;
  private footstepTimer = 0;
  private pumpAnimTimer = 0;
  private cameraShake = 0;

  // Grenade & Mounted MG state
  private grenades = 2;
  private readonly maxGrenades = 3;
  private isCookingGrenade = false;
  private grenadeCookTimer = 0;
  private activeMountedMg: MountedMgNode | null = null;
  private nearMountedMg: MountedMgNode | null = null;
  private hmgFlashTimer = 0;

  private hitmarkerType: 'none' | 'body' | 'head' | 'kill' = 'none';
  private hitmarkerTime = 0;
  private lastEliminatedName: string | null = null;
  private lastEliminatedHeadshot = false;
  private pointerLocked = false;

  // Input state
  private keys: Record<string, boolean> = {};
  private mouseDownLeft = false;
  private mouseDownRight = false;

  // Shared raycaster & FX pools
  private raycaster = new THREE.Raycaster();
  private bullets: BallisticBullet[] = [];
  private rockets: RocketProjectile[] = [];
  private activeGrenades: FragGrenade[] = [];
  private smokePuffs: SmokePuff[] = [];
  private explosions: ExplosionWave[] = [];
  private sparks: SparkEffect[] = [];
  private shells: ShellCasingEffect[] = [];
  private bulletHoles: THREE.Mesh[] = [];

  private sparkGeo = new THREE.BoxGeometry(0.065, 0.065, 0.065);
  private bulletCoreGeo = new THREE.ConeGeometry(0.016, 0.09, 6);
  private tracerTailGeo = new THREE.CylinderGeometry(0.008, 0.015, 1.35, 6);
  private smokeGeo = new THREE.DodecahedronGeometry(0.32, 1);
  private fireballGeo = new THREE.SphereGeometry(1, 14, 10);
  private shockRingGeo = new THREE.RingGeometry(0.65, 1.0, 24);
  private holeGeo = new THREE.PlaneGeometry(0.18, 0.18);
  private shellGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.036, 6);

  private bulletHoleTex: THREE.CanvasTexture;
  private blastGlowTex: THREE.CanvasTexture;
  private bulletHoleMat: THREE.MeshBasicMaterial;
  private brassMat = new THREE.MeshStandardMaterial({
    color: 0xd9a441,
    metalness: 0.92,
    roughness: 0.22,
  });
  private oliveGrenadeMat = new THREE.MeshStandardMaterial({
    color: 0x3f4f32,
    metalness: 0.28,
    roughness: 0.62,
  });

  constructor(
    container: HTMLElement,
    initialConfig: MatchConfig,
    onHudUpdate: (snapshot: HudSnapshot) => void
  ) {
    this.container = container;
    this.config = { ...initialConfig };
    this.onHudUpdate = onHudUpdate;
    soundEngine.setMuted(this.config.muted);

    this.isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x28262b);
    this.scene.fog = new THREE.FogExp2(0x22252e, 0.0085);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x262930, 0.92);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffdfba, 2.35);
    this.sunLight.position.set(38, 42, 22);
    if (!this.isSoftwareGl) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 5;
      this.sunLight.shadow.camera.far = 140;
      this.sunLight.shadow.camera.left = -48;
      this.sunLight.shadow.camera.right = 48;
      this.sunLight.shadow.camera.top = 48;
      this.sunLight.shadow.camera.bottom = -48;
      this.sunLight.shadow.bias = -0.0005;
      this.sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sunLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.55);
    rimLight.position.set(-36, 22, -32);
    this.scene.add(rimLight);

    this.explosionLight = new THREE.PointLight(0xff7b24, 0, 26, 2);
    this.scene.add(this.explosionLight);

    const aspect =
      (container.clientWidth || window.innerWidth) /
      (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.08, 280);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    this.weaponPivot = new THREE.Group();
    this.camera.add(this.weaponPivot);

    this.muzzleLight = new THREE.PointLight(0xfbbf24, 0, 14, 2);
    this.muzzleLight.position.set(0.2, -0.1, -1.0);
    this.camera.add(this.muzzleLight);

    this.bulletHoleTex = createBulletHoleTexture();
    this.blastGlowTex = createSoftGlowTexture(
      'rgba(255, 245, 210, 1)',
      'rgba(255, 110, 30, 0.65)',
      'rgba(255, 50, 10, 0)'
    );
    this.bulletHoleMat = new THREE.MeshBasicMaterial({
      map: this.bulletHoleTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    this.bulletCoreGeo.rotateX(Math.PI / 2);
    this.tracerTailGeo.rotateX(Math.PI / 2);
    this.shellGeo.rotateX(Math.PI / 2);

    // Build 7 Realistic Composite Viewmodels
    this.viewmodels = {
      m4a1: buildWeaponViewmodel('m4a1'),
      ak74: buildWeaponViewmodel('ak74'),
      mp5: buildWeaponViewmodel('mp5'),
      m870: buildWeaponViewmodel('m870'),
      mk14: buildWeaponViewmodel('mk14'),
      m24: buildWeaponViewmodel('m24'),
      rpg7: buildWeaponViewmodel('rpg7'),
    };
    for (const id of WEAPON_ORDER) {
      this.viewmodels[id].root.visible = false;
      this.weaponPivot.add(this.viewmodels[id].root);
    }
    this.weaponPivot.visible = false;

    this.loadArena(this.config.mapId || 'yard');

    this.weaponStates = this.createFreshWeaponStates();
    this.setupMatchActors();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.emitHud();
    this.scheduleNextFrame();
  }

  private loadArena(mapId: MapId) {
    this.clearDynamicEffects();
    if (this.arena) {
      this.scene.remove(this.arena.rootGroup);
      for (const g of this.arena.disposables.geometries) g.dispose();
      for (const m of this.arena.disposables.materials) m.dispose();
      for (const t of this.arena.disposables.textures) t.dispose();
    }

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.arena = createTacticalArena(this.scene, maxAniso, mapId);

    const atm = this.arena.atmosphere;
    (this.scene.background as THREE.Color).setHex(atm.bgColor);
    this.scene.fog = new THREE.FogExp2(atm.fogColor, atm.fogDensity);
    this.sunLight.color.setHex(atm.sunColor);
    this.sunLight.intensity = atm.sunIntensity;
    this.sunLight.position.set(...atm.sunPos);
    this.hemiLight.color.setHex(atm.hemiSky);
    this.hemiLight.groundColor.setHex(atm.hemiGround);
    this.hemiLight.intensity = atm.hemiIntensity;
  }

  private createFreshWeaponStates(): Record<WeaponId, WeaponRuntimeState> {
    return {
      m4a1: { id: 'm4a1', mag: WEAPONS.m4a1.magSize, reserve: WEAPONS.m4a1.reserveMax },
      ak74: { id: 'ak74', mag: WEAPONS.ak74.magSize, reserve: WEAPONS.ak74.reserveMax },
      mp5: { id: 'mp5', mag: WEAPONS.mp5.magSize, reserve: WEAPONS.mp5.reserveMax },
      m870: { id: 'm870', mag: WEAPONS.m870.magSize, reserve: WEAPONS.m870.reserveMax },
      mk14: { id: 'mk14', mag: WEAPONS.mk14.magSize, reserve: WEAPONS.mk14.reserveMax },
      m24: { id: 'm24', mag: WEAPONS.m24.magSize, reserve: WEAPONS.m24.reserveMax },
      rpg7: { id: 'rpg7', mag: WEAPONS.rpg7.magSize, reserve: WEAPONS.rpg7.reserveMax },
    };
  }

  private clearActorRigs() {
    for (const actor of this.actors) {
      if (actor.rig) {
        this.scene.remove(actor.rig.root);
      }
    }
    this.actors = [];
  }

  private setupMatchActors() {
    this.clearActorRigs();

    const teamSize = this.config.teamSize;
    const weaponPool: WeaponId[] = ['m4a1', 'ak74', 'mp5', 'm870', 'mk14', 'm24'];

    const playerSpawn = this.arena.blueSpawns[0];
    this.player = {
      id: 'player',
      name: 'You',
      team: 'blue',
      isPlayer: true,
      weaponId: this.config.startingWeapon,
      position: playerSpawn.clone(),
      velocity: new THREE.Vector3(),
      yaw: 0,
      pitch: 0,
      health: 100,
      maxHealth: 100,
      alive: true,
      respawnTimer: 0,
      spawnShieldTimer: 1.5,
      kills: 0,
      deaths: 0,
      assists: 0,
      lastDamagedBy: {},
      waypointIdx: 2,
      strafeDir: 1,
      strafeTimer: 1,
      fireCooldown: 0,
      grenadeCooldown: 0,
      reactionTimer: 0,
      targetEnemyId: null,
      deathAnimTimer: 0,
      walkCycle: 0,
    };
    this.actors.push(this.player);

    for (let i = 1; i < teamSize; i++) {
      const wid = weaponPool[i % weaponPool.length];
      const spawn = this.arena.blueSpawns[i % this.arena.blueSpawns.length];
      const rig = buildCombatantRig(`blue-${i}`, 'blue', wid);
      rig.root.position.copy(spawn);
      this.scene.add(rig.root);
      this.actors.push({
        id: `blue-${i}`,
        name: BLUE_CALLSIGNS[i] || `Ally-${i}`,
        team: 'blue',
        isPlayer: false,
        weaponId: wid,
        position: spawn.clone(),
        velocity: new THREE.Vector3(),
        yaw: 0,
        pitch: 0,
        health: 100,
        maxHealth: 100,
        alive: true,
        respawnTimer: 0,
        spawnShieldTimer: 1.5,
        kills: 0,
        deaths: 0,
        assists: 0,
        lastDamagedBy: {},
        rig,
        waypointIdx: Math.floor(Math.random() * this.arena.waypoints.length),
        strafeDir: Math.random() > 0.5 ? 1 : -1,
        strafeTimer: 1.2 + Math.random(),
        fireCooldown: 0.4,
        grenadeCooldown: 6 + Math.random() * 8,
        reactionTimer: 0.25,
        targetEnemyId: null,
        deathAnimTimer: 0,
        walkCycle: Math.random() * 6,
      });
    }

    for (let i = 0; i < teamSize; i++) {
      const wid = weaponPool[(i + 1) % weaponPool.length];
      const spawn = this.arena.redSpawns[i % this.arena.redSpawns.length];
      const rig = buildCombatantRig(`red-${i}`, 'red', wid);
      rig.root.position.copy(spawn);
      rig.root.rotation.y = Math.PI;
      this.scene.add(rig.root);
      this.actors.push({
        id: `red-${i}`,
        name: RED_CALLSIGNS[i] || `Hostile-${i}`,
        team: 'red',
        isPlayer: false,
        weaponId: wid,
        position: spawn.clone(),
        velocity: new THREE.Vector3(),
        yaw: Math.PI,
        pitch: 0,
        health: 100,
        maxHealth: 100,
        alive: true,
        respawnTimer: 0,
        spawnShieldTimer: 1.5,
        kills: 0,
        deaths: 0,
        assists: 0,
        lastDamagedBy: {},
        rig,
        waypointIdx: Math.floor(Math.random() * this.arena.waypoints.length),
        strafeDir: Math.random() > 0.5 ? 1 : -1,
        strafeTimer: 1.2 + Math.random(),
        fireCooldown: 0.4,
        grenadeCooldown: 5 + Math.random() * 7,
        reactionTimer: 0.25,
        targetEnemyId: null,
        deathAnimTimer: 0,
        walkCycle: Math.random() * 6,
      });
    }

    this.selectWeapon(this.config.startingWeapon, true);
  }

  public updateConfig(next: Partial<MatchConfig>) {
    const prevMap = this.config.mapId;
    this.config = { ...this.config, ...next };
    soundEngine.setMuted(this.config.muted);
    if (next.mapId && next.mapId !== prevMap && this.phase === 'lobby') {
      this.loadArena(next.mapId);
      this.setupMatchActors();
    }
    this.emitHud();
  }

  public startNewMatch(nextConfig?: MatchConfig) {
    if (nextConfig) {
      this.config = { ...nextConfig };
      soundEngine.setMuted(this.config.muted);
    }

    if (this.arena.mapId !== this.config.mapId) {
      this.loadArena(this.config.mapId);
    }

    this.blueScore = 0;
    this.redScore = 0;
    this.timeRemaining = 300;
    this.winner = null;
    this.killFeed = [];
    this.damageIndicators = [];
    this.pickupNotice = null;
    this.stamina = 100;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.isAds = false;
    this.adsToggle = false;
    this.recoilOffsetPitch = 0;
    this.recoilOffsetYaw = 0;
    this.hitmarkerType = 'none';
    this.lastEliminatedName = null;
    this.grenades = 2;
    this.isCookingGrenade = false;
    this.grenadeCookTimer = 0;
    this.activeMountedMg = null;
    this.nearMountedMg = null;
    this.hmgFlashTimer = 0;
    this.cameraShake = 0;
    this.explosionLight.intensity = 0;
    this.explosionLightTimer = 0;

    this.clearDynamicEffects();
    this.resetMountedMgs();

    for (const p of this.arena.pickups) {
      p.active = true;
      p.respawnTimer = 0;
      p.meshGroup.visible = true;
    }

    this.weaponStates = this.createFreshWeaponStates();
    this.setupMatchActors();

    this.phase = 'playing';
    this.weaponPivot.visible = true;
    this.requestPointerLock();
    this.emitHud();
  }

  private resetMountedMgs() {
    for (const mg of this.arena.mountedMgs) {
      mg.heat = 0;
      mg.overheated = false;
      mg.currentYaw = mg.baseYaw;
      mg.currentPitch = 0;
      mg.yawGroup.rotation.y = mg.baseYaw;
      mg.pitchGroup.rotation.x = 0;
      mg.muzzleFlash.visible = false;
      mg.barrelHeatMat.emissiveIntensity = 0;
    }
  }

  public resumeMatch() {
    if (this.phase === 'paused') {
      this.phase = 'playing';
      this.weaponPivot.visible = !this.activeMountedMg;
      this.requestPointerLock();
      this.emitHud();
    }
  }

  public pauseMatch() {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.mouseDownLeft = false;
      this.mouseDownRight = false;
      this.isAds = false;
      this.adsToggle = false;
      this.isCookingGrenade = false;
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock();
      }
      this.emitHud();
    }
  }

  public returnToLobby() {
    this.phase = 'lobby';
    this.weaponPivot.visible = false;
    this.mouseDownLeft = false;
    this.mouseDownRight = false;
    this.isCookingGrenade = false;
    this.activeMountedMg = null;
    this.nearMountedMg = null;
    this.clearDynamicEffects();
    this.resetMountedMgs();
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock();
    }
    this.emitHud();
  }

  public requestPointerLock() {
    if (this.disposed) return;
    try {
      const result = this.renderer.domElement.requestPointerLock?.() as unknown as
        | Promise<void>
        | undefined;
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          // Ignore pointer lock rejection in sandboxed iframes
        });
      }
    } catch {
      // Ignore pointer lock rejection in headless/sandboxed environments
    }
  }

  public selectWeaponFromUi(weaponId: WeaponId) {
    if (this.phase === 'playing') {
      this.selectWeapon(weaponId);
    } else {
      this.config.startingWeapon = weaponId;
      this.selectWeapon(weaponId, true);
    }
  }

  private selectWeapon(weaponId: WeaponId, instant = false) {
    if (this.activeWeapon === weaponId && !instant) return;
    this.lastWeapon = this.activeWeapon;
    this.activeWeapon = weaponId;
    if (this.player) this.player.weaponId = weaponId;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.isAds = false;
    this.adsToggle = false;

    for (const id of WEAPON_ORDER) {
      this.viewmodels[id].root.visible = id === weaponId;
    }
    if (!instant) {
      this.weaponKickZ = 0.08;
      this.weaponKickRotX = -0.18;
      soundEngine.playMechanicalClick(560, 0.04);
    }
    this.emitHud();
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('wheel', this.handleWheel, { passive: true });
    window.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
  };

  private handleContextMenu = (e: MouseEvent) => {
    if (this.phase === 'playing') {
      e.preventDefault();
    }
  };

  private handlePointerLockChange = () => {
    this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    if (!this.pointerLocked && this.phase === 'playing') {
      this.mouseDownLeft = false;
      this.mouseDownRight = false;
      this.phase = 'paused';
    }
    this.emitHud();
  };

  private handleResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (e.code === 'KeyM') {
      this.updateConfig({ muted: !this.config.muted });
      return;
    }

    if (this.phase !== 'playing') return;

    if (e.code === 'Digit1' && !this.activeMountedMg) this.selectWeapon('m4a1');
    else if (e.code === 'Digit2' && !this.activeMountedMg) this.selectWeapon('ak74');
    else if (e.code === 'Digit3' && !this.activeMountedMg) this.selectWeapon('mp5');
    else if (e.code === 'Digit4' && !this.activeMountedMg) this.selectWeapon('m870');
    else if (e.code === 'Digit5' && !this.activeMountedMg) this.selectWeapon('mk14');
    else if (e.code === 'Digit6' && !this.activeMountedMg) this.selectWeapon('m24');
    else if (e.code === 'Digit7' && !this.activeMountedMg) this.selectWeapon('rpg7');
    else if (e.code === 'KeyQ' && !this.activeMountedMg) this.selectWeapon(this.lastWeapon);
    else if (e.code === 'KeyR' && !this.activeMountedMg) this.startReload();
    else if (e.code === 'KeyF') this.adsToggle = !this.adsToggle;
    else if (e.code === 'KeyE') this.toggleMountMg();
    else if (e.code === 'KeyG' && !e.repeat) {
      if (
        this.player.alive &&
        !this.activeMountedMg &&
        this.grenades > 0 &&
        !this.isCookingGrenade
      ) {
        this.isCookingGrenade = true;
        this.grenadeCookTimer = 2.8;
        this.isAds = false;
        this.adsToggle = false;
        soundEngine.playPinPull();
        this.emitHud();
      }
    } else if (e.code === 'KeyV' || e.code === 'KeyZ') {
      if (this.activeWeapon === 'm24' || this.activeWeapon === 'mk14') {
        this.scopeZoomLevel = this.scopeZoomLevel === 1 ? 2 : 1;
        soundEngine.playMechanicalClick(680, 0.035);
        this.emitHud();
      }
    } else if (e.code === 'Tab') e.preventDefault();
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    if (e.code === 'KeyG' && this.isCookingGrenade) {
      this.throwPlayerGrenade();
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.phase !== 'playing' || !this.player.alive) return;
    if (!this.pointerLocked && !this.mouseDownLeft && !this.mouseDownRight) return;

    const fovRatio = this.camera.fov / 75;
    const sensScale =
      0.0021 *
      this.config.sensitivity *
      (this.isAds ? Math.max(0.18, fovRatio * 0.85) : 1.0);

    if (this.activeMountedMg) {
      const mg = this.activeMountedMg;
      const nextYaw = mg.currentYaw - e.movementX * sensScale * 0.72;
      let deltaFromBase = nextYaw - mg.baseYaw;
      while (deltaFromBase > Math.PI) deltaFromBase -= Math.PI * 2;
      while (deltaFromBase < -Math.PI) deltaFromBase += Math.PI * 2;
      deltaFromBase = THREE.MathUtils.clamp(deltaFromBase, -1.25, 1.25);
      mg.currentYaw = mg.baseYaw + deltaFromBase;
      mg.currentPitch = THREE.MathUtils.clamp(
        mg.currentPitch - e.movementY * sensScale * 0.72,
        -0.42,
        0.48
      );
      mg.yawGroup.rotation.y = mg.currentYaw;
      mg.pitchGroup.rotation.x = mg.currentPitch;
      this.player.yaw = mg.currentYaw;
      this.player.pitch = mg.currentPitch;
      return;
    }

    this.player.yaw -= e.movementX * sensScale;
    this.player.pitch = THREE.MathUtils.clamp(
      this.player.pitch - e.movementY * sensScale,
      -1.46,
      1.46
    );
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (this.phase !== 'playing') return;
    if (!this.pointerLocked && e.target === this.renderer.domElement) {
      this.requestPointerLock();
    }
    if (e.button === 0) {
      this.mouseDownLeft = true;
    } else if (e.button === 2) {
      this.mouseDownRight = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouseDownLeft = false;
      this.semiTriggerReleased = true;
    } else if (e.button === 2) {
      this.mouseDownRight = false;
    }
  };

  private handleWheel = (e: WheelEvent) => {
    if (this.phase !== 'playing' || this.activeMountedMg) return;
    const idx = WEAPON_ORDER.indexOf(this.activeWeapon);
    const nextIdx = (idx + (e.deltaY > 0 ? 1 : -1) + WEAPON_ORDER.length) % WEAPON_ORDER.length;
    this.selectWeapon(WEAPON_ORDER[nextIdx]);
  };

  private startReload() {
    if (this.isReloading || !this.player.alive) return;
    const state = this.weaponStates[this.activeWeapon];
    const spec = WEAPONS[this.activeWeapon];
    if (state.mag >= spec.magSize || state.reserve <= 0) return;

    this.isReloading = true;
    this.reloadTimer = spec.reloadTime;
    this.isAds = false;
    this.adsToggle = false;
    soundEngine.playReload();
    this.emitHud();
  }

  private spawnShellCasing(vm: ViewmodelHandle) {
    if (this.shells.length > 24) return;
    vm.ejectionPort.getWorldPosition(_vecB);
    const mesh = new THREE.Mesh(this.shellGeo, this.brassMat);
    mesh.position.copy(_vecB);

    // Eject to the right and slightly upward relative to camera look
    const rightVec = new THREE.Vector3(1, 0.75, 0.2).applyQuaternion(this.camera.quaternion).normalize();
    const vel = rightVec.multiplyScalar(2.4 + Math.random() * 0.9);
    vel.y += 1.2;
    const rotVel = new THREE.Vector3(
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 18
    );
    this.scene.add(mesh);
    this.shells.push({ mesh, vel, rotVel, life: 0.75 });
  }

  private toggleMountMg() {
    if (!this.player.alive) return;
    if (this.activeMountedMg) {
      this.activeMountedMg.muzzleFlash.visible = false;
      this.activeMountedMg = null;
      this.weaponPivot.visible = true;
      soundEngine.playMechanicalClick(380, 0.05);
      this.emitHud();
      return;
    }
    if (this.nearMountedMg) {
      this.activeMountedMg = this.nearMountedMg;
      this.isReloading = false;
      this.reloadTimer = 0;
      this.isCookingGrenade = false;
      this.isAds = false;
      this.adsToggle = false;
      this.weaponPivot.visible = false;
      this.player.yaw = this.activeMountedMg.currentYaw;
      this.player.pitch = this.activeMountedMg.currentPitch;
      soundEngine.playMechanicalClick(490, 0.06);
      this.emitHud();
    }
  }

  private tryFireMountedMg() {
    if (!this.player.alive || !this.activeMountedMg || this.fireCooldown > 0) return;
    const mg = this.activeMountedMg;
    if (mg.overheated) {
      if (!this.semiTriggerReleased) return;
      this.semiTriggerReleased = false;
      soundEngine.playMechanicalClick(220, 0.04);
      return;
    }

    this.fireCooldown = 60 / 550; // 550 RPM .50 Cal Browning
    mg.heat = Math.min(1, mg.heat + 0.052);
    if (mg.heat >= 1) {
      mg.overheated = true;
      soundEngine.playMechanicalClick(190, 0.09);
    }

    soundEngine.playGunshot('hmg', 1.0);
    mg.muzzleFlash.visible = true;
    mg.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
    this.hmgFlashTimer = 0.045;
    this.muzzleLight.color.setHex(0xfef08a);
    this.muzzleLight.intensity = 4.2;

    const muzzleWorld = new THREE.Vector3();
    mg.muzzlePoint.getWorldPosition(muzzleWorld);

    const spread = 0.009;
    const euler = new THREE.Euler(
      mg.currentPitch + (Math.random() - 0.5) * 2 * spread,
      mg.currentYaw + (Math.random() - 0.5) * 2 * spread,
      0,
      'YXZ'
    );
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(euler).normalize();
    const aimOrigin = this.camera.position.clone();
    this.spawnBallisticBullet(
      aimOrigin,
      muzzleWorld,
      dir,
      290,
      0.45,
      40,
      1.75,
      210,
      this.player.id,
      this.player.team,
      'M2HB',
      0xfef08a
    );

    // Eject heavy .50 cal brass casing
    if (this.shells.length <= 24) {
      const shell = new THREE.Mesh(this.shellGeo, this.brassMat);
      shell.scale.setScalar(1.45);
      shell.position.copy(mg.position).add(new THREE.Vector3(0, 1.38, 0));
      const rightVec = new THREE.Vector3(1, 0.7, 0.1).applyEuler(euler).normalize();
      const vel = rightVec.multiplyScalar(2.6 + Math.random() * 1.1);
      vel.y += 1.1;
      const rotVel = new THREE.Vector3(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 18
      );
      this.scene.add(shell);
      this.shells.push({ mesh: shell, vel, rotVel, life: 0.85 });
    }

    mg.currentPitch = THREE.MathUtils.clamp(mg.currentPitch + 0.011, -0.42, 0.48);
    mg.currentYaw += (Math.random() - 0.5) * 0.008;
    mg.yawGroup.rotation.y = mg.currentYaw;
    mg.pitchGroup.rotation.x = mg.currentPitch;
    this.player.yaw = mg.currentYaw;
    this.player.pitch = mg.currentPitch;
    this.cameraShake = Math.max(this.cameraShake, 0.075);
  }

  private throwPlayerGrenade() {
    if (!this.isCookingGrenade) return;
    this.isCookingGrenade = false;
    const fuseLeft = Math.max(0.08, this.grenadeCookTimer);
    this.grenadeCookTimer = 0;
    if (!this.player.alive || this.grenades <= 0) {
      this.emitHud();
      return;
    }

    this.grenades -= 1;
    const euler = new THREE.Euler(this.player.pitch, this.player.yaw, 0, 'YXZ');
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(euler).normalize();
    const startPos = this.camera.position.clone().addScaledVector(dir, 0.65);
    startPos.y -= 0.1;

    const throwVel = dir.multiplyScalar(21.5);
    throwVel.y += 4.2;
    throwVel.addScaledVector(this.player.velocity, 0.35);

    this.spawnFragGrenade(startPos, throwVel, fuseLeft, this.player.id, this.player.team);
    this.weaponKickZ = 0.08;
    soundEngine.playMechanicalClick(310, 0.05);
    this.emitHud();
  }

  private spawnFragGrenade(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    fuse: number,
    attackerId: string,
    team: TeamId
  ) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), this.oliveGrenadeMat);
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.036, 0.045, 8),
      this.brassMat
    );
    collar.position.y = 0.085;
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), ledMat);
    led.position.set(0, 0.115, 0);
    group.add(body, collar, led);
    group.position.copy(pos);
    this.scene.add(group);

    this.activeGrenades.push({
      pos: pos.clone(),
      vel: vel.clone(),
      rotVel: new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14
      ),
      attackerId,
      team,
      fuse,
      smokeAccum: 0,
      mesh: group,
      ledMat,
    });
  }

  private tryPlayerFire() {
    if (this.activeMountedMg) {
      this.tryFireMountedMg();
      return;
    }
    if (!this.player.alive || this.isReloading || this.fireCooldown > 0) return;
    const spec = WEAPONS[this.activeWeapon];
    if (spec.fireMode !== 'AUTO' && !this.semiTriggerReleased) return;

    const state = this.weaponStates[this.activeWeapon];
    if (state.mag <= 0) {
      this.semiTriggerReleased = false;
      if (state.reserve > 0) {
        this.startReload();
      } else {
        soundEngine.playMechanicalClick(260, 0.04);
      }
      return;
    }

    state.mag -= 1;
    this.fireCooldown = 60 / spec.rpm;
    if (spec.fireMode !== 'AUTO') {
      this.semiTriggerReleased = false;
    }

    if (this.activeWeapon === 'm870') {
      this.pumpAnimTimer = 0.55;
    }

    soundEngine.playGunshot(this.activeWeapon, 1.0);
    this.muzzleFlashTimer = 0.05;
    this.muzzleLight.color.setHex(spec.tracerColor);
    this.muzzleLight.intensity = this.activeWeapon === 'rpg7' ? 5.2 : 3.4;

    const vm = this.viewmodels[this.activeWeapon];
    vm.muzzleFlash.visible = true;
    vm.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
    const muzzleWorld = new THREE.Vector3();
    vm.muzzlePoint.getWorldPosition(muzzleWorld);
    this.boltKick = 0.045;

    if (this.activeWeapon === 'rpg7') {
      if (vm.warheadGroup) vm.warheadGroup.visible = false;
      const aimEuler = new THREE.Euler(
        this.player.pitch + this.recoilOffsetPitch,
        this.player.yaw + this.recoilOffsetYaw,
        0,
        'YXZ'
      );
      const rocketDir = new THREE.Vector3(0, 0, -1).applyEuler(aimEuler).normalize();
      const rocketStart = this.camera.position.clone().addScaledVector(rocketDir, 0.75);
      this.spawnRocket(rocketStart, rocketDir, this.player.id, this.player.team);
      this.spawnSmokePuff(
        muzzleWorld.clone().addScaledVector(rocketDir, -0.35),
        new THREE.Vector3(0, 0.6, 0),
        0.55,
        0.35,
        1.5
      );
      this.cameraShake = Math.max(this.cameraShake, 0.24);
    } else {
      if (this.activeWeapon !== 'm24' && this.activeWeapon !== 'm870') {
        this.spawnShellCasing(vm);
      } else {
        window.setTimeout(() => {
          if (!this.disposed && this.phase === 'playing') {
            this.spawnShellCasing(this.viewmodels[this.activeWeapon]);
          }
        }, 320);
      }

      const horizSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
      const moveFactor = THREE.MathUtils.clamp(horizSpeed / 8.0, 0, 1);
      const baseSpread = this.isAds ? spec.adsSpread : spec.baseSpread;
      const totalSpread = baseSpread + moveFactor * spec.moveSpreadPenalty * (this.isAds ? 0.35 : 1);

      for (let p = 0; p < spec.pellets; p++) {
        _euler.set(
          this.player.pitch + this.recoilOffsetPitch + (Math.random() - 0.5) * 2 * totalSpread,
          this.player.yaw + this.recoilOffsetYaw + (Math.random() - 0.5) * 2 * totalSpread,
          0,
          'YXZ'
        );
        const bulletDir = new THREE.Vector3(0, 0, -1).applyEuler(_euler).normalize();
        this.spawnBallisticBullet(
          this.camera.position.clone(),
          muzzleWorld.clone(),
          bulletDir,
          spec.muzzleVelocity,
          spec.gravityScale,
          spec.damage,
          spec.headshotMult,
          spec.range,
          this.player.id,
          this.player.team,
          spec.shortName,
          spec.tracerColor
        );
      }
    }

    const adsRecoilMult = this.isAds ? 0.62 : 1.0;
    this.recoilOffsetPitch = Math.min(0.28, this.recoilOffsetPitch + spec.recoilPitch * adsRecoilMult);
    this.recoilOffsetYaw += (Math.random() - 0.5) * 2 * spec.recoilYaw * adsRecoilMult;
    this.weaponKickZ = Math.min(
      0.18,
      this.weaponKickZ +
        (this.activeWeapon === 'rpg7'
          ? 0.16
          : this.activeWeapon === 'm870' || this.activeWeapon === 'm24'
          ? 0.12
          : 0.055)
    );
    this.weaponKickRotX = Math.min(
      0.34,
      this.weaponKickRotX +
        (this.activeWeapon === 'rpg7' || this.activeWeapon === 'm24' || this.activeWeapon === 'mk14'
          ? 0.2
          : 0.085)
    );

    if (state.mag === 0 && state.reserve > 0) {
      window.setTimeout(() => {
        if (!this.disposed && this.phase === 'playing') this.startReload();
      }, 160);
    }

    this.emitHud();
  }

  private spawnBallisticBullet(
    pos: THREE.Vector3,
    visualStart: THREE.Vector3,
    dir: THREE.Vector3,
    muzzleVelocity: number,
    gravityScale: number,
    damage: number,
    headshotMult: number,
    maxRange: number,
    attackerId: string,
    team: TeamId,
    weaponShort: string,
    tracerColor: number
  ) {
    if (this.bullets.length > 96) {
      const oldest = this.bullets.shift();
      if (oldest) {
        this.scene.remove(oldest.mesh);
        oldest.mesh.traverse((o) => {
          if (o instanceof THREE.Mesh && o.material !== this.brassMat) {
            (o.material as THREE.Material).dispose();
          }
        });
      }
    }

    const group = new THREE.Group();
    const core = new THREE.Mesh(this.bulletCoreGeo, this.brassMat);
    core.position.z = -0.05;
    const tracerMat = new THREE.MeshBasicMaterial({
      color: tracerColor,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    const tail = new THREE.Mesh(this.tracerTailGeo, tracerMat);
    tail.position.z = 0.65;
    group.add(core, tail);
    group.position.copy(visualStart);
    const lookTarget = pos.clone().addScaledVector(dir, 10);
    group.lookAt(lookTarget);
    this.scene.add(group);

    this.bullets.push({
      pos: pos.clone(),
      visualPos: visualStart.clone(),
      vel: dir.clone().multiplyScalar(muzzleVelocity),
      damage,
      headshotMult,
      maxRange,
      traveled: 0,
      gravityScale,
      attackerId,
      team,
      weaponShort,
      mesh: group,
      whizzed: false,
    });
  }

  private spawnRocket(pos: THREE.Vector3, dir: THREE.Vector3, attackerId: string, team: TeamId) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3f4e34,
      metalness: 0.35,
      roughness: 0.55,
    });
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0xc27830,
      metalness: 0.65,
      roughness: 0.35,
    });
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffa030,
      transparent: true,
      opacity: 0.92,
    });

    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.45, 8), bodyMat);
    tube.rotation.x = Math.PI / 2;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 8), noseMat);
    cone.rotation.x = -Math.PI / 2;
    cone.position.z = -0.32;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.32, 7), flameMat);
    flame.rotation.x = Math.PI / 2;
    flame.position.z = 0.38;

    group.add(tube, cone, flame);
    group.position.copy(pos);
    group.lookAt(pos.clone().add(dir));
    this.scene.add(group);

    this.rockets.push({
      pos: pos.clone(),
      vel: dir.clone().multiplyScalar(WEAPONS.rpg7.muzzleVelocity),
      attackerId,
      team,
      life: 4.5,
      smokeAccum: 0,
      mesh: group,
    });
  }

  private triggerExplosion(
    center: THREE.Vector3,
    radius: number,
    maxDamage: number,
    attacker: CombatantActor | undefined,
    weaponShort: string
  ) {
    const distToPlayer = this.player ? center.distanceTo(this.player.position) : 40;
    const vol = THREE.MathUtils.clamp(1.15 - distToPlayer / 55, 0.15, 1.0);
    soundEngine.playExplosion(vol);

    if (distToPlayer < 28) {
      this.cameraShake = Math.min(1.0, this.cameraShake + (1 - distToPlayer / 28) * 0.65);
    }

    this.explosionLight.position.copy(center).add(new THREE.Vector3(0, 0.75, 0));
    this.explosionLight.intensity = 9.5;
    this.explosionLightTimer = 0.32;

    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xff7b1c,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const fireball = new THREE.Mesh(this.fireballGeo, fireMat);
    fireball.position.copy(center);
    fireball.scale.setScalar(0.35);
    this.scene.add(fireball);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(this.shockRingGeo, ringMat);
    ring.position.copy(center).add(new THREE.Vector3(0, 0.12, 0));
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);

    this.explosions.push({ fireball, ring, life: 0.42, maxLife: 0.42, radius });

    for (let i = 0; i < 6; i++) {
      this.spawnSmokePuff(
        center.clone().add(
          new THREE.Vector3((Math.random() - 0.5) * 1.1, 0.3 + Math.random() * 0.6, (Math.random() - 0.5) * 1.1)
        ),
        new THREE.Vector3((Math.random() - 0.5) * 2.2, 2.2 + Math.random() * 2.4, (Math.random() - 0.5) * 2.2),
        1.1 + Math.random() * 0.4,
        0.55,
        2.3
      );
    }
    this.spawnSparks(center, 0xff9f2e, 14);

    if (!attacker) return;
    let bestHit: 'none' | 'body' | 'kill' = 'none';
    let killedName: string | null = null;

    const blastEye = center.clone().add(new THREE.Vector3(0, 0.35, 0));
    for (const victim of this.actors) {
      if (!victim.alive) continue;
      if (victim.team === attacker.team && victim.id !== attacker.id) continue;

      const victimCenter = new THREE.Vector3(victim.position.x, victim.position.y + 1.05, victim.position.z);
      const dist = blastEye.distanceTo(victimCenter);
      if (dist > radius) continue;

      const losClear = this.hasLineOfSight(blastEye, victimCenter);
      const falloff = Math.pow(1 - dist / radius, 0.8);
      const selfMult = victim.id === attacker.id ? 0.6 : 1.0;
      const losMult = losClear ? 1.0 : 0.42;
      const dmg = Math.max(8, Math.round(maxDamage * falloff * selfMult * losMult));

      const killed = this.applyDamage(victim, attacker, dmg, false, weaponShort);
      if (attacker.isPlayer && victim.team !== attacker.team) {
        if (killed) {
          bestHit = 'kill';
          killedName = victim.name;
        } else if (bestHit === 'none') {
          bestHit = 'body';
        }
      }
    }

    if (bestHit !== 'none') {
      this.hitmarkerType = bestHit;
      this.hitmarkerTime = performance.now();
      if (bestHit === 'kill') {
        this.lastEliminatedName = killedName;
        this.lastEliminatedHeadshot = false;
      }
      soundEngine.playHitmarker(bestHit === 'kill', bestHit === 'kill');
    }
  }

  private applyDamage(
    victim: CombatantActor,
    attacker: CombatantActor,
    amount: number,
    isHeadshot: boolean,
    weaponShort: string
  ): boolean {
    if (!victim.alive || victim.spawnShieldTimer > 0) return false;

    const now = performance.now();
    victim.health = Math.max(0, victim.health - amount);
    victim.lastDamagedBy[attacker.id] = now;

    if (victim.isPlayer) {
      soundEngine.playDamageTaken();
      this.cameraShake = Math.min(0.85, this.cameraShake + amount * 0.005);
      const dx = attacker.position.x - victim.position.x;
      const dz = attacker.position.z - victim.position.z;
      const worldAngle = Math.atan2(-dx, -dz);
      const relAngle = worldAngle - victim.yaw;
      this.damageIndicators.push({
        id: this.dmgSeq++,
        angleRad: relAngle,
        intensity: THREE.MathUtils.clamp(amount / 45, 0.45, 1.0),
        expiresAt: now + 950,
      });
    }

    if (victim.health <= 0) {
      victim.alive = false;
      victim.deaths += 1;
      victim.respawnTimer = 3.2;
      victim.deathAnimTimer = 0;

      if (victim.isPlayer && this.activeMountedMg) {
        this.activeMountedMg.muzzleFlash.visible = false;
        this.activeMountedMg = null;
      }
      if (victim.isPlayer) {
        this.isCookingGrenade = false;
      }

      if (victim.id !== attacker.id) {
        attacker.kills += 1;
        if (attacker.team === 'blue') this.blueScore += 1;
        else this.redScore += 1;
      }

      for (const [otherId, ts] of Object.entries(victim.lastDamagedBy)) {
        if (otherId !== attacker.id && now - ts < 5500) {
          const assister = this.actors.find((a) => a.id === otherId);
          if (assister && assister.team === attacker.team) {
            assister.assists += 1;
          }
        }
      }

      this.killFeed.unshift({
        id: this.killFeedSeq++,
        killerName: attacker.name,
        killerTeam: attacker.team,
        victimName: victim.name,
        victimTeam: victim.team,
        weaponShort,
        isHeadshot,
        timestamp: now,
      });
      if (this.killFeed.length > 5) this.killFeed.pop();

      if (this.blueScore >= this.config.scoreLimit || this.redScore >= this.config.scoreLimit) {
        this.endMatch();
      }
      return true;
    }

    return false;
  }

  private endMatch() {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    this.mouseDownLeft = false;
    this.mouseDownRight = false;
    this.isAds = false;
    this.isCookingGrenade = false;
    this.activeMountedMg = null;
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock();
    }

    if (this.blueScore > this.redScore) this.winner = 'blue';
    else if (this.redScore > this.blueScore) this.winner = 'red';
    else this.winner = 'draw';

    soundEngine.playMatchEnd(this.winner === 'blue');
    this.emitHud();
  }

  private respawnActor(actor: CombatantActor) {
    const spawns = actor.team === 'blue' ? this.arena.blueSpawns : this.arena.redSpawns;
    let bestSpawn = spawns[0];
    let bestMinEnemyDist = -1;

    for (const sp of spawns) {
      let minDist = 9999;
      for (const other of this.actors) {
        if (other.team !== actor.team && other.alive) {
          const d = sp.distanceTo(other.position);
          if (d < minDist) minDist = d;
        }
      }
      if (minDist > bestMinEnemyDist) {
        bestMinEnemyDist = minDist;
        bestSpawn = sp;
      }
    }

    actor.position.copy(bestSpawn);
    actor.position.x += (Math.random() - 0.5) * 1.4;
    actor.velocity.set(0, 0, 0);
    actor.health = actor.maxHealth;
    actor.alive = true;
    actor.spawnShieldTimer = 1.4;
    actor.lastDamagedBy = {};
    actor.yaw = actor.team === 'blue' ? 0 : Math.PI;
    actor.pitch = 0;

    if (actor.isPlayer) {
      this.weaponStates = this.createFreshWeaponStates();
      this.grenades = 2;
      this.isCookingGrenade = false;
      this.activeMountedMg = null;
      this.isReloading = false;
      this.reloadTimer = 0;
      this.recoilOffsetPitch = 0;
      this.recoilOffsetYaw = 0;
    } else if (actor.rig) {
      actor.rig.root.visible = true;
      actor.rig.bodyPivot.rotation.set(0, 0, 0);
      actor.rig.bodyPivot.position.y = 0;
    }
  }

  private spawnSmokePuff(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    life: number,
    startScale: number,
    endScale: number
  ) {
    if (this.smokePuffs.length > 48) return;
    const mat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.96,
      metalness: 0,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.smokeGeo, mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(startScale);
    this.scene.add(mesh);
    this.smokePuffs.push({ mesh, vel, life, maxLife: life, startScale, endScale });
  }

  private spawnBulletHoleDecal(hit: THREE.Intersection) {
    if (!hit.face) return;
    if (this.bulletHoles.length >= 42) {
      const oldest = this.bulletHoles.shift();
      if (oldest) this.scene.remove(oldest);
    }
    const normal = hit.face.normal.clone();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
    normal.applyMatrix3(normalMatrix).normalize();

    const decal = new THREE.Mesh(this.holeGeo, this.bulletHoleMat);
    decal.position.copy(hit.point).addScaledVector(normal, 0.015);
    decal.lookAt(hit.point.clone().add(normal));
    decal.rotateZ(Math.random() * Math.PI * 2);
    this.scene.add(decal);
    this.bulletHoles.push(decal);
  }

  private spawnSparks(point: THREE.Vector3, colorHex: number, count: number) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.copy(point);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        Math.random() * 4.5 + 1.0,
        (Math.random() - 0.5) * 7
      );
      this.scene.add(mesh);
      this.sparks.push({ mesh, vel, life: 0.24, maxLife: 0.24 });
    }
  }

  private clearDynamicEffects() {
    for (const b of this.bullets) {
      this.scene.remove(b.mesh);
      b.mesh.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material !== this.brassMat) {
          (o.material as THREE.Material).dispose();
        }
      });
    }
    this.bullets = [];

    for (const r of this.rockets) {
      this.scene.remove(r.mesh);
      r.mesh.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    }
    this.rockets = [];

    for (const g of this.activeGrenades) {
      this.scene.remove(g.mesh);
      g.mesh.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          if (o.material !== this.oliveGrenadeMat && o.material !== this.brassMat) {
            (o.material as THREE.Material).dispose();
          }
        }
      });
    }
    this.activeGrenades = [];

    for (const s of this.smokePuffs) {
      this.scene.remove(s.mesh);
      (s.mesh.material as THREE.Material).dispose();
    }
    this.smokePuffs = [];

    for (const ex of this.explosions) {
      this.scene.remove(ex.fireball);
      this.scene.remove(ex.ring);
      (ex.fireball.material as THREE.Material).dispose();
      (ex.ring.material as THREE.Material).dispose();
    }
    this.explosions = [];

    for (const sp of this.sparks) {
      this.scene.remove(sp.mesh);
      (sp.mesh.material as THREE.Material).dispose();
    }
    this.sparks = [];

    for (const sh of this.shells) {
      this.scene.remove(sh.mesh);
    }
    this.shells = [];

    for (const h of this.bulletHoles) {
      this.scene.remove(h);
    }
    this.bulletHoles = [];
  }

  private hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    _vecC.copy(to).sub(from);
    const dist = _vecC.length();
    if (dist < 0.01) return true;
    _vecC.divideScalar(dist);
    this.raycaster.set(from, _vecC);
    this.raycaster.far = dist;
    const hits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
    return hits.length === 0;
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    if (p.spawnShieldTimer > 0) p.spawnShieldTimer = Math.max(0, p.spawnShieldTimer - dt);

    if (this.explosionLightTimer > 0) {
      this.explosionLightTimer -= dt;
      this.explosionLight.intensity = Math.max(0, (this.explosionLightTimer / 0.32) * 9.5);
    }
    this.cameraShake = Math.max(0, this.cameraShake - dt * 2.2);
    const shakeX = (Math.random() - 0.5) * this.cameraShake * 0.08;
    const shakeY = (Math.random() - 0.5) * this.cameraShake * 0.08;

    if (this.hmgFlashTimer > 0) {
      this.hmgFlashTimer -= dt;
      if (this.hmgFlashTimer <= 0) {
        for (const mg of this.arena.mountedMgs) mg.muzzleFlash.visible = false;
        this.muzzleLight.intensity = 0;
      }
    }

    if (!p.alive) {
      p.respawnTimer -= dt;
      if (p.respawnTimer <= 0) {
        this.respawnActor(p);
      }
      this.camera.position.set(p.position.x, p.position.y + 1.9, p.position.z);
      this.camera.rotation.set(-0.35, p.yaw, 0, 'YXZ');
      this.weaponPivot.visible = false;
      this.nearMountedMg = null;
      return;
    }

    // Check proximity to any fixed .50 cal HMG emplacement
    this.nearMountedMg = null;
    if (!this.activeMountedMg) {
      let bestDist = 2.6;
      for (const mg of this.arena.mountedMgs) {
        const d = Math.hypot(p.position.x - mg.position.x, p.position.z - mg.position.z);
        if (d < bestDist && Math.abs(p.position.y - mg.position.y) < 1.8) {
          bestDist = d;
          this.nearMountedMg = mg;
        }
      }
    }

    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    // Mounted .50 Cal HMG Gunner Mode
    if (this.activeMountedMg) {
      const mg = this.activeMountedMg;
      this.weaponPivot.visible = false;
      const wantZoom = this.mouseDownRight || this.adsToggle;
      this.isAds = wantZoom;

      if (this.keys['Space']) {
        this.toggleMountMg();
        return;
      }

      if (this.mouseDownLeft) {
        this.tryFireMountedMg();
      }

      const fwdX = -Math.sin(mg.currentYaw);
      const fwdZ = -Math.cos(mg.currentYaw);
      p.position.set(mg.position.x - fwdX * 0.72, mg.position.y, mg.position.z - fwdZ * 0.72);
      p.velocity.set(0, 0, 0);

      this.camera.position.set(
        mg.position.x - fwdX * 0.34,
        mg.position.y + 1.48,
        mg.position.z - fwdZ * 0.34
      );
      this.camera.rotation.set(
        THREE.MathUtils.clamp(mg.currentPitch + shakeY, -1.48, 1.48),
        mg.currentYaw + shakeX,
        0,
        'YXZ'
      );

      const targetFov = wantZoom ? 54 : 70;
      if (Math.abs(this.camera.fov - targetFov) > 0.05) {
        this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, dt);
        this.camera.updateProjectionMatrix();
      }
      return;
    }

    this.weaponPivot.visible = true;

    if (this.isCookingGrenade) {
      this.grenadeCookTimer -= dt;
      if (this.grenadeCookTimer <= 0) {
        this.throwPlayerGrenade();
      }
    }

    const wantAds = (this.mouseDownRight || this.adsToggle) && !this.isReloading && !this.isCookingGrenade;
    this.isAds = wantAds;

    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const spec = WEAPONS[this.activeWeapon];
        const state = this.weaponStates[this.activeWeapon];
        const needed = spec.magSize - state.mag;
        const transfer = Math.min(needed, state.reserve);
        state.mag += transfer;
        state.reserve -= transfer;
        this.isReloading = false;
        this.reloadTimer = 0;
        soundEngine.playMechanicalClick(740, 0.05);
      }
    }

    if (this.mouseDownLeft) {
      this.tryPlayerFire();
    }

    const fwd =
      (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
      (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
    const strafe =
      (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
      (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);

    const wantsSprint =
      (this.keys['ShiftLeft'] || this.keys['ShiftRight']) &&
      fwd > 0 &&
      !this.isAds &&
      !this.mouseDownLeft &&
      this.stamina > 5;

    if (wantsSprint) {
      this.stamina = Math.max(0, this.stamina - 26 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 18 * dt);
    }

    const spec = WEAPONS[this.activeWeapon];
    const baseSpeed = wantsSprint ? 10.4 : this.isAds ? 5.2 : 7.3;
    const targetSpeed = baseSpeed * spec.moveSpeedMult;

    _vecA.set(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
    _vecB.set(Math.cos(p.yaw), 0, -Math.sin(p.yaw));

    _dir.set(0, 0, 0);
    if (fwd !== 0) _dir.addScaledVector(_vecA, fwd);
    if (strafe !== 0) _dir.addScaledVector(_vecB, strafe);
    if (_dir.lengthSq() > 0) _dir.normalize();

    const accel = this.grounded ? 16 : 6;
    p.velocity.x = THREE.MathUtils.damp(p.velocity.x, _dir.x * targetSpeed, accel, dt);
    p.velocity.z = THREE.MathUtils.damp(p.velocity.z, _dir.z * targetSpeed, accel, dt);

    if (this.keys['Space'] && this.grounded) {
      p.velocity.y = 8.4;
      this.grounded = false;
      soundEngine.playMechanicalClick(190, 0.04);
    }

    p.velocity.y -= 24 * dt;

    p.position.x += p.velocity.x * dt;
    p.position.z += p.velocity.z * dt;
    resolveHorizontalCollision(p.position, 0.48, 1.8, this.arena);

    p.position.y += p.velocity.y * dt;
    const floorY = groundHeightAt(p.position.x, p.position.z, p.position.y, this.arena);
    if (p.position.y <= floorY) {
      p.position.y = floorY;
      p.velocity.y = 0;
      this.grounded = true;
    } else if (p.position.y > floorY + 0.08) {
      this.grounded = false;
    }

    this.recoilOffsetPitch = THREE.MathUtils.damp(this.recoilOffsetPitch, 0, 10, dt);
    this.recoilOffsetYaw = THREE.MathUtils.damp(this.recoilOffsetYaw, 0, 10, dt);

    const horizSpeed = Math.hypot(p.velocity.x, p.velocity.z);
    if (this.grounded && horizSpeed > 0.8) {
      this.walkBobPhase += dt * (wantsSprint ? 13.5 : 9.8);
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0) {
        this.footstepTimer = wantsSprint ? 0.31 : 0.44;
        soundEngine.playMechanicalClick(115 + Math.random() * 25, 0.03);
      }
    } else {
      this.walkBobPhase = 0;
    }

    const bobY =
      this.grounded && horizSpeed > 0.8
        ? Math.sin(this.walkBobPhase) * 0.04 * (this.isAds ? 0.3 : 1)
        : 0;
    const bobX =
      this.grounded && horizSpeed > 0.8
        ? Math.cos(this.walkBobPhase * 0.5) * 0.022 * (this.isAds ? 0.25 : 1)
        : 0;

    this.camera.position.set(p.position.x, p.position.y + 1.66 + bobY, p.position.z);
    this.camera.rotation.set(
      THREE.MathUtils.clamp(p.pitch + this.recoilOffsetPitch + shakeY, -1.48, 1.48),
      p.yaw + this.recoilOffsetYaw + shakeX,
      0,
      'YXZ'
    );

    let adsTargetFov = spec.adsFov;
    if (this.activeWeapon === 'm24') {
      adsTargetFov = this.scopeZoomLevel === 2 ? 14 : 26;
    } else if (this.activeWeapon === 'mk14') {
      adsTargetFov = this.scopeZoomLevel === 2 ? 28 : 42;
    }
    const targetFov = this.isAds ? adsTargetFov : wantsSprint ? 81 : 75;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, dt);
      this.camera.updateProjectionMatrix();
    }

    this.weaponKickZ = THREE.MathUtils.damp(this.weaponKickZ, 0, 14, dt);
    this.weaponKickRotX = THREE.MathUtils.damp(this.weaponKickRotX, 0, 14, dt);
    this.boltKick = THREE.MathUtils.damp(this.boltKick, 0, 22, dt);

    const vmTargetX = this.isAds ? 0 : 0.22 + bobX;
    const vmTargetY = this.isAds ? -0.088 : -0.18 - Math.abs(bobY) * 0.45;
    const vmTargetZ = (this.isAds ? -0.28 : -0.39) + this.weaponKickZ;

    this.viewmodels.m24.root.visible =
      this.activeWeapon === 'm24' && !(this.isAds && this.camera.fov < 38);
    this.viewmodels.mk14.root.visible =
      this.activeWeapon === 'mk14' && !(this.isAds && this.camera.fov < 48);
    this.viewmodels.rpg7.root.visible =
      this.activeWeapon === 'rpg7' && !(this.isAds && this.camera.fov < 52);

    if (this.viewmodels.rpg7.warheadGroup) {
      this.viewmodels.rpg7.warheadGroup.visible =
        this.weaponStates.rpg7.mag > 0 && !this.isReloading;
    }

    const activeVm = this.viewmodels[this.activeWeapon];
    if (activeVm.boltCarrier) {
      activeVm.boltCarrier.position.z = -0.05 + this.boltKick;
    }

    this.weaponPivot.position.x = THREE.MathUtils.damp(this.weaponPivot.position.x, vmTargetX, 16, dt);
    this.weaponPivot.position.y = THREE.MathUtils.damp(
      this.weaponPivot.position.y,
      this.isReloading ? vmTargetY - 0.14 : vmTargetY,
      14,
      dt
    );
    this.weaponPivot.position.z = THREE.MathUtils.damp(this.weaponPivot.position.z, vmTargetZ, 16, dt);

    const targetRotX = this.isReloading ? -0.45 : this.weaponKickRotX;
    const targetRotZ = this.isReloading ? 0.35 : 0;
    this.weaponPivot.rotation.x = THREE.MathUtils.damp(this.weaponPivot.rotation.x, targetRotX, 14, dt);
    this.weaponPivot.rotation.z = THREE.MathUtils.damp(this.weaponPivot.rotation.z, targetRotZ, 14, dt);

    const shotgunVm = this.viewmodels.m870;
    if (this.pumpAnimTimer > 0 && shotgunVm.pumpSlide) {
      this.pumpAnimTimer = Math.max(0, this.pumpAnimTimer - dt);
      const t = Math.sin((this.pumpAnimTimer / 0.55) * Math.PI);
      shotgunVm.pumpSlide.position.z = -0.34 + t * 0.095;
    } else if (shotgunVm.pumpSlide) {
      shotgunVm.pumpSlide.position.z = -0.34;
    }

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        this.viewmodels[this.activeWeapon].muzzleFlash.visible = false;
        this.muzzleLight.intensity = 0;
      }
    }
  }

  private getDifficultyParams(diff: Difficulty) {
    if (diff === 'recruit') {
      return { reaction: 0.45, spreadMult: 2.1, speed: 5.2, fireRateMult: 0.65 };
    }
    if (diff === 'veteran') {
      return { reaction: 0.14, spreadMult: 0.95, speed: 6.8, fireRateMult: 1.0 };
    }
    return { reaction: 0.25, spreadMult: 1.45, speed: 6.0, fireRateMult: 0.82 };
  }

  private updateBots(dt: number) {
    const diffParams = this.getDifficultyParams(this.config.difficulty);

    for (const bot of this.actors) {
      if (bot.isPlayer || !bot.rig) continue;

      if (bot.spawnShieldTimer > 0) bot.spawnShieldTimer = Math.max(0, bot.spawnShieldTimer - dt);

      if (!bot.alive) {
        bot.respawnTimer -= dt;
        bot.deathAnimTimer = Math.min(1, bot.deathAnimTimer + dt * 4.5);
        bot.rig.bodyPivot.rotation.x = bot.deathAnimTimer * (Math.PI / 2);
        bot.rig.bodyPivot.position.y = -bot.deathAnimTimer * 0.35;
        if (bot.deathAnimTimer >= 1 && bot.respawnTimer < 2.2) {
          bot.rig.root.visible = false;
        }
        if (bot.respawnTimer <= 0) {
          this.respawnActor(bot);
        }
        continue;
      }

      if (bot.fireCooldown > 0) bot.fireCooldown -= dt;
      if (bot.grenadeCooldown > 0) bot.grenadeCooldown -= dt;

      const eyePos = _vecA.set(bot.position.x, bot.position.y + 1.55, bot.position.z);
      let visibleEnemy: CombatantActor | null = null;
      let nearestEnemyDist = 65;

      for (const other of this.actors) {
        if (other.team === bot.team || !other.alive) continue;
        const d = bot.position.distanceTo(other.position);
        if (d < nearestEnemyDist) {
          const targetEye = _vecB.set(other.position.x, other.position.y + 1.38, other.position.z);
          if (this.hasLineOfSight(eyePos, targetEye)) {
            nearestEnemyDist = d;
            visibleEnemy = other;
          }
        }
      }

      const spec = WEAPONS[bot.weaponId];
      let moveDirX = 0;
      let moveDirZ = 0;
      let moveSpeed = diffParams.speed * spec.moveSpeedMult;

      if (visibleEnemy) {
        if (bot.targetEnemyId !== visibleEnemy.id) {
          bot.targetEnemyId = visibleEnemy.id;
          bot.reactionTimer = diffParams.reaction;
        } else {
          bot.reactionTimer = Math.max(0, bot.reactionTimer - dt);
        }

        const dx = visibleEnemy.position.x - bot.position.x;
        const dz = visibleEnemy.position.z - bot.position.z;
        const desiredYaw = Math.atan2(dx, dz);
        let deltaYaw = desiredYaw - bot.yaw;
        while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
        while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
        bot.yaw += deltaYaw * Math.min(1, dt * 10);

        bot.strafeTimer -= dt;
        if (bot.strafeTimer <= 0) {
          bot.strafeDir = Math.random() > 0.5 ? 1 : -1;
          bot.strafeTimer = 0.8 + Math.random() * 1.1;
        }

        const preferredDist =
          bot.weaponId === 'm870'
            ? 8
            : bot.weaponId === 'mp5'
            ? 13
            : bot.weaponId === 'm24'
            ? 29
            : bot.weaponId === 'mk14'
            ? 24
            : 19;

        const normDist = Math.max(0.01, Math.hypot(dx, dz));
        const fwdX = dx / normDist;
        const fwdZ = dz / normDist;
        const rightX = -fwdZ;
        const rightZ = fwdX;

        const approach = normDist > preferredDist + 3 ? 0.75 : normDist < preferredDist - 3 ? -0.55 : 0;
        moveDirX = fwdX * approach + rightX * bot.strafeDir * 0.85;
        moveDirZ = fwdZ * approach + rightZ * bot.strafeDir * 0.85;
        moveSpeed *= 0.82;

        if (
          this.config.difficulty !== 'recruit' &&
          bot.grenadeCooldown <= 0 &&
          nearestEnemyDist > 10 &&
          nearestEnemyDist < 24 &&
          Math.random() < 0.04
        ) {
          bot.grenadeCooldown = 14 + Math.random() * 10;
          const tossDir = new THREE.Vector3(dx, 0, dz).normalize();
          const startPos = new THREE.Vector3(bot.position.x, bot.position.y + 1.5, bot.position.z).addScaledVector(
            tossDir,
            0.7
          );
          const speed = THREE.MathUtils.clamp(nearestEnemyDist * 0.95, 11, 22);
          const tossVel = tossDir.multiplyScalar(speed);
          tossVel.y = 5.4;
          this.spawnFragGrenade(startPos, tossVel, 2.3, bot.id, bot.team);
        } else if (bot.reactionTimer <= 0 && bot.fireCooldown <= 0 && nearestEnemyDist <= spec.range * 0.9) {
          this.fireBotWeapon(bot, visibleEnemy, diffParams.spreadMult, diffParams.fireRateMult);
        }
      } else {
        bot.targetEnemyId = null;

        let navTarget: THREE.Vector3 | null = null;
        if (bot.health < 50) {
          let bestMedDist = 28;
          for (const pk of this.arena.pickups) {
            if (pk.type === 'health' && pk.active) {
              const d = bot.position.distanceTo(pk.position);
              if (d < bestMedDist) {
                bestMedDist = d;
                navTarget = pk.position;
              }
            }
          }
        }

        if (!navTarget) {
          const wp = this.arena.waypoints[bot.waypointIdx];
          if (bot.position.distanceTo(wp) < 2.4) {
            bot.waypointIdx = Math.floor(Math.random() * this.arena.waypoints.length);
          }
          navTarget = this.arena.waypoints[bot.waypointIdx];
        }

        const dx = navTarget.x - bot.position.x;
        const dz = navTarget.z - bot.position.z;
        const len = Math.hypot(dx, dz);
        if (len > 0.1) {
          moveDirX = dx / len;
          moveDirZ = dz / len;
          const desiredYaw = Math.atan2(moveDirX, moveDirZ);
          let deltaYaw = desiredYaw - bot.yaw;
          while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
          while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
          bot.yaw += deltaYaw * Math.min(1, dt * 6.5);
        }
      }

      for (const other of this.actors) {
        if (other.id === bot.id || !other.alive) continue;
        const sepX = bot.position.x - other.position.x;
        const sepZ = bot.position.z - other.position.z;
        const distSq = sepX * sepX + sepZ * sepZ;
        if (distSq > 0.001 && distSq < 2.25) {
          const dist = Math.sqrt(distSq);
          moveDirX += (sepX / dist) * (1.5 - dist) * 1.2;
          moveDirZ += (sepZ / dist) * (1.5 - dist) * 1.2;
        }
      }

      const moveLen = Math.hypot(moveDirX, moveDirZ);
      if (moveLen > 0.01) {
        moveDirX /= moveLen;
        moveDirZ /= moveLen;
      }

      const prevX = bot.position.x;
      const prevZ = bot.position.z;
      bot.position.x += moveDirX * moveSpeed * dt;
      bot.position.z += moveDirZ * moveSpeed * dt;
      resolveHorizontalCollision(bot.position, 0.48, 1.8, this.arena);

      const movedDist = Math.hypot(bot.position.x - prevX, bot.position.z - prevZ);
      if (!visibleEnemy && movedDist < moveSpeed * dt * 0.25) {
        bot.waypointIdx = Math.floor(Math.random() * this.arena.waypoints.length);
      }

      const targetGround = groundHeightAt(bot.position.x, bot.position.z, bot.position.y + 0.3, this.arena);
      bot.position.y = THREE.MathUtils.damp(bot.position.y, targetGround, 14, dt);

      bot.rig.root.position.copy(bot.position);
      bot.rig.root.rotation.y = bot.yaw;

      const actualSpeed = movedDist / Math.max(0.001, dt);
      if (actualSpeed > 0.5) {
        bot.walkCycle += dt * actualSpeed * 1.5;
        const swing = Math.sin(bot.walkCycle) * 0.55;
        bot.rig.leftLeg.rotation.x = swing;
        bot.rig.rightLeg.rotation.x = -swing;
      } else {
        bot.rig.leftLeg.rotation.x = THREE.MathUtils.damp(bot.rig.leftLeg.rotation.x, 0, 10, dt);
        bot.rig.rightLeg.rotation.x = THREE.MathUtils.damp(bot.rig.rightLeg.rotation.x, 0, 10, dt);
      }
    }
  }

  private fireBotWeapon(
    bot: CombatantActor,
    target: CombatantActor,
    spreadMult: number,
    fireRateMult: number
  ) {
    const spec = WEAPONS[bot.weaponId];
    bot.fireCooldown = ((60 / spec.rpm) / fireRateMult) * (1.05 + Math.random() * 0.35);

    const muzzlePos = new THREE.Vector3();
    if (bot.rig) {
      bot.rig.muzzleWorldAnchor.getWorldPosition(muzzlePos);
    } else {
      muzzlePos.set(bot.position.x, bot.position.y + 1.35, bot.position.z);
    }

    const distToPlayer = bot.position.distanceTo(this.player.position);
    const vol = THREE.MathUtils.clamp(1 - distToPlayer / 65, 0.05, 0.55);
    soundEngine.playGunshot(bot.weaponId, vol);

    const targetCenter = new THREE.Vector3(target.position.x, target.position.y + 1.25, target.position.z);
    const flightTime = muzzlePos.distanceTo(targetCenter) / spec.muzzleVelocity;
    // Slight ballistic elevation lead
    targetCenter.y += 0.5 * 9.81 * spec.gravityScale * flightTime * flightTime;
    const baseDir = targetCenter.sub(muzzlePos).normalize();
    const spread = Math.max(0.025, spec.baseSpread * 2.2 * spreadMult);

    for (let p = 0; p < spec.pellets; p++) {
      const shotDir = baseDir
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread
          )
        )
        .normalize();

      this.spawnBallisticBullet(
        muzzlePos.clone(),
        muzzlePos.clone(),
        shotDir,
        spec.muzzleVelocity,
        spec.gravityScale,
        spec.damage,
        spec.headshotMult,
        spec.range,
        bot.id,
        bot.team,
        spec.shortName,
        spec.tracerColor
      );
    }
  }

  private updatePickups(dt: number) {
    if (this.pickupNoticeTimer > 0) {
      this.pickupNoticeTimer -= dt;
      if (this.pickupNoticeTimer <= 0) this.pickupNotice = null;
    }

    const nowSec = performance.now() * 0.001;
    for (const pk of this.arena.pickups) {
      if (!pk.active) {
        pk.respawnTimer -= dt;
        if (pk.respawnTimer <= 0) {
          pk.active = true;
          pk.meshGroup.visible = true;
        }
        continue;
      }

      pk.meshGroup.rotation.y += dt * 1.8;
      pk.meshGroup.position.y = pk.position.y + 0.65 + Math.sin(nowSec * 3.0) * 0.09;

      for (const actor of this.actors) {
        if (!actor.alive) continue;
        const dx = actor.position.x - pk.position.x;
        const dz = actor.position.z - pk.position.z;
        const dy = Math.abs(actor.position.y - pk.position.y);
        if (dx * dx + dz * dz < 1.8 && dy < 1.5) {
          if (pk.type === 'health' && actor.health < actor.maxHealth) {
            actor.health = Math.min(actor.maxHealth, actor.health + 40);
            pk.active = false;
            pk.respawnTimer = 14;
            pk.meshGroup.visible = false;
            if (actor.isPlayer) {
              soundEngine.playPickup();
              this.pickupNotice = '+40 Health Restored';
              this.pickupNoticeTimer = 2.0;
            }
            break;
          } else if (pk.type === 'ammo' && actor.isPlayer) {
            let refilled = false;
            for (const wid of WEAPON_ORDER) {
              const st = this.weaponStates[wid];
              const maxRes = WEAPONS[wid].reserveMax;
              if (st.reserve < maxRes) {
                st.reserve = Math.min(maxRes, st.reserve + Math.ceil(maxRes * 0.5));
                refilled = true;
              }
            }
            if (this.grenades < this.maxGrenades) {
              this.grenades = Math.min(this.maxGrenades, this.grenades + 1);
              refilled = true;
            }
            if (refilled) {
              pk.active = false;
              pk.respawnTimer = 16;
              pk.meshGroup.visible = false;
              soundEngine.playPickup();
              this.pickupNotice = 'Ammo & Grenades Resupplied';
              this.pickupNoticeTimer = 2.0;
              break;
            }
          }
        }
      }
    }
  }

  private removeBulletAt(index: number) {
    const b = this.bullets[index];
    this.scene.remove(b.mesh);
    b.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material !== this.brassMat) {
        (o.material as THREE.Material).dispose();
      }
    });
    this.bullets.splice(index, 1);
  }

  private removeRocketAt(index: number) {
    const r = this.rockets[index];
    this.scene.remove(r.mesh);
    r.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    this.rockets.splice(index, 1);
  }

  private removeGrenadeAt(index: number) {
    const g = this.activeGrenades[index];
    this.scene.remove(g.mesh);
    g.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        if (o.material !== this.oliveGrenadeMat && o.material !== this.brassMat) {
          (o.material as THREE.Material).dispose();
        }
      }
    });
    this.activeGrenades.splice(index, 1);
  }

  private updateEffects(dt: number) {
    // 1. Mounted .50 Cal HMG barrel cooling & thermal glow
    for (const mg of this.arena.mountedMgs) {
      const coolingRate = mg.overheated ? 0.42 : 0.22;
      if (mg.heat > 0 && !(this.activeMountedMg === mg && this.mouseDownLeft && !mg.overheated)) {
        mg.heat = Math.max(0, mg.heat - coolingRate * dt);
        if (mg.overheated && mg.heat <= 0.12) {
          mg.overheated = false;
        }
      }
      mg.barrelHeatMat.emissiveIntensity = mg.heat > 0.25 ? (mg.heat - 0.25) * 1.9 : 0;
    }

    // 2. Simulate Ballistic Bullets (velocity, gravity drop, drag, swept collision, whiz, decals)
    const segDir = new THREE.Vector3();
    const nextPos = new THREE.Vector3();
    const closestPt = new THREE.Vector3();
    const lineSeg = new THREE.Line3();

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.vel.y -= 9.81 * b.gravityScale * dt;
      b.vel.multiplyScalar(Math.max(0, 1 - 0.14 * dt));
      nextPos.copy(b.pos).addScaledVector(b.vel, dt);

      segDir.copy(nextPos).sub(b.pos);
      const stepDist = segDir.length();
      if (stepDist < 0.0001) {
        this.removeBulletAt(i);
        continue;
      }
      segDir.divideScalar(stepDist);

      this.raycaster.set(b.pos, segDir);
      this.raycaster.far = stepDist;

      const worldHits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
      const worldDist = worldHits.length > 0 ? worldHits[0].distance : stepDist + 1;

      let hitActor: CombatantActor | null = null;
      let hitPoint = new THREE.Vector3();
      let hitHead = false;
      let hitDist = worldDist;

      // Collect opposing rig meshes
      const enemyMeshes: THREE.Object3D[] = [];
      for (const actor of this.actors) {
        if (!actor.alive || actor.team === b.team) continue;
        if (actor.isPlayer) {
          const pCenter = _vecC.set(actor.position.x, actor.position.y + 1.12, actor.position.z);
          lineSeg.set(b.pos, nextPos);
          lineSeg.closestPointToPoint(pCenter, true, closestPt);
          const dSq = closestPt.distanceToSquared(pCenter);
          if (dSq < 0.34) {
            const dFromOrigin = b.pos.distanceTo(closestPt);
            if (dFromOrigin < hitDist) {
              hitDist = dFromOrigin;
              hitActor = actor;
              hitPoint.copy(closestPt);
              hitHead = closestPt.y > actor.position.y + 1.48;
            }
          } else if (!b.whizzed && dSq < 4.8) {
            b.whizzed = true;
            soundEngine.playBulletWhiz();
          }
        } else if (actor.rig) {
          enemyMeshes.push(...actor.rig.hitMeshes);
        }
      }

      if (enemyMeshes.length > 0) {
        const actorHits = this.raycaster.intersectObjects(enemyMeshes, false);
        if (actorHits.length > 0 && actorHits[0].distance < hitDist) {
          const h = actorHits[0];
          const targetId = h.object.userData.combatantId as string;
          const found = this.actors.find((a) => a.id === targetId);
          if (found && found.alive) {
            hitDist = h.distance;
            hitActor = found;
            hitPoint.copy(h.point);
            hitHead = h.object.userData.hitbox === 'head';
          }
        }
      }

      if (hitActor) {
        const attacker = this.actors.find((a) => a.id === b.attackerId);
        let dmg = b.damage;
        if (hitHead) dmg = Math.round(dmg * b.headshotMult);
        if (b.traveled > b.maxRange * 0.55) {
          const t = (b.traveled - b.maxRange * 0.55) / (b.maxRange * 0.45);
          dmg = Math.max(4, Math.round(dmg * (1 - 0.4 * t)));
        }
        if (hitActor.isPlayer && !hitHead) {
          dmg = Math.round(dmg * 0.85);
        }

        const killed = attacker
          ? this.applyDamage(hitActor, attacker, dmg, hitHead, b.weaponShort)
          : false;
        this.spawnSparks(hitPoint, 0xef4444, 5);

        if (attacker?.isPlayer) {
          this.hitmarkerType = killed ? 'kill' : hitHead ? 'head' : 'body';
          this.hitmarkerTime = performance.now();
          if (killed) {
            this.lastEliminatedName = hitActor.name;
            this.lastEliminatedHeadshot = hitHead;
          }
          soundEngine.playHitmarker(hitHead || killed, killed);
        }

        this.removeBulletAt(i);
        continue;
      }

      if (worldHits.length > 0) {
        this.spawnSparks(worldHits[0].point, 0xfbbf24, 3);
        this.spawnSmokePuff(
          worldHits[0].point,
          new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.7, (Math.random() - 0.5) * 0.5),
          0.42,
          0.14,
          0.45
        );
        this.spawnBulletHoleDecal(worldHits[0]);
        this.removeBulletAt(i);
        continue;
      }

      b.pos.copy(nextPos);
      b.traveled += stepDist;
      b.visualPos.lerp(b.pos, Math.min(1, dt * 32));
      b.mesh.position.copy(b.visualPos);
      b.mesh.lookAt(b.visualPos.clone().add(b.vel));

      if (b.traveled >= b.maxRange || b.pos.y < -4) {
        this.removeBulletAt(i);
      }
    }

    // 3. Simulate RPG-7 Rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.life -= dt;
      r.vel.y -= 9.81 * 0.25 * dt;
      nextPos.copy(r.pos).addScaledVector(r.vel, dt);

      segDir.copy(nextPos).sub(r.pos);
      const stepDist = segDir.length();
      segDir.divideScalar(Math.max(0.0001, stepDist));

      this.raycaster.set(r.pos, segDir);
      this.raycaster.far = stepDist;

      let impacted = false;
      let impactPoint = nextPos.clone();

      const worldHits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
      if (worldHits.length > 0) {
        impacted = true;
        impactPoint.copy(worldHits[0].point);
      } else {
        for (const actor of this.actors) {
          if (!actor.alive || actor.id === r.attackerId) continue;
          const aCenter = _vecC.set(actor.position.x, actor.position.y + 1.1, actor.position.z);
          lineSeg.set(r.pos, nextPos);
          lineSeg.closestPointToPoint(aCenter, true, closestPt);
          if (closestPt.distanceToSquared(aCenter) < 0.72) {
            impacted = true;
            impactPoint.copy(closestPt);
            break;
          }
        }
      }

      if (impacted || r.life <= 0) {
        const attacker = this.actors.find((a) => a.id === r.attackerId);
        this.triggerExplosion(impactPoint, 6.8, 160, attacker, 'RPG-7');
        this.removeRocketAt(i);
        continue;
      }

      r.pos.copy(nextPos);
      r.mesh.position.copy(r.pos);
      r.mesh.lookAt(r.pos.clone().add(r.vel));

      r.smokeAccum += dt;
      if (r.smokeAccum >= 0.032) {
        r.smokeAccum = 0;
        this.spawnSmokePuff(
          r.pos.clone(),
          new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.65, (Math.random() - 0.5) * 0.6),
          0.65,
          0.22,
          0.95
        );
      }
    }

    // 4. Simulate Frag Grenades (gravity, bounce physics, fuse countdown, detonation)
    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.fuse -= dt;
      g.vel.y -= 21 * dt;
      nextPos.copy(g.pos).addScaledVector(g.vel, dt);

      segDir.copy(nextPos).sub(g.pos);
      const stepDist = segDir.length();
      if (stepDist > 0.0005) {
        segDir.divideScalar(stepDist);
        this.raycaster.set(g.pos, segDir);
        this.raycaster.far = stepDist + 0.09;
        const hits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
        const hit = hits[0];
        const hitFace = hit?.face;
        if (hit && hitFace) {
          const normal = hitFace.normal
            .clone()
            .applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld))
            .normalize();
          const speed = g.vel.length();
          if (speed > 1.8) {
            const distP = g.pos.distanceTo(this.player.position);
            soundEngine.playGrenadeBounce(THREE.MathUtils.clamp(1 - distP / 28, 0.1, 0.7));
          }
          g.pos.copy(hit.point).addScaledVector(normal, 0.1);
          g.vel.reflect(normal).multiplyScalar(0.45);
          if (Math.abs(g.vel.y) < 0.7 && normal.y > 0.7) {
            g.vel.y = 0;
            g.vel.x *= 0.78;
            g.vel.z *= 0.78;
          }
        } else {
          g.pos.copy(nextPos);
        }
      }

      const floorY = groundHeightAt(g.pos.x, g.pos.z, g.pos.y + 0.25, this.arena);
      if (g.pos.y < floorY + 0.09) {
        g.pos.y = floorY + 0.09;
        if (Math.abs(g.vel.y) > 1.4) {
          const distP = g.pos.distanceTo(this.player.position);
          soundEngine.playGrenadeBounce(THREE.MathUtils.clamp(1 - distP / 28, 0.1, 0.6));
          g.vel.y = -g.vel.y * 0.42;
        } else {
          g.vel.y = 0;
        }
        g.vel.x *= 0.82;
        g.vel.z *= 0.82;
      }

      g.mesh.position.copy(g.pos);
      const speedSq = g.vel.lengthSq();
      if (speedSq > 0.15) {
        g.mesh.rotation.x += g.rotVel.x * dt;
        g.mesh.rotation.y += g.rotVel.y * dt;
        g.mesh.rotation.z += g.rotVel.z * dt;
      }
      g.ledMat.color.setHex(Math.sin(g.fuse * 26) > 0 ? 0xff2222 : 0x450a0a);

      g.smokeAccum += dt;
      if (g.smokeAccum >= 0.08) {
        g.smokeAccum = 0;
        this.spawnSmokePuff(g.pos.clone(), new THREE.Vector3(0, 0.6, 0), 0.35, 0.1, 0.35);
      }

      if (g.fuse <= 0) {
        const attacker = this.actors.find((a) => a.id === g.attackerId);
        this.triggerExplosion(g.pos, 6.2, 135, attacker, 'M67 Frag');
        this.removeGrenadeAt(i);
      }
    }

    // 5. Explosion Waves & Fireballs
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.life -= dt;
      if (ex.life <= 0) {
        this.scene.remove(ex.fireball);
        this.scene.remove(ex.ring);
        (ex.fireball.material as THREE.Material).dispose();
        (ex.ring.material as THREE.Material).dispose();
        this.explosions.splice(i, 1);
      } else {
        const p = 1 - ex.life / ex.maxLife;
        ex.fireball.scale.setScalar(0.35 + p * ex.radius * 0.55);
        (ex.fireball.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.88;
        ex.ring.scale.setScalar(0.5 + p * ex.radius * 1.15);
        (ex.ring.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.72;
      }
    }

    // 6. Smoke Puffs
    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const s = this.smokePuffs[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        (s.mesh.material as THREE.Material).dispose();
        this.smokePuffs.splice(i, 1);
      } else {
        const p = 1 - s.life / s.maxLife;
        s.mesh.position.addScaledVector(s.vel, dt);
        s.mesh.scale.setScalar(THREE.MathUtils.lerp(s.startScale, s.endScale, p));
        (s.mesh.material as THREE.MeshStandardMaterial).opacity = (1 - p) * 0.52;
      }
    }

    // 7. Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life -= dt;
      if (sp.life <= 0) {
        this.scene.remove(sp.mesh);
        (sp.mesh.material as THREE.Material).dispose();
        this.sparks.splice(i, 1);
      } else {
        sp.vel.y -= 15 * dt;
        sp.mesh.position.addScaledVector(sp.vel, dt);
        (sp.mesh.material as THREE.MeshBasicMaterial).opacity = sp.life / sp.maxLife;
      }
    }

    // 8. Ejected Brass Shell Casings
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const sh = this.shells[i];
      sh.life -= dt;
      if (sh.life <= 0) {
        this.scene.remove(sh.mesh);
        this.shells.splice(i, 1);
      } else {
        sh.vel.y -= 14 * dt;
        sh.mesh.position.addScaledVector(sh.vel, dt);
        sh.mesh.rotation.x += sh.rotVel.x * dt;
        sh.mesh.rotation.y += sh.rotVel.y * dt;
        sh.mesh.rotation.z += sh.rotVel.z * dt;
      }
    }
  }

  private tick = () => {
    if (this.disposed) return;

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.phase === 'lobby' || this.phase === 'ended') {
      this.lobbyOrbitAngle += dt * 0.14;
      const radius = 34;
      this.camera.position.set(
        Math.cos(this.lobbyOrbitAngle) * radius,
        15,
        Math.sin(this.lobbyOrbitAngle) * radius
      );
      this.camera.lookAt(0, 1.5, 0);
      if (this.camera.fov !== 62) {
        this.camera.fov = 62;
        this.camera.updateProjectionMatrix();
      }
      this.updatePickups(dt);
      this.updateEffects(dt);
    } else if (this.phase === 'playing') {
      this.timeRemaining = Math.max(0, this.timeRemaining - dt);
      if (this.timeRemaining <= 0) {
        this.endMatch();
      } else {
        this.updatePlayer(dt);
        this.updateBots(dt);
        this.updatePickups(dt);
        this.updateEffects(dt);
      }
    }

    this.damageIndicators = this.damageIndicators.filter((d) => d.expiresAt > now);
    if (this.hitmarkerType !== 'none' && now - this.hitmarkerTime > 260) {
      this.hitmarkerType = 'none';
    }

    this.renderer.render(this.scene, this.camera);

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.05) {
      this.hudEmitAccum = 0;
      this.emitHud();
    }

    this.scheduleNextFrame();
  };

  private scheduleNextFrame() {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (sync && state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private emitHud() {
    const spec = WEAPONS[this.activeWeapon];
    const horizSpeed = this.player ? Math.hypot(this.player.velocity.x, this.player.velocity.z) : 0;
    const spreadRad =
      (this.isAds ? spec.adsSpread : spec.baseSpread) +
      THREE.MathUtils.clamp(horizSpeed / 8, 0, 1) * spec.moveSpreadPenalty +
      this.recoilOffsetPitch * 0.45;

    const radarBlips: RadarBlip[] = [];
    for (const actor of this.actors) {
      if (actor.isPlayer || !actor.alive) continue;
      radarBlips.push({
        x: actor.position.x,
        z: actor.position.z,
        team: actor.team,
        alive: actor.alive,
      });
    }
    for (const pk of this.arena.pickups) {
      if (!pk.active) continue;
      radarBlips.push({
        x: pk.position.x,
        z: pk.position.z,
        team: pk.type === 'health' ? 'pickup_health' : 'pickup_ammo',
      });
    }
    for (const mg of this.arena.mountedMgs) {
      radarBlips.push({
        x: mg.position.x,
        z: mg.position.z,
        team: 'turret',
      });
    }

    const scoreboard: ScoreboardEntry[] = this.actors
      .map((a) => ({
        id: a.id,
        name: a.name,
        team: a.team,
        isPlayer: a.isPlayer,
        weaponId: a.weaponId,
        kills: a.kills,
        deaths: a.deaths,
        assists: a.assists,
        alive: a.alive,
      }))
      .sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);

    this.onHudUpdate({
      phase: this.phase,
      blueScore: this.blueScore,
      redScore: this.redScore,
      scoreLimit: this.config.scoreLimit,
      timeRemaining: this.timeRemaining,
      health: this.player?.health ?? 100,
      maxHealth: this.player?.maxHealth ?? 100,
      stamina: this.stamina,
      isAlive: this.player?.alive ?? true,
      respawnTimer: Math.max(0, this.player?.respawnTimer ?? 0),
      activeWeapon: this.activeWeapon,
      weapons: {
        m4a1: { ...this.weaponStates.m4a1 },
        ak74: { ...this.weaponStates.ak74 },
        mp5: { ...this.weaponStates.mp5 },
        m870: { ...this.weaponStates.m870 },
        mk14: { ...this.weaponStates.mk14 },
        m24: { ...this.weaponStates.m24 },
        rpg7: { ...this.weaponStates.rpg7 },
      },
      isReloading: this.isReloading,
      reloadProgress: this.isReloading
        ? 1 - this.reloadTimer / WEAPONS[this.activeWeapon].reloadTime
        : 0,
      isAds: this.isAds,
      scopeZoom:
        this.activeWeapon === 'm24'
          ? this.scopeZoomLevel === 2
            ? 8
            : 4
          : this.activeWeapon === 'mk14'
          ? this.scopeZoomLevel === 2
            ? 3.5
            : 2
          : this.activeWeapon === 'rpg7'
          ? 2.7
          : 1.4,
      crosshairSpread: Math.round(
        THREE.MathUtils.clamp((this.activeMountedMg ? 0.009 : spreadRad) * 780, 4, 58)
      ),
      hitmarkerType: this.hitmarkerType,
      hitmarkerTime: this.hitmarkerTime,
      lastEliminatedName: this.lastEliminatedName,
      lastEliminatedHeadshot: this.lastEliminatedHeadshot,
      playerPos: {
        x: this.player?.position.x ?? 0,
        z: this.player?.position.z ?? 0,
        yaw: this.player?.yaw ?? 0,
      },
      radarBlips,
      killFeed: [...this.killFeed],
      scoreboard,
      damageIndicators: [...this.damageIndicators],
      winner: this.winner,
      pointerLocked: this.pointerLocked,
      pickupNotice: this.pickupNotice,
      arenaHalfSize: this.arena.halfSize,
      grenades: this.grenades,
      maxGrenades: this.maxGrenades,
      isCookingGrenade: this.isCookingGrenade,
      grenadeCookProgress: this.isCookingGrenade ? 1 - Math.max(0, this.grenadeCookTimer) / 2.8 : 0,
      mountedMg: {
        active: this.activeMountedMg !== null,
        heat: this.activeMountedMg ? this.activeMountedMg.heat : 0,
        overheated: this.activeMountedMg ? this.activeMountedMg.overheated : false,
        nearPrompt: this.nearMountedMg !== null && this.activeMountedMg === null,
      },
    });
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);

    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock();
    }

    this.clearDynamicEffects();
    for (const g of this.arena.disposables.geometries) g.dispose();
    for (const m of this.arena.disposables.materials) m.dispose();
    for (const t of this.arena.disposables.textures) t.dispose();
    this.sparkGeo.dispose();
    this.bulletCoreGeo.dispose();
    this.tracerTailGeo.dispose();
    this.smokeGeo.dispose();
    this.fireballGeo.dispose();
    this.shockRingGeo.dispose();
    this.holeGeo.dispose();
    this.shellGeo.dispose();
    this.bulletHoleTex.dispose();
    this.blastGlowTex.dispose();
    this.bulletHoleMat.dispose();
    this.brassMat.dispose();
    this.oliveGrenadeMat.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
