import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Biohazard,
  Code2,
  Compass,
  Crosshair,
  Eye,
  Flame,
  Globe,
  Info,
  Layers,
  MapPin,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Smartphone,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  Wrench,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { GUN_GAME_LADDER } from '../game/FpsEngine';
import { MAP_ORDER, MAPS } from '../game/arena';
import { fetchActiveRooms } from '../game/multiplayer';
import {
  Difficulty,
  HudSnapshot,
  MapId,
  MatchConfig,
  MatchMode,
  MultiplayerRoomSummary,
  PlayerAccount,
  TeamId,
  TouchControlsMode,
  WeaponCategory,
  WeaponId,
} from '../game/types';
import { WEAPON_CATEGORIES, WEAPON_ORDER, WEAPONS } from '../game/weapons';
import { ScoreboardModal } from './ScoreboardModal';
import { WeaponArtwork } from './WeaponArtwork';

type LobbyCameraPreset = 'orbit' | 'overview' | 'zone_a' | 'zone_b' | 'zone_c' | 'arsenal';
type LobbyTabId = 'command' | 'arenas' | 'armory' | 'rooms' | 'about';

interface GameMenusProps {
  hud: HudSnapshot;
  config: MatchConfig;
  account: PlayerAccount | null;
  inspecting3D: boolean;
  onToggleInspect3D: () => void;
  onLobbyDrag: (dx: number, dy: number) => void;
  onLobbyZoom: (delta: number) => void;
  onLobbyPreset: (preset: LobbyCameraPreset) => void;
  onOpenAccount: () => void;
  onOpenAndroidApp: () => void;
  isAppInstalled?: boolean;
  onUpdateConfig: (next: Partial<MatchConfig>) => void;
  onStartMatch: () => void;
  onResumeMatch: () => void;
  onReturnToLobby: () => void;
}

const SLOT_CONFIGS: Array<{
  idx: 0 | 1 | 2;
  label: string;
  shortLabel: string;
  configKey: 'startingWeapon' | 'startingSecondary' | 'startingHeavy';
}> = [
  { idx: 0, label: 'Slot [1] Primary', shortLabel: 'Primary', configKey: 'startingWeapon' },
  { idx: 1, label: 'Slot [2] Secondary', shortLabel: 'Secondary', configKey: 'startingSecondary' },
  { idx: 2, label: 'Slot [3] Heavy', shortLabel: 'Heavy', configKey: 'startingHeavy' },
];

const MODE_CARDS: Array<{ id: MatchMode; title: string; badge: string; desc: string }> = [
  {
    id: 'tdm',
    title: 'Team Deathmatch',
    badge: 'SQUADS',
    desc: 'Vanguard vs Syndicate tactical squad combat',
  },
  {
    id: 'ffa',
    title: 'Free-For-All',
    badge: 'SOLO ALL',
    desc: 'Every operator is hostile · Distributed spawns',
  },
  {
    id: 'gun_game',
    title: 'Gun Game',
    badge: '18 TIERS',
    desc: 'Each elimination upgrades your weapon ladder tier',
  },
  {
    id: 'zombies',
    title: 'Zombie Survival',
    badge: 'CO-OP HORDE',
    desc: 'Hold out against endless waves of Walkers, Runners & Brutes',
  },
];

function formatMatchModeLabel(mode?: MatchMode): string {
  if (mode === 'ffa') return 'Free-For-All';
  if (mode === 'gun_game') return 'Gun Game';
  if (mode === 'zombies') return 'Zombie Survival';
  return 'TDM';
}

