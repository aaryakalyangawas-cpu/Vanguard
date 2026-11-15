export type TeamId = 'blue' | 'red';

export type WeaponId = 'm4a1' | 'ak74' | 'mp5' | 'm870' | 'mk14' | 'm24' | 'rpg7';

export type MapId = 'yard' | 'outpost' | 'bunker';

export interface MapInfo {
  id: MapId;
  name: string;
  environment: string;
  sizeLabel: string;
  description: string;
}

export type Difficulty = 'recruit' | 'tactical' | 'veteran';

export type GamePhase = 'lobby' | 'playing' | 'paused' | 'ended';

export interface WeaponSpec {
  id: WeaponId;
  slot: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  shortName: string;
  caliber: string;
  role: string;
  fireMode: 'AUTO' | 'PUMP' | 'SEMI' | 'BOLT' | 'ROCKET';
  damage: number;
  headshotMult: number;
  pellets: number;
  rpm: number;
  magSize: number;
  reserveMax: number;
  reloadTime: number; // seconds
  baseSpread: number; // radians
  adsSpread: number;
  moveSpreadPenalty: number;
  recoilPitch: number;
  recoilYaw: number;
  adsFov: number;
  moveSpeedMult: number;
  range: number;
  muzzleVelocity: number; // m/s
  gravityScale: number;
  tracerColor: number;
  accentHex: string;
}

export interface WeaponRuntimeState {
  id: WeaponId;
  mag: number;
  reserve: number;
}

export type VehicleType = 'jeep' | 'tank';

export interface MatchConfig {
  mapId: MapId;
  teamSize: 4 | 6 | 10;
  scoreLimit: 25 | 50 | 75;
  difficulty: Difficulty;
  startingWeapon: WeaponId;
  sensitivity: number; // 0.3 to 2.5
  muted: boolean;
}

export interface ScoreboardEntry {
  id: string;
  name: string;
  team: TeamId;
  isPlayer: boolean;
  weaponId: WeaponId;
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
  team: TeamId | 'pickup_health' | 'pickup_ammo' | 'turret' | 'vehicle';
  alive?: boolean;
}

export interface HudSnapshot {
  phase: GamePhase;
  blueScore: number;
  redScore: number;
  scoreLimit: number;
  timeRemaining: number;
  health: number;
  maxHealth: number;
  stamina: number;
  isAlive: boolean;
  respawnTimer: number;
  activeWeapon: WeaponId;
  weapons: Record<WeaponId, WeaponRuntimeState>;
  isReloading: boolean;
  reloadProgress: number;
  isAds: boolean;
  scopeZoom: number;
  crosshairSpread: number;
  hitmarkerType: 'none' | 'body' | 'head' | 'kill';
  hitmarkerTime: number;
  lastEliminatedName: string | null;
  lastEliminatedHeadshot: boolean;
  playerPos: { x: number; z: number; yaw: number };
  radarBlips: RadarBlip[];
  killFeed: KillFeedItem[];
  scoreboard: ScoreboardEntry[];
  damageIndicators: DamageDirectionIndicator[];
  winner: TeamId | 'draw' | null;
  pointerLocked: boolean;
  pickupNotice: string | null;
  arenaHalfSize: number;
  grenades: number;
  maxGrenades: number;
  isCookingGrenade: boolean;
  grenadeCookProgress: number;
  mountedMg: {
    active: boolean;
    heat: number;
    overheated: boolean;
    nearPrompt: boolean;
  };
  vehicle: {
    active: boolean;
    type: VehicleType | null;
    name: string;
    health: number;
    maxHealth: number;
    speedKmh: number;
    weaponCooldownPct: number;
    nearPromptName: string | null;
  };
}
