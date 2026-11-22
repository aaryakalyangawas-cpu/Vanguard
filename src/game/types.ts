export type TeamId = 'blue' | 'red';

export type WeaponCategory =
  | 'assault'
  | 'smg'
  | 'lmg'
  | 'shotgun'
  | 'dmr'
  | 'sniper'
  | 'pistol'
  | 'launcher';

export type WeaponChassis =
  | 'ar_nato'
  | 'ar_ak'
  | 'bullpup'
  | 'smg_mp5'
  | 'smg_pdw'
  | 'lmg_belt'
  | 'shotgun_pump'
  | 'shotgun_auto'
  | 'dmr'
  | 'sniper_bolt'
  | 'sniper_heavy'
  | 'pistol'
  | 'launcher_rpg'
  | 'launcher_guided';

export type OpticType = 'iron' | 'holo' | 'reflex' | 'acog' | 'sniper' | 'pgo' | 'thermal_lock';

export type GuidanceMode = 'none' | 'lock_on' | 'laser_guided';

export type WeaponId =
  // Assault Rifles (10)
  | 'm4a1'
  | 'ak74'
  | 'scar_l'
  | 'hk416'
  | 'aug_a3'
  | 'famas_f1'
  | 'galil_ace'
  | 'akm'
  | 'g36c'
  | 'sig_mcx'
  // SMGs & PDWs (7)
  | 'mp5'
  | 'p90'
  | 'ump45'
  | 'vector45'
  | 'mp7'
  | 'pp19_bizon'
  | 'thompson_m1'
  // LMGs (6)
  | 'm249_saw'
  | 'pkm'
  | 'mk48'
  | 'rpk74'
  | 'mg42'
  | 'negev'
  // Shotguns (5)
  | 'm870'
  | 'benelli_m4'
  | 'spas12'
  | 'aa12'
  | 'saiga12'
  // DMRs & Battle Rifles (6)
  | 'mk14'
  | 'scar_h'
  | 'svd_dragunov'
  | 'sr25'
  | 'fal_osw'
  | 'vss_vintorez'
  // Sniper Rifles (6)
  | 'm24'
  | 'awm'
  | 'm82_barrett'
  | 'cheytac_m200'
  | 'kar98k'
  | 'dsr50'
  // Pistols & Machine Pistols (5)
  | 'm9_beretta'
  | 'glock19'
  | 'deagle50'
  | 'usp45'
  | 'tec9_auto'
  // Launchers & Guided Missiles (5)
  | 'rpg7'
  | 'at4_cs'
  | 'fgm148_javelin'
  | 'bgm71_sraw'
  | 'fim92_stinger';

export type MapId =
  | 'yard'
  | 'outpost'
  | 'bunker'
  | 'island'
  | 'killhouse'
  | 'metro'
  | 'rooftop';

export type MatchMode = 'tdm' | 'ffa' | 'gun_game';

export interface ArenaZoneInfo {
  id: 'A' | 'B' | 'C';
  name: string;
  centerX: number;
  centerZ: number;
  radius: number;
  accentHex: string;
}

export interface MapInfo {
  id: MapId;
  name: string;
  environment: string;
  sizeLabel: string;
  description: string;
  zones: [string, string, string];
  infantryOnly?: boolean;
}

export type Difficulty = 'recruit' | 'tactical' | 'veteran';

export type GamePhase = 'lobby' | 'playing' | 'paused' | 'ended';

export interface WeaponSpec {
  id: WeaponId;
  category: WeaponCategory;
  slotGroup: 0 | 1 | 2; // 0 Primary, 1 Secondary, 2 Heavy/Launcher
  chassis: WeaponChassis;
  optic: OpticType;
  guidance: GuidanceMode;
  suppressed?: boolean;
  magStyle?: 'box' | 'curved' | 'drum' | 'pistol' | 'none';
  barrelScale?: number;
  finishHex?: number;
  furnitureHex?: number;
  name: string;
  shortName: string;
  caliber: string;
  role: string;
  fireMode: 'AUTO' | 'PUMP' | 'SEMI' | 'BOLT' | 'ROCKET' | 'GUIDED';
  damage: number;
  headshotMult: number;
  pellets: number;
  rpm: number;
  magSize: number;
  reserveMax: number;
  reloadTime: number;
  baseSpread: number;
  adsSpread: number;
  moveSpreadPenalty: number;
  recoilPitch: number;
  recoilYaw: number;
  adsFov: number;
  moveSpeedMult: number;
  range: number;
  muzzleVelocity: number;
  gravityScale: number;
  tracerColor: number;
  accentHex: string;
  blastRadius?: number;
}

export interface WeaponRuntimeState {
  id: WeaponId;
  mag: number;
  reserve: number;
}

export type LoadoutSlots = [WeaponId, WeaponId, WeaponId]; // [Primary, Secondary, Heavy]

export type VehicleType = 'jeep' | 'buggy' | 'apc' | 'tank' | 'heavy_tank' | 'attack_heli';

export type TurretKind = 'mg30' | 'hmg' | 'autocannon' | 'tow' | 'field_gun';

export type GameModeType = 'solo' | 'multiplayer';

export interface PlayerAccount {
  id: string;
  username: string;
  email?: string;
  isGuest: boolean;
  kills: number;
  deaths: number;
  matches: number;
}

export interface MultiplayerRoomSummary {
  roomId: string;
  mapId: MapId;
  matchMode: MatchMode;
  teamSize: number;
  scoreLimit: 25 | 50 | 75;
  botFill: boolean;
  humanCount: number;
  maxHumans: number;
  blueScore: number;
  redScore: number;
}

export type TouchControlsMode = 'auto' | 'on' | 'off';