export const GameMenus: React.FC<GameMenusProps> = ({
  hud,
  config,
  account,
  inspecting3D,
  onToggleInspect3D,
  onLobbyDrag,
  onLobbyZoom,
  onLobbyPreset,
  onOpenAccount,
  onOpenAndroidApp,
  isAppInstalled,
  onUpdateConfig,
  onStartMatch,
  onResumeMatch,
  onReturnToLobby,
}) => {
  const [lobbyTab, setLobbyTab] = useState<LobbyTabId>('command');
  const [armoryView, setArmoryView] = useState<'loadout' | 'ladder'>('loadout');
  const [mapFilter, setMapFilter] = useState<'all' | 'infantry' | 'combined'>('all');
  const [cameraPreset, setCameraPreset] = useState<LobbyCameraPreset>('orbit');
  const [editingSlot, setEditingSlot] = useState<0 | 1 | 2>(0);
  const [weaponCategory, setWeaponCategory] = useState<WeaponCategory | 'all'>('all');
  const [weaponQuery, setWeaponQuery] = useState('');
  const [rooms, setRooms] = useState<MultiplayerRoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const dragPointerRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const refreshRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const list = await fetchActiveRooms();
      setRooms(list);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (hud.phase === 'lobby' && (lobbyTab === 'rooms' || config.mode === 'multiplayer')) {
      void refreshRooms();
    }
  }, [hud.phase, lobbyTab, config.mode, refreshRooms]);

  useEffect(() => {
    if (hud.phase !== 'lobby' || lobbyTab !== 'rooms') return;
    const timer = window.setInterval(() => {
      void refreshRooms();
    }, 4500);
    return () => window.clearInterval(timer);
  }, [hud.phase, lobbyTab, refreshRooms]);

  const filteredMaps = useMemo(() => {
    return MAP_ORDER.filter((id) => {
      const m = MAPS[id];
      if (mapFilter === 'infantry') return Boolean(m.infantryOnly);
      if (mapFilter === 'combined') return !m.infantryOnly;
      return true;
    });
  }, [mapFilter]);

  const filteredWeapons = useMemo(() => {
    const q = weaponQuery.trim().toLowerCase();
    return WEAPON_ORDER.filter((id) => {
      const spec = WEAPONS[id];
      if (weaponCategory !== 'all' && spec.category !== weaponCategory) return false;
      if (!q) return true;
      return (
        spec.name.toLowerCase().includes(q) ||
        spec.caliber.toLowerCase().includes(q) ||
        spec.role.toLowerCase().includes(q)
      );
    });
  }, [weaponCategory, weaponQuery]);

  const assignStartingWeapon = (wid: WeaponId) => {
    const target = SLOT_CONFIGS[editingSlot];
    onUpdateConfig({ [target.configKey]: wid });
  };

  const selectMap = (mid: MapId) => {
    const info = MAPS[mid];
    if (info.infantryOnly) {
      onUpdateConfig({ mapId: mid, teamSize: 5 });
    } else {
      onUpdateConfig({ mapId: mid });
    }
    setCameraPreset('orbit');
    onLobbyPreset('orbit');
  };

  const handleSelectPreset = (preset: LobbyCameraPreset) => {
    setCameraPreset(preset);
    onLobbyPreset(preset);
  };

  const handleSelectMatchMode = (mode: MatchMode) => {
    onUpdateConfig({
      matchMode: mode,
      playerTeam: mode === 'zombies' ? 'blue' : config.playerTeam,
    });
    if (mode === 'gun_game') {
      setArmoryView('ladder');
    } else if (armoryView === 'ladder') {
      setArmoryView('loadout');
    }
  };

  const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    dragPointerRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBackdropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragPointerRef.current || dragPointerRef.current.id !== e.pointerId) return;
    const dx = e.clientX - dragPointerRef.current.x;
    const dy = e.clientY - dragPointerRef.current.y;
    dragPointerRef.current.x = e.clientX;
    dragPointerRef.current.y = e.clientY;
    onLobbyDrag(dx, dy);
  };

  const handleBackdropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragPointerRef.current?.id === e.pointerId) {
      dragPointerRef.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const handleBackdropWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget || inspecting3D) {
      onLobbyZoom(e.deltaY);
    }
  };

  const carriedIds: [WeaponId, WeaponId, WeaponId] = [
    config.startingWeapon,
    config.startingSecondary,
    config.startingHeavy,
  ];
  const showcaseWeapon = WEAPONS[carriedIds[editingSlot]] || WEAPONS.m4a1;
  const activeMap = MAPS[config.mapId] || MAPS.yard;

  if (hud.phase === 'lobby') {
    if (inspecting3D) {
      return (
        <div
          className="fixed inset-0 z-20 cursor-grab active:cursor-grabbing select-none"
          onPointerDown={handleBackdropPointerDown}
          onPointerMove={handleBackdropPointerMove}
          onPointerUp={handleBackdropPointerUp}
          onPointerCancel={handleBackdropPointerUp}
          onWheel={handleBackdropWheel}
        >
          {/* Top-left Map Readout */}
          <div className="absolute top-4 left-4 pointer-events-auto rounded-lg bg-[#0b1019]/92 border border-slate-700/85 px-4 py-2.5 shadow-xl max-w-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-base font-bold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                {activeMap.name}
              </span>
              <span className="font-mono text-[11px] text-amber-300">{activeMap.sizeLabel}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Drag anywhere to orbit 3D arena · Scroll wheel to zoom
            </div>
          </div>

          {/* Bottom Interactive Camera Controls Dock */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[94vw] max-w-4xl pointer-events-auto rounded-xl bg-[#0d121c]/95 border border-slate-700/85 p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'orbit', label: 'Auto Orbit' },
                  { id: 'overview', label: 'Overview' },
                  { id: 'zone_a', label: 'Zone A' },
                  { id: 'zone_b', label: 'Zone B' },
                  { id: 'zone_c', label: 'Zone C' },
                  { id: 'arsenal', label: 'Arsenal' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    cameraPreset === p.id
                      ? 'bg-amber-500 border-amber-400 text-slate-950 font-semibold'
                      : 'bg-[#121824] border-slate-700 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onLobbyZoom(-220)}
                className="px-2.5 py-1.5 rounded-md bg-[#121824] border border-slate-700 hover:border-slate-500 text-slate-200 cursor-pointer"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onLobbyZoom(220)}
                className="px-2.5 py-1.5 rounded-md bg-[#121824] border border-slate-700 hover:border-slate-500 text-slate-200 cursor-pointer"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onToggleInspect3D}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-semibold cursor-pointer"
              >
                Back to Lobby
              </button>
              <button
                type="button"
                onClick={onStartMatch}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Deploy
              </button>
            </div>
          </div>
        </div>
      );
    }

    const navTabs: Array<{ id: LobbyTabId; label: string; icon: React.ReactNode }> = [
      { id: 'command', label: 'Command', icon: <Crosshair className="w-3.5 h-3.5" /> },
      { id: 'arenas', label: `Arenas (${MAP_ORDER.length})`, icon: <MapPin className="w-3.5 h-3.5" /> },
      { id: 'armory', label: `Armory (${WEAPON_ORDER.length})`, icon: <Wrench className="w-3.5 h-3.5" /> },
      { id: 'rooms', label: 'Multiplayer', icon: <Globe className="w-3.5 h-3.5" /> },
      { id: 'about', label: 'About', icon: <Info className="w-3.5 h-3.5" /> },
    ];

    return (
      <div
        className="fixed inset-0 z-20 flex items-start justify-center p-2.5 sm:p-5 bg-[#070a10]/48 overflow-y-auto touch-pan-y"
        onPointerDown={handleBackdropPointerDown}
        onPointerMove={handleBackdropPointerMove}
        onPointerUp={handleBackdropPointerUp}
        onPointerCancel={handleBackdropPointerUp}
        onWheel={handleBackdropWheel}
      >
        <div className="my-auto w-full max-w-6xl rounded-xl bg-[#0d121c]/94 border border-slate-700/85 shadow-2xl overflow-hidden">
          {/* Clean 3-Zone Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5 bg-[#090d15] border-b border-slate-800/90">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Vanguard Arena
                  </h1>
                  <span className="hidden md:inline font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#141c2b] border border-slate-700 text-amber-300 whitespace-nowrap">
                    {formatMatchModeLabel(config.matchMode).toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Drag outside panel to orbit 3D arena · {activeMap.name} ({activeMap.sizeLabel})
                </p>
              </div>
            </div>

            {/* Center Nav Tabs */}
            <nav className="flex flex-wrap items-center rounded-lg bg-[#121824] border border-slate-800 p-1 gap-0.5">
              {navTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLobbyTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    lobbyTab === t.id
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Right Utility Controls & Primary CTA */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenAccount}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#121824] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-white max-w-[96px] truncate">{config.username}</span>
                <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                  {account && !account.isGuest ? 'Account' : 'Guest'}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenAndroidApp}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#121824] hover:bg-slate-800 border border-emerald-500/45 text-emerald-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Install on Android or Download Android Studio APK Project"
              >
                <Smartphone className="w-3.5 h-3.5" />
                {isAppInstalled ? 'Android Installed' : 'Android App'}
              </button>

              <button
                type="button"
                onClick={onToggleInspect3D}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#121824] hover:bg-slate-800 border border-cyan-500/45 text-cyan-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                Inspect 3D
              </button>

              <button
                type="button"
                onClick={() => onUpdateConfig({ muted: !config.muted })}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0 cursor-pointer"
                aria-label={config.muted ? 'Unmute Audio' : 'Mute Audio'}
                title={config.muted ? 'Muted (Click to Unmute)' : 'Audio On'}
              >
                {config.muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={onStartMatch}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 shadow-lg cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {config.mode === 'multiplayer' ? 'Join Match' : 'Deploy'}
              </button>
            </div>
          </div>

          {/* Tab Body */}
          <div className="p-4 sm:p-5">
            {lobbyTab === 'command' && (
              <div className="space-y-4">
                {/* Combat Mode Cards (4-Up) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {MODE_CARDS.map((mc) => {
                    const active = config.matchMode === mc.id;
                    const isZombieCard = mc.id === 'zombies';
                    return (
                      <button
                        key={mc.id}
                        type="button"
                        onClick={() => handleSelectMatchMode(mc.id)}
                        className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? isZombieCard
                              ? 'bg-lime-500/15 border-lime-400 text-white'
                              : 'bg-amber-500/15 border-amber-400 text-white'
                            : 'bg-[#121824] border-slate-800 hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                            {isZombieCard ? (
                              <Biohazard className={`w-4 h-4 shrink-0 ${active ? 'text-lime-400' : 'text-slate-500'}`} />
                            ) : (
                              <Award className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                            )}
                            {mc.title}
                          </span>
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#0a0f18] border whitespace-nowrap shrink-0 ${
                              isZombieCard
                                ? 'border-lime-500/40 text-lime-300'
                                : 'border-slate-700 text-amber-300'
                            }`}
                          >
                            {mc.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{mc.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Main Launchpad Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left 7 Cols: Active Arena Spotlight + Equipped Loadout Preview */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Active Arena Spotlight */}
                    <div className="rounded-lg bg-[#121824] border border-slate-800 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                              Active Arena
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                activeMap.infantryOnly
                                  ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                                  : 'bg-slate-900 border border-slate-700 text-slate-300'
                              }`}
                            >
                              {activeMap.infantryOnly ? '5v5 INFANTRY CQB' : 'COMBINED ARMS'}
                            </span>
                          </div>
                          <h2 className="font-display text-lg font-bold text-white mt-0.5">
                            {activeMap.name}{' '}
                            <span className="font-mono text-xs font-normal text-slate-400">
                              {activeMap.sizeLabel} · {activeMap.environment}
                            </span>
                          </h2>
                        </div>

                        <button
                          type="button"
                          onClick={() => setLobbyTab('arenas')}
                          className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Change Arena (7)
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{activeMap.description}</p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80">
                        <div className="flex flex-wrap gap-1.5">
                          {activeMap.zones.map((zn, idx) => (
                            <span
                              key={zn}
                              className="px-2 py-0.5 rounded bg-[#0a0f18] border border-slate-700/80 text-[10px] font-mono text-slate-300"
                            >
                              {['A', 'B', 'C'][idx]}: {zn}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          {(
                            [
                              { id: 'orbit', label: 'Orbit' },
                              { id: 'zone_a', label: 'Zone A' },
                              { id: 'zone_b', label: 'Zone B' },
                              { id: 'arsenal', label: 'Arsenal' },
                            ] as const
                          ).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPreset(p.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                                cameraPreset === p.id
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                                  : 'bg-[#0a0f18] border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Equipped Loadout Preview (or Gun Game Ladder Summary) */}
                    <div className="rounded-lg bg-[#121824] border border-slate-800 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                          <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                            {config.matchMode === 'gun_game' ? (
                              <>
                                <Layers className="w-4 h-4 text-amber-400" />
                                Gun Game 18-Tier Escalation Ladder
                              </>
                            ) : (
                              <>
                                <Wrench className="w-4 h-4 text-cyan-400" />
                                Equipped 3-Slot Combat Loadout
                              </>
                            )}
                          </h2>
                          <p className="text-[11px] text-slate-400">
                            {config.matchMode === 'gun_game'
                              ? 'Every elimination automatically upgrades you through 18 firearms'
                              : config.matchMode === 'zombies'
                              ? 'Carry high-capacity weapons or resupply ammo at base Arsenal [E] between waves'
                              : 'Click any slot to customize from 50 weapons · Swappable in-match at Arsenal [E]'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setArmoryView(config.matchMode === 'gun_game' ? 'ladder' : 'loadout');
                            setLobbyTab('armory');
                          }}
                          className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {config.matchMode === 'gun_game' ? 'View 18 Tiers' : 'Edit in Armory (50)'}
                        </button>
                      </div>

                      {config.matchMode === 'gun_game' ? (
                        <div className="grid grid-cols-3 gap-2.5">
                          {[0, 8, 17].map((tierIdx) => {
                            const w = WEAPONS[GUN_GAME_LADDER[tierIdx]];
                            return (
                              <div
                                key={tierIdx}
                                className="rounded-lg bg-[#0d121c] border border-slate-800 p-2.5"
                              >
                                <div className="text-[10px] font-mono font-bold text-amber-400">
                                  Tier {tierIdx + 1} {tierIdx === 0 ? '· Start' : tierIdx === 17 ? '· Final' : '· Mid'}
                                </div>
                                <div className="font-display text-xs font-bold text-white truncate mt-0.5">
                                  {w.name}
                                </div>
                                <div className="my-1.5 rounded bg-[#080c14] border border-slate-800/80 px-1.5 py-1">
                                  <WeaponArtwork weapon={w} className="w-full h-10" />
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {w.caliber} · {w.fireMode}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {SLOT_CONFIGS.map((slot) => {
                            const wid = carriedIds[slot.idx];
                            const w = WEAPONS[wid];
                            return (
                              <button
                                key={slot.idx}
                                type="button"
                                onClick={() => {
                                  setEditingSlot(slot.idx);
                                  setArmoryView('loadout');
                                  setLobbyTab('armory');
                                }}
                                className="text-left p-2.5 rounded-lg bg-[#0d121c] border border-slate-800 hover:border-cyan-400/70 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="font-bold text-amber-400">{slot.label}</span>
                                  <span className="text-slate-400">{w.magSize}/{w.reserveMax}</span>
                                </div>
                                <div className="font-display text-xs font-bold text-white truncate mt-0.5">
                                  {w.name}
                                </div>
                                <div className="my-1.5 rounded bg-[#080c14] border border-slate-800/80 px-1.5 py-1">
                                  <WeaponArtwork weapon={w} className="w-full h-11" />
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {w.caliber} · {w.rpm} RPM
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right 5 Cols: Session, Mode Parameters & Deploy */}
                  <div className="lg:col-span-5 rounded-lg bg-[#121824] border border-slate-800 p-4 flex flex-col justify-between gap-3.5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-base font-semibold text-white flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                          Deployment Setup
                        </h2>
                        <span className="font-mono text-[11px] text-slate-400">
                          {formatMatchModeLabel(config.matchMode)}
                        </span>
                      </div>

                      {/* Solo vs Online Multiplayer */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateConfig({ mode: 'solo' })}
                          className={`py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                            config.mode === 'solo'
                              ? 'bg-amber-500 border-amber-400 text-slate-950'
                              : 'bg-[#0d121c] border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {config.matchMode === 'zombies' ? 'Solo Survival' : 'Solo vs AI'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateConfig({ mode: 'multiplayer' })}
                          className={`py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                            config.mode === 'multiplayer'
                              ? 'bg-sky-500 border-sky-400 text-slate-950'
                              : 'bg-[#0d121c] border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {config.matchMode === 'zombies' ? 'Co-op Zombies' : 'Online Multiplayer'}
                        </button>
                      </div>

                      {config.mode === 'multiplayer' && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-[#0d121c] border border-slate-800">
                          <span className="text-[11px] text-slate-400 shrink-0">Room:</span>
                          <input
                            type="text"
                            maxLength={20}
                            value={config.roomId}
                            onChange={(e) =>
                              onUpdateConfig({
                                roomId: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') || 'alpha-1',
                              })
                            }
                            placeholder="Room ID"
                            className="flex-1 min-w-0 px-2 py-1 rounded bg-[#121824] border border-slate-700 text-xs font-mono text-white"
                          />
                          {config.matchMode !== 'zombies' && (
                            <button
                              type="button"
                              onClick={() => onUpdateConfig({ botFill: !config.botFill })}
                              className={`px-2 py-1 rounded text-[11px] font-mono border shrink-0 cursor-pointer ${
                                config.botFill
                                  ? 'bg-slate-800 border-emerald-500/50 text-emerald-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              {config.botFill ? 'Bots ON' : 'Humans'}
                            </button>
                          )}
                        </div>
                      )}

                      {config.matchMode === 'zombies' ? (
                        <div className="rounded-md bg-lime-950/25 border border-lime-500/40 p-2.5 text-xs space-y-1">
                          <div className="font-display font-bold text-lime-300 flex items-center gap-1.5">
                            <Biohazard className="w-3.5 h-3.5" />
                            Outbreak Survival Rules
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            3 Lives · Wave clearing restores +35 HP, ammo &amp; +1 Frag · Armored Brutes drop +30 HP &amp; magazines · Friendly fire OFF in Co-op
                          </p>
                        </div>
                      ) : (
                        <>
                          {config.matchMode === 'tdm' && (
                            <div>
                              <div className="text-[11px] text-slate-400 mb-1">Your Faction</div>
                              <div className="grid grid-cols-2 gap-2">
                                {(['blue', 'red'] as TeamId[]).map((tid) => (
                                  <button
                                    key={tid}
                                    type="button"
                                    onClick={() => onUpdateConfig({ playerTeam: tid })}
                                    className={`py-1.5 rounded-md text-xs font-semibold border cursor-pointer ${
                                      config.playerTeam === tid
                                        ? tid === 'blue'
                                          ? 'bg-blue-600 border-blue-400 text-white'
                                          : 'bg-red-600 border-red-400 text-white'
                                        : 'bg-[#0d121c] border-slate-700 text-slate-300'
                                    }`}
                                  >
                                    {tid === 'blue' ? 'Vanguard (Blue)' : 'Syndicate (Red)'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <div className="text-[11px] text-slate-400 mb-1">
                                {config.matchMode === 'tdm' ? 'Squad Size' : 'Combatants'}
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {([4, 5, 6, 10] as const).map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => onUpdateConfig({ teamSize: sz })}
                                    className={`py-1.5 rounded text-[11px] font-medium border cursor-pointer ${
                                      config.teamSize === sz
                                        ? 'bg-blue-600 border-blue-400 text-white'
                                        : 'bg-[#0d121c] border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    {config.matchMode === 'tdm' ? `${sz}v${sz}` : `${sz * 2}`}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {config.matchMode !== 'gun_game' && (
                              <div>
                                <div className="text-[11px] text-slate-400 mb-1">Kill Target</div>
                                <div className="grid grid-cols-3 gap-1">
                                  {([25, 50, 75] as const).map((lim) => (
                                    <button
                                      key={lim}
                                      type="button"
                                      onClick={() => onUpdateConfig({ scoreLimit: lim })}
                                      className={`py-1.5 rounded text-[11px] font-mono border tabular-nums cursor-pointer ${
                                        config.scoreLimit === lim
                                          ? 'bg-blue-600 border-blue-400 text-white'
                                          : 'bg-[#0d121c] border-slate-800 text-slate-300'
                                      }`}
                                    >
                                      {lim}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      <div>
                        <div className="text-[11px] text-slate-400 mb-1">
                          {config.matchMode === 'zombies' ? 'Horde Intensity' : 'Bot Difficulty'}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['recruit', 'tactical', 'veteran'] as Difficulty[]).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => onUpdateConfig({ difficulty: d })}
                              className={`py-1.5 rounded-md text-xs font-medium capitalize border transition-colors cursor-pointer ${
                                config.difficulty === d
                                  ? 'bg-blue-600 border-blue-400 text-white'
                                  : 'bg-[#0d121c] border-slate-800 text-slate-300 hover:border-slate-600'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Sensitivity</span>
                            <span className="font-mono text-slate-200 tabular-nums">
                              {config.sensitivity.toFixed(1)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0.3}
                            max={2.4}
                            step={0.1}
                            value={config.sensitivity}
                            onChange={(e) => onUpdateConfig({ sensitivity: parseFloat(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-400 mb-1">Touch Controls</div>
                          <div className="grid grid-cols-3 gap-1">
                            {(['auto', 'on', 'off'] as TouchControlsMode[]).map((tm) => (
                              <button
                                key={tm}
                                type="button"
                                onClick={() => onUpdateConfig({ touchControls: tm })}
                                className={`py-1 rounded text-[10px] font-medium uppercase border cursor-pointer ${
                                  config.touchControls === tm
                                    ? 'bg-cyan-600 border-cyan-400 text-white'
                                    : 'bg-[#0d121c] border-slate-800 text-slate-300'
                                }`}
                              >
                                {tm}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800/80 space-y-2.5">
                      <div className="text-[10px] font-mono text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                        <span>WASD Move</span>
                        <span>LMB Fire</span>
                        <span>RMB/F Scope</span>
                        <span>R Reload</span>
                        <span>E Interact</span>
                        <span>T Trench</span>
                        <span>X Strike</span>
                        <span>G Frag</span>
                      </div>

                      <button
                        type="button"
                        onClick={onStartMatch}
                        className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-colors shadow-lg cursor-pointer ${
                          config.matchMode === 'zombies'
                            ? 'bg-lime-500 hover:bg-lime-400 text-slate-950'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        {config.mode === 'multiplayer'
                          ? `Join "${config.roomId}" · ${formatMatchModeLabel(config.matchMode)}`
                          : `Deploy · ${formatMatchModeLabel(config.matchMode)} (${activeMap.name})`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {lobbyTab === 'arenas' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-white">
                      Combat Arenas ({filteredMaps.length})
                    </h2>
                    <div className="flex items-center rounded-md bg-[#121824] border border-slate-800 p-0.5 text-xs">
                      {(
                        [
                          { id: 'all', label: 'All (7)' },
                          { id: 'infantry', label: '5v5 Infantry (3)' },
                          { id: 'combined', label: 'Combined Arms (4)' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setMapFilter(tab.id)}
                          className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                            mapFilter === tab.id
                              ? 'bg-amber-500 text-slate-950 font-semibold'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-400 mr-1">3D Camera:</span>
                    {(
                      [
                        { id: 'orbit', label: 'Orbit' },
                        { id: 'overview', label: 'Overview' },
                        { id: 'zone_a', label: 'Zone A' },
                        { id: 'zone_b', label: 'Zone B' },
                        { id: 'zone_c', label: 'Zone C' },
                        { id: 'arsenal', label: 'Arsenal' },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono border cursor-pointer ${
                          cameraPreset === p.id
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                            : 'bg-[#121824] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={onToggleInspect3D}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold bg-cyan-600/20 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-600/35 cursor-pointer"
                    >
                      Full 3D View
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto touch-pan-y pr-1">
                  {filteredMaps.map((mid: MapId) => {
                    const m = MAPS[mid];
                    const selected = config.mapId === mid;
                    return (
                      <button
                        key={mid}
                        type="button"
                        onClick={() => selectMap(mid)}
                        className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-slate-800/95 border-amber-400 text-white shadow-lg'
                            : 'bg-[#121824] border-slate-800 hover:border-slate-600 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-display text-base font-bold text-white flex items-center gap-1.5 truncate">
                            <MapPin className={`w-4 h-4 shrink-0 ${selected ? 'text-amber-400' : 'text-slate-400'}`} />
                            <span className="truncate">{m.name}</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-300 shrink-0">{m.sizeLabel}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs text-amber-300/90 truncate">{m.environment}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                              m.infantryOnly
                                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                                : 'bg-slate-900 border border-slate-700 text-slate-300'
                            }`}
                          >
                            {m.infantryOnly ? '5v5 INFANTRY' : 'AIR & ARMOR'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {m.zones.map((zn, idx) => (
                            <span
                              key={zn}
                              className="px-1.5 py-0.5 rounded bg-[#0a0f18] border border-slate-700/80 text-[10px] font-mono text-slate-300"
                            >
                              {['A', 'B', 'C'][idx]}: {zn}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 leading-snug">{m.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {lobbyTab === 'armory' && (
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">
                      Tactical Armory ({WEAPON_ORDER.length} Weapons)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Configure your 3-slot loadout for TDM, FFA &amp; Zombies or inspect all 18 Gun Game tiers
                    </p>
                  </div>

                  <div className="flex items-center rounded-lg bg-[#121824] border border-slate-800 p-1">
                    <button
                      type="button"
                      onClick={() => setArmoryView('loadout')}
                      className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                        armoryView === 'loadout' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-300'
                      }`}
                    >
                      3-Slot Workshop (50)
                    </button>
                    <button
                      type="button"
                      onClick={() => setArmoryView('ladder')}
                      className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                        armoryView === 'ladder' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      Gun Game Ladder (18)
                    </button>
                  </div>
                </div>

                {armoryView === 'ladder' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 max-h-[58vh] overflow-y-auto touch-pan-y pr-1">
                    {GUN_GAME_LADDER.map((wid, idx) => {
                      const w = WEAPONS[wid];
                      return (
                        <div
                          key={`${idx}-${wid}`}
                          className="p-2.5 rounded-lg bg-[#121824] border border-slate-800"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                            <span className="text-amber-400 font-bold">Tier {idx + 1}</span>
                            <span className="text-slate-500">{w.caliber}</span>
                          </div>
                          <div className="font-display text-xs font-bold text-white truncate">{w.name}</div>
                          <div className="mt-1.5 rounded bg-[#080c14] border border-slate-800/80 px-1.5 py-1">
                            <WeaponArtwork weapon={w} className="w-full h-11" />
                          </div>
                          <div className="mt-1 text-[10px] text-slate-400 font-mono">
                            DMG {w.damage * w.pellets} · {w.rpm} RPM
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left 4 Cols: 3-Slot Selector + Featured Inspection Card */}
                    <div className="lg:col-span-4 space-y-3">
                      <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                        {SLOT_CONFIGS.map((slot) => {
                          const wid = carriedIds[slot.idx];
                          const w = WEAPONS[wid];
                          const isEditing = editingSlot === slot.idx;
                          return (
                            <button
                              key={slot.idx}
                              type="button"
                              onClick={() => setEditingSlot(slot.idx)}
                              className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                                isEditing
                                  ? 'bg-cyan-500/15 border-cyan-400 text-white'
                                  : 'bg-[#121824] border-slate-800 hover:border-slate-600 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="font-bold text-amber-400">{slot.label}</span>
                                <span className="hidden sm:inline text-slate-400">{w.caliber}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <span className="font-display text-xs sm:text-sm font-bold text-white truncate">
                                  {w.name}
                                </span>
                                <div className="hidden lg:block w-24 shrink-0 rounded bg-[#080c14] border border-slate-800 px-1.5 py-0.5">
                                  <WeaponArtwork weapon={w} className="w-full h-8" />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Featured Showcase */}
                      <div className="rounded-lg bg-[#101623] border border-slate-800 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-cyan-300">
                            Editing Slot [{editingSlot + 1}]
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {showcaseWeapon.optic.toUpperCase()} Optic
                          </span>
                        </div>
                        <div className="rounded-lg bg-[#080c14] border border-slate-800 px-3 py-2">
                          <WeaponArtwork weapon={showcaseWeapon} className="w-full h-20" />
                        </div>
                        <div>
                          <div className="font-display text-base font-bold text-white">
                            {showcaseWeapon.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {showcaseWeapon.role} · {showcaseWeapon.caliber} · {showcaseWeapon.fireMode}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-800">
                          <div className="text-slate-300">
                            DMG <span className="text-amber-300 font-bold">{showcaseWeapon.damage * showcaseWeapon.pellets}</span>
                          </div>
                          <div className="text-slate-300">
                            ROF <span className="text-sky-300 font-bold">{showcaseWeapon.rpm} RPM</span>
                          </div>
                          <div className="text-slate-300">
                            VEL <span className="text-emerald-300 font-bold">{showcaseWeapon.muzzleVelocity} m/s</span>
                          </div>
                          <div className="text-slate-300">
                            MAG <span className="text-white font-bold">{showcaseWeapon.magSize}/{showcaseWeapon.reserveMax}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right 8 Cols: Filters + Weapon Grid */}
                    <div className="lg:col-span-8 flex flex-col gap-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {WEAPON_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setWeaponCategory(cat.id)}
                              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                weaponCategory === cat.id
                                  ? 'bg-amber-500 text-slate-950 font-semibold'
                                  : 'bg-[#121824] text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                        <div className="relative w-full sm:w-48">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={weaponQuery}
                            onChange={(e) => setWeaponQuery(e.target.value)}
                            placeholder="Search 50 guns..."
                            className="w-full pl-8 pr-2.5 py-1.5 rounded bg-[#121824] border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto touch-pan-y pr-1">
                        {filteredWeapons.map((wid: WeaponId) => {
                          const w = WEAPONS[wid];
                          const slotMatch = carriedIds.indexOf(wid);
                          const isTargetSelected = slotMatch === editingSlot;
                          const dmgPct = Math.min(100, Math.round(((w.damage * w.pellets) / 220) * 100));
                          const rofPct = Math.min(100, Math.round((w.rpm / 1150) * 100));
                          const rngPct = Math.min(100, Math.round((w.range / 320) * 100));

                          return (
                            <button
                              key={wid}
                              type="button"
                              onClick={() => assignStartingWeapon(wid)}
                              className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                                isTargetSelected
                                  ? 'bg-cyan-500/15 border-cyan-400 text-white'
                                  : slotMatch !== -1
                                  ? 'bg-slate-800/90 border-amber-400/60 text-white'
                                  : 'bg-[#121824] border-slate-800 hover:border-slate-600 text-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1.5 mb-0.5">
                                <span className="font-display text-xs font-bold text-white truncate">
                                  {w.name}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {slotMatch !== -1 && (
                                    <span className="font-mono text-[10px] px-1 rounded bg-amber-500/20 text-amber-300">
                                      S{slotMatch + 1}
                                    </span>
                                  )}
                                  {w.guidance !== 'none' && (
                                    <span className="font-mono text-[10px] px-1 rounded bg-sky-500/20 text-sky-300">
                                      {w.guidance === 'lock_on' ? 'LOCK' : 'GUIDED'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {w.caliber} · {w.fireMode} · {w.magSize}/{w.reserveMax}
                              </div>
                              <div className="my-1.5 rounded bg-[#080c14] border border-slate-800/80 px-2 py-1">
                                <WeaponArtwork weapon={w} className="w-full h-11" />
                              </div>
                              <div className="space-y-1 text-[10px] text-slate-400">
                                <div className="flex items-center gap-2">
                                  <span className="w-9 shrink-0">Power</span>
                                  <div className="flex-1 h-1 bg-slate-900 rounded-sm overflow-hidden">
                                    <div className="h-full bg-amber-400" style={{ width: `${dmgPct}%` }} />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-9 shrink-0">ROF</span>
                                  <div className="flex-1 h-1 bg-slate-900 rounded-sm overflow-hidden">
                                    <div className="h-full bg-sky-400" style={{ width: `${rofPct}%` }} />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-9 shrink-0">Range</span>
                                  <div className="flex-1 h-1 bg-slate-900 rounded-sm overflow-hidden">
                                    <div className="h-full bg-emerald-400" style={{ width: `${rngPct}%` }} />
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {lobbyTab === 'rooms' && (
              <div className="space-y-4">
                {/* Quick Mode / Map Launchers */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { label: 'Killhouse Zombies', mapId: 'killhouse' as MapId, matchMode: 'zombies' as MatchMode, teamSize: 5 as const, roomId: 'zombies-cqb' },
                    { label: 'Pacific Outbreak', mapId: 'island' as MapId, matchMode: 'zombies' as MatchMode, teamSize: 10 as const, roomId: 'zombies-isle' },
                    { label: '5v5 Killhouse TDM', mapId: 'killhouse' as MapId, matchMode: 'tdm' as MatchMode, teamSize: 5 as const, roomId: 'cqb-5v5' },
                    { label: '5v5 Metro FFA', mapId: 'metro' as MapId, matchMode: 'ffa' as MatchMode, teamSize: 5 as const, roomId: 'metro-ffa' },
                    { label: 'Rooftop Gun Game', mapId: 'rooftop' as MapId, matchMode: 'gun_game' as MatchMode, teamSize: 5 as const, roomId: 'gungame-1' },
                    { label: 'Pacific Combined', mapId: 'island' as MapId, matchMode: 'tdm' as MatchMode, teamSize: 10 as const, roomId: 'pacific-hq' },
                  ].map((preset) => (
                    <button
                      key={preset.roomId}
                      type="button"
                      onClick={() =>
                        onUpdateConfig({
                          mode: 'multiplayer',
                          mapId: preset.mapId,
                          matchMode: preset.matchMode,
                          playerTeam: preset.matchMode === 'zombies' ? 'blue' : config.playerTeam,
                          teamSize: preset.teamSize,
                          roomId: preset.roomId,
                          botFill: true,
                        })
                      }
                      className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                        config.mode === 'multiplayer' && config.roomId === preset.roomId
                          ? preset.matchMode === 'zombies'
                            ? 'bg-lime-500/15 border-lime-400 text-white'
                            : 'bg-sky-500/15 border-sky-400 text-white'
                          : 'bg-[#121824] border-slate-800 hover:border-slate-600 text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-display font-bold truncate">{preset.label}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                        {preset.matchMode === 'zombies' ? 'CO-OP HORDE' : MAPS[preset.mapId].sizeLabel} · {preset.roomId}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Room Config */}
                  <div className="lg:col-span-5 rounded-lg bg-[#121824] border border-slate-800 p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-base font-semibold text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-sky-400" />
                        Host or Join Room
                      </h2>
                      <span className="text-[11px] font-mono text-emerald-400">Live WebSocket</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Room Code</label>
                        <input
                          type="text"
                          maxLength={20}
                          value={config.roomId}
                          onChange={(e) =>
                            onUpdateConfig({
                              mode: 'multiplayer',
                              roomId: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') || 'alpha-1',
                            })
                          }
                          placeholder="alpha-1"
                          className="w-full px-3 py-1.5 rounded-md bg-[#0d121c] border border-slate-700 focus:border-sky-400 focus:outline-none text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Arena Map</label>
                        <select
                          value={config.mapId}
                          onChange={(e) => selectMap(e.target.value as MapId)}
                          className="w-full px-2.5 py-1.5 rounded-md bg-[#0d121c] border border-slate-700 focus:border-sky-400 focus:outline-none text-xs text-white"
                        >
                          {MAP_ORDER.map((mid) => (
                            <option key={mid} value={mid}>
                              {MAPS[mid].name} {MAPS[mid].infantryOnly ? '(5v5 Infantry)' : '(Combined Arms)'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1.5">Game Mode</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {MODE_CARDS.map((mc) => (
                          <button
                            key={mc.id}
                            type="button"
                            onClick={() =>
                              onUpdateConfig({
                                matchMode: mc.id,
                                mode: 'multiplayer',
                                playerTeam: mc.id === 'zombies' ? 'blue' : config.playerTeam,
                              })
                            }
                            className={`py-1.5 px-2 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                              config.matchMode === mc.id
                                ? mc.id === 'zombies'
                                  ? 'bg-lime-500 border-lime-400 text-slate-950'
                                  : 'bg-amber-500 border-amber-400 text-slate-950'
                                : 'bg-[#0d121c] border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {mc.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {config.matchMode === 'tdm' && (
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1.5">Your Faction</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['blue', 'red'] as TeamId[]).map((tid) => (
                            <button
                              key={tid}
                              type="button"
                              onClick={() => onUpdateConfig({ playerTeam: tid, mode: 'multiplayer' })}
                              className={`py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                                config.playerTeam === tid
                                  ? tid === 'blue'
                                    ? 'bg-blue-600 border-blue-400 text-white'
                                    : 'bg-red-600 border-red-400 text-white'
                                  : 'bg-[#0d121c] border-slate-800 text-slate-300 hover:border-slate-600'
                              }`}
                            >
                              {tid === 'blue' ? 'Vanguard (Blue)' : 'Syndicate (Red)'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {config.matchMode !== 'zombies' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateConfig({ botFill: true, mode: 'multiplayer' })}
                          className={`py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                            config.botFill
                              ? 'bg-sky-600 border-sky-400 text-white'
                              : 'bg-[#0d121c] border-slate-800 text-slate-300'
                          }`}
                        >
                          Bots + Humans ({config.teamSize}v{config.teamSize})
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateConfig({ botFill: false, mode: 'multiplayer' })}
                          className={`py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                            !config.botFill
                              ? 'bg-sky-600 border-sky-400 text-white'
                              : 'bg-[#0d121c] border-slate-800 text-slate-300'
                          }`}
                        >
                          Humans Only
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (config.mode !== 'multiplayer') {
                          onUpdateConfig({ mode: 'multiplayer' });
                        }
                        onStartMatch();
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors cursor-pointer ${
                        config.matchMode === 'zombies'
                          ? 'bg-lime-500 hover:bg-lime-400 text-slate-950'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Connect &amp; Join &ldquo;{config.roomId}&rdquo;
                    </button>
                  </div>

                  {/* Active Rooms List */}
                  <div className="lg:col-span-7 rounded-lg bg-[#121824] border border-slate-800 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-display text-base font-semibold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-400" />
                        Active Multiplayer Rooms ({rooms.length})
                      </h2>
                      <button
                        type="button"
                        onClick={() => void refreshRooms()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>

                    {rooms.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-800 rounded-lg">
                        <Globe className="w-8 h-8 text-slate-600 mb-2" />
                        <div className="text-sm font-medium text-slate-300">No active human rooms yet</div>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                          Select a quick preset above (like <span className="font-mono text-lime-300">zombies-cqb</span> or <span className="font-mono text-slate-300">cqb-5v5</span>) and click Connect. Other players see your room live here!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {rooms.map((rm) => (
                          <div
                            key={rm.roomId}
                            className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#0d121c] border border-slate-800 hover:border-sky-500/60"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-bold text-sm text-white">{rm.roomId}</span>
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-medium">
                                  {MAPS[rm.mapId]?.name || rm.mapId}
                                </span>
                                <span
                                  className={`text-[11px] px-1.5 py-0.5 rounded border font-mono ${
                                    rm.matchMode === 'zombies'
                                      ? 'bg-lime-500/15 border-lime-500/40 text-lime-300'
                                      : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                                  }`}
                                >
                                  {formatMatchModeLabel(rm.matchMode)}
                                  {rm.matchMode !== 'zombies' && ` · ${rm.teamSize || 5}v${rm.teamSize || 5}`}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {rm.matchMode === 'zombies'
                                    ? 'Co-op Survivors'
                                    : rm.botFill
                                    ? 'Bots + Humans'
                                    : 'Humans Only'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1 font-mono">
                                {rm.matchMode === 'zombies'
                                  ? `Wave ${rm.zombieWave || 1} · ${rm.blueScore} Infected Slain`
                                  : rm.matchMode === 'tdm'
                                  ? `Score: ${rm.blueScore} - ${rm.redScore} / ${rm.scoreLimit}`
                                  : `Target: ${rm.matchMode === 'gun_game' ? '18 Tiers' : `${rm.scoreLimit} Kills`}`}{' '}
                                · {rm.humanCount}/{rm.maxHumans} Players
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateConfig({
                                  mode: 'multiplayer',
                                  roomId: rm.roomId,
                                  mapId: rm.mapId,
                                  matchMode: rm.matchMode || 'tdm',
                                  playerTeam: rm.matchMode === 'zombies' ? 'blue' : config.playerTeam,
                                  teamSize: ([4, 5, 6, 10].includes(rm.teamSize)
                                    ? rm.teamSize
                                    : 5) as 4 | 5 | 6 | 10,
                                  scoreLimit: rm.scoreLimit,
                                  botFill: rm.botFill,
                                });
                                onStartMatch();
                              }}
                              className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer"
                            >
                              Join Room
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {lobbyTab === 'about' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-[#121824] border border-slate-800 p-5">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-2">
                    <Code2 className="w-4 h-4" />
                    Development Team
                  </div>
                  <h2 className="font-display text-xl font-bold text-white mb-1">
                    Created by VictorTheGreat &amp; Williamson22
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Vanguard Arena is developed by <span className="text-slate-100 font-semibold">VictorTheGreat</span> and{' '}
                    <span className="text-slate-100 font-semibold">Williamson22</span> as a browser-based 3D tactical shooter featuring Team Deathmatch, Free-For-All, 18-Tier Gun Game, Zombie Outbreak Survival, 5v5 infantry CQB maps, combined-arms battlefields, 50 firearms, and real-time WebSocket multiplayer.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div className="rounded-lg bg-[#0d121c] border border-slate-800 p-4">
                      <div className="font-display text-base font-bold text-white">VictorTheGreat</div>
                      <div className="text-xs text-amber-400 mt-0.5">Developer</div>
                    </div>
                    <div className="rounded-lg bg-[#0d121c] border border-slate-800 p-4">
                      <div className="font-display text-base font-bold text-white">Williamson22</div>
                      <div className="text-xs text-amber-400 mt-0.5">Developer</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-[#121824] border border-slate-800 p-5">
                    <h3 className="font-display text-sm font-semibold text-slate-100 mb-2 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-lime-400" />
                      4 Combat Modes &amp; Zombie Horde Survival
                    </h3>
                    <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                      <li>Zombie Survival: Escalating waves of Walkers, Feral Runners &amp; Armored Brutes with outbreak twilight &amp; co-op MP support</li>
                      <li>Team Deathmatch, Free-For-All, and 18-Tier Gun Game Escalation</li>
                      <li>3 tight 5v5 Infantry Arenas (Cargo Killhouse, Subway Concourse, Skyline Helideck)</li>
                      <li>4 Combined-Arms Arenas (Industrial Yard, Desert Outpost, Cryo Bunker, Pacific Archipelago)</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-[#121824] border border-slate-800 p-5 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-display text-sm font-semibold text-slate-100 mb-2">
                        50 Weapons &amp; Interactive 3D Preview
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Orbit any arena live behind the Command Lobby or click Inspect 3D to fly directly to Zones A, B, C, and the base Arsenal. Customize all 3 slots in Armory or jump directly into Co-op Multiplayer rooms.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={onOpenAndroidApp}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/45 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        Get Android App
                      </button>
                      <button
                        type="button"
                        onClick={() => setLobbyTab('command')}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Back to Command
                      </button>
                      <button
                        type="button"
                        onClick={onStartMatch}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Deploy to Match
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (hud.phase === 'paused') {
    return (
      <div className="fixed inset-0 z-20 flex items-start justify-center p-3 sm:p-6 bg-[#070a10]/78 overflow-y-auto touch-pan-y">
        <div className="my-auto w-full max-w-4xl rounded-xl bg-[#0d121c]/95 border border-slate-700/80 p-4 sm:p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-800">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Match Paused</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatMatchModeLabel(hud.matchMode)}
                {hud.matchMode === 'zombies' && hud.zombies ? ` · Wave ${hud.zombies.wave}` : ''} · Adjust sensitivity or resume combat
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateConfig({ muted: !config.muted })}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                {config.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {config.muted ? 'Muted' : 'Audio On'}
              </button>
              <button
                type="button"
                onClick={onReturnToLobby}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Exit to Lobby
              </button>
              <button
                type="button"
                onClick={onResumeMatch}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                <Crosshair className="w-4 h-4" />
                Resume Match
              </button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-end gap-6">
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Aim Sensitivity</span>
                <span className="font-mono text-slate-200 tabular-nums">
                  {config.sensitivity.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={0.3}
                max={2.4}
                step={0.1}
                value={config.sensitivity}
                onChange={(e) => onUpdateConfig({ sensitivity: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="w-full max-w-xs">
              <div className="text-xs text-slate-400 mb-1.5">Touch Controls</div>
              <div className="grid grid-cols-3 gap-2">
                {(['auto', 'on', 'off'] as TouchControlsMode[]).map((tm) => (
                  <button
                    key={tm}
                    type="button"
                    onClick={() => onUpdateConfig({ touchControls: tm })}
                    className={`py-1.5 rounded-md text-xs font-medium uppercase border transition-colors cursor-pointer ${
                      config.touchControls === tm
                        ? 'bg-cyan-600 border-cyan-400 text-white'
                        : 'bg-[#121824] border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {tm}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ScoreboardModal
            entries={hud.scoreboard}
            blueScore={hud.blueScore}
            redScore={hud.redScore}
            scoreLimit={hud.scoreLimit}
            matchMode={hud.matchMode}
            zombieWave={hud.zombies?.wave}
          />
        </div>
      </div>
    );
  }

  if (hud.phase === 'ended') {
    const isZombies = hud.matchMode === 'zombies';
    const isFfa = hud.matchMode === 'ffa' || hud.matchMode === 'gun_game';
    const blueWon = hud.winner === 'blue';
    const isDraw = !isFfa && !isZombies && hud.winner === 'draw';
    const playerWon = isZombies
      ? hud.winner === 'blue'
      : isFfa
      ? hud.winnerName === hud.playerUsername
      : hud.winner === hud.playerTeam;
    return (
      <div className="fixed inset-0 z-20 flex items-start justify-center p-3 sm:p-6 bg-[#070a10]/80 overflow-y-auto touch-pan-y">
        <div className="my-auto w-full max-w-4xl space-y-5">
          <div className="rounded-xl bg-[#0d121c]/95 border border-slate-700/80 p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isZombies
                    ? playerWon
                      ? 'bg-lime-500/20 text-lime-400 border border-lime-500/40'
                      : 'bg-red-600/25 text-red-400 border border-red-500/40'
                    : isFfa
                    ? playerWon
                      ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : blueWon
                    ? 'bg-blue-600/25 text-blue-400 border border-blue-500/40'
                    : isDraw
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-red-600/25 text-red-400 border border-red-500/40'
                }`}
              >
                {isZombies ? <Biohazard className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold text-white">
                  {isZombies
                    ? playerWon
                      ? 'Outbreak Repelled'
                      : 'Overrun by the Horde'
                    : isFfa
                    ? `${hud.winnerName || hud.scoreboard[0]?.name || 'Champion'} Victory`
                    : blueWon
                    ? 'Vanguard Victory'
                    : isDraw
                    ? 'Match Draw'
                    : 'Syndicate Victory'}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5 font-mono tabular-nums">
                  {isZombies ? (
                    <>
                      Reached Wave {hud.zombies?.wave ?? 1} · {hud.blueScore} Infected Slain
                    </>
                  ) : isFfa ? (
                    <>
                      {hud.matchMode === 'gun_game'
                        ? 'Gun Game Escalation Champion'
                        : `Free-For-All Top Eliminator (${hud.scoreboard[0]?.kills ?? 0} Kills)`}
                      <span className={`ml-2 ${playerWon ? 'text-emerald-400' : 'text-red-400'}`}>
                        ({playerWon ? '1st Place' : 'Defeat'})
                      </span>
                    </>
                  ) : (
                    <>
                      Final Score: Vanguard {hud.blueScore} — {hud.redScore} Syndicate
                      {!isDraw && (
                        <span className={`ml-2 ${playerWon ? 'text-emerald-400' : 'text-red-400'}`}>
                          ({playerWon ? 'Victory' : 'Defeat'})
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onReturnToLobby}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors cursor-pointer"
              >
                Return to Lobby
              </button>
              <button
                type="button"
                onClick={onStartMatch}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
            </div>
          </div>

          <ScoreboardModal
            entries={hud.scoreboard}
            blueScore={hud.blueScore}
            redScore={hud.redScore}
            scoreLimit={hud.scoreLimit}
            matchMode={hud.matchMode}
            zombieWave={hud.zombies?.wave}
          />
        </div>
      </div>
    );
  }

  return null;
};