export interface MatchConfig {
  mapId: MapId;
  matchMode: MatchMode;
  teamSize: 4 | 5 | 6 | 10;
  scoreLimit: 25 | 50 | 75;
  difficulty: Difficulty;
  startingWeapon: WeaponId;
  startingSecondary: WeaponId;
  startingHeavy: WeaponId;
  sensitivity: number;
  muted: boolean;
  username: string;
  playerTeam: TeamId;
  mode: GameModeType;
  roomId: string;
  botFill: boolean;
  touchControls: TouchControlsMode;
}

export interface ScoreboardEntry {
  id: string;
  name: string;
  team: TeamId;
  isPlayer: boolean;
  isHuman?: boolean;
  weaponId: WeaponId;
  gunGameTier?: number;
  kills: number;
  deaths: number;
  assists: number;
  alive: boolean;
}

export interface KillFeedItem {
  id: number;
  killerName: string;
  killerTeam: TeamId;
  victimName: string;
  victimTeam: TeamId;
  weaponShort: string;
  isHeadshot: boolean;
  timestamp: number;
}

export interface DamageDirectionIndicator {
  id: number;
  angleRad: number;
  intensity: number;
  expiresAt: number;
}

export interface RadarBlip {
  x: number;
  z: number;
  team:
    | TeamId
    | 'pickup_health'
    | 'pickup_ammo'
    | 'turret'
    | 'field_gun'
    | 'vehicle'
    | 'heli'
    | 'arsenal'
    | 'hangar'
    | 'airstrike'
    | 'trench'
    | 'belt_box';
  alive?: boolean;
  zoneId?: 'A' | 'B' | 'C';
  label?: string;
}

export interface LockOnHudState {
  capable: boolean;
  mode: GuidanceMode;
  locking: boolean;
  locked: boolean;
  progress: number;
  targetName: string | null;
}

export interface KillStreakHudState {
  current: number;
  best: number;
  uavActiveTimer: number;
  airstrikeCharges: number;
  recentBanner: string | null;
}

export interface GunGameHudState {
  tier: number;
  totalTiers: number;
  currentWeaponId: WeaponId;
  nextWeaponId: WeaponId | null;
  leaderName: string;
  leaderTier: number;
}

export interface HudSnapshot {
  phase: GamePhase;
  playerUsername: string;
  playerTeam: TeamId;
  mode: GameModeType;
  matchMode: MatchMode;
  infantryOnly: boolean;
  roomId: string;
  mpConnected: boolean;
  mpHumanCount: number;
  blueScore: number;
  redScore: number;
  scoreLimit: number;
  timeRemaining: number;
  health: number;
  maxHealth: number;
  stamina: number;
  isAlive: boolean;
  respawnTimer: number;
  activeSlot: 0 | 1 | 2;
  loadout: LoadoutSlots;
  activeWeapon: WeaponId;
  weaponStates: Record<WeaponId, WeaponRuntimeState>;
  isReloading: boolean;
  reloadProgress: number;
  isAds: boolean;
  isSteadyAim: boolean;
  scopeZoom: number;
  crosshairSpread: number;
  hitmarkerType: 'none' | 'body' | 'head' | 'kill';
  hitmarkerTime: number;
  lastEliminatedName: string | null;
  lastEliminatedHeadshot: boolean;
  playerPos: { x: number; z: number; yaw: number };
  currentZone: { id: 'A' | 'B' | 'C'; name: string } | null;
  zones: ArenaZoneInfo[];
  radarBlips: RadarBlip[];
  killFeed: KillFeedItem[];
  scoreboard: ScoreboardEntry[];
  damageIndicators: DamageDirectionIndicator[];
  winner: TeamId | 'draw' | null;
  winnerName: string | null;
  gunGame: GunGameHudState | null;
  pointerLocked: boolean;
  isTouchDevice: boolean;
  touchControlsActive: boolean;
  pickupNotice: string | null;
  arenaHalfSize: number;
  grenades: number;
  maxGrenades: number;
  isCookingGrenade: boolean;
  grenadeCookProgress: number;
  carriedBelts: number;
  maxCarriedBelts: number;
  trench: {
    count: number;
    maxCount: number;
    isDigging: boolean;
    progress: number;
  };
  arsenal: {
    nearPrompt: boolean;
    isOpen: boolean;
    arsenalName: string | null;
  };
  hangar: {
    nearPrompt: boolean;
    hangarName: string | null;
    canServiceVehicle: boolean;
  };
  lockOn: LockOnHudState;
  killStreak: KillStreakHudState;
  mountedMg: {
    active: boolean;
    kind: TurretKind | null;
    name: string;
    ammo: number;
    maxAmmo: number;
    isReloading: boolean;
    reloadProgress: number;
    nearbyBeltsCount: number;
    heat: number;
    overheated: boolean;
    cooldownPct: number;
    nearPromptName: string | null;
    nearDestroyedName: string | null;
    isRepairing: boolean;
    repairProgress: number;
  };
  vehicle: {
    active: boolean;
    type: VehicleType | null;
    name: string;
    health: number;
    maxHealth: number;
    speedKmh: number;
    weaponCooldownPct: number;
    ammo: number;
    maxAmmo: number;
    ammoLabel: string;
    secondaryAmmo: number;
    secondaryMaxAmmo: number;
    secondaryLabel: string;
    altitude: number;
    rotorPct: number;
    nearPromptName: string | null;
    nearFreeSeatIndex: number | null;
    seatIndex: number;
    maxSeats: number;
    seatRole: string;
    crew: Array<{ seat: number; role: string; occupantName: string | null; isPlayer: boolean }>;
  };
}
