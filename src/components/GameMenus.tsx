import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Code2,
  Crosshair,
  Globe,
  Info,
  MapPin,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MAP_ORDER, MAPS } from '../game/arena';
import { fetchActiveRooms } from '../game/multiplayer';
import {
  Difficulty,
  HudSnapshot,
  MapId,
  MatchConfig,
  MultiplayerRoomSummary,
  PlayerAccount,
  TeamId,
  TouchControlsMode,
  WeaponCategory,
  WeaponId,
} from '../game/types';
import { WEAPON_CATEGORIES, WEAPON_ORDER, WEAPONS } from '../game/weapons';
import { ScoreboardModal } from './ScoreboardModal';

interface GameMenusProps {
  hud: HudSnapshot;
  config: MatchConfig;
  account: PlayerAccount | null;
  onOpenAccount: () => void;
  onUpdateConfig: (next: Partial<MatchConfig>) => void;
  onStartMatch: () => void;
  onResumeMatch: () => void;
  onReturnToLobby: () => void;
}

const SLOT_CONFIGS: Array<{
  idx: 0 | 1 | 2;
  label: string;
  configKey: 'startingWeapon' | 'startingSecondary' | 'startingHeavy';
}> = [
  { idx: 0, label: 'Slot [1] Primary', configKey: 'startingWeapon' },
  { idx: 1, label: 'Slot [2] Secondary', configKey: 'startingSecondary' },
  { idx: 2, label: 'Slot [3] Heavy', configKey: 'startingHeavy' },
];

export const GameMenus: React.FC<GameMenusProps> = ({
  hud,
  config,
  account,
  onOpenAccount,
  onUpdateConfig,
  onStartMatch,
  onResumeMatch,
  onReturnToLobby,
}) => {
  const [lobbyTab, setLobbyTab] = useState<'play' | 'rooms' | 'about'>('play');
  const [editingSlot, setEditingSlot] = useState<0 | 1 | 2>(0);
  const [weaponCategory, setWeaponCategory] = useState<WeaponCategory | 'all'>('all');
  const [weaponQuery, setWeaponQuery] = useState('');
  const [rooms, setRooms] = useState<MultiplayerRoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

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

  const carriedIds: [WeaponId, WeaponId, WeaponId] = [
    config.startingWeapon,
    config.startingSecondary,
    config.startingHeavy,
  ];

  if (hud.phase === 'lobby') {
    return (
      <div className="fixed inset-0 z-20 flex items-start justify-center p-2.5 sm:p-5 bg-[#070a10]/65 overflow-y-auto touch-pan-y">
        <div className="my-auto w-full max-w-6xl rounded-xl bg-[#0d121c]/95 border border-slate-700/80 p-3.5 sm:p-6 shadow-2xl">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Vanguard Arena
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                4× Expanded Battlefields · Attack Helicopters · Mini Hangars · 50 Weapons · Multiplayer
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenAccount}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#121824] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-white">{config.username}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {account && !account.isGuest ? 'Account' : 'Guest'}
                </span>
              </button>

              <div className="flex items-center rounded-lg bg-[#121824] border border-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setLobbyTab('play')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    lobbyTab === 'play'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  Loadout
                </button>
                <button
                  type="button"
                  onClick={() => setLobbyTab('rooms')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    lobbyTab === 'rooms'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Multiplayer
                </button>
                <button
                  type="button"
                  onClick={() => setLobbyTab('about')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    lobbyTab === 'about'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  About
                </button>
              </div>

              <button
                type="button"
                onClick={() => onUpdateConfig({ muted: !config.muted })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {config.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {config.muted ? 'Muted' : 'Audio On'}
              </button>

              <button
                type="button"
                onClick={onStartMatch}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap shrink-0 shadow-lg cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                {config.mode === 'multiplayer' ? 'Join Match' : 'Deploy to Match'}
              </button>
            </div>
          </div>

          {lobbyTab === 'about' ? (
            <div className="space-y-5 py-2">
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
                  <span className="text-slate-100 font-semibold">Williamson22</span> as a lightweight browser-based
                  3D tactical Team Deathmatch shooter with real-time multiplayer, 50 authentic firearms, heavy artillery, and combined-arms vehicle combat.
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
                  <h3 className="font-display text-sm font-semibold text-slate-100 mb-2">
                    Weapons, Artillery &amp; Killstreaks
                  </h3>
                  <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                    <li>50 realistic weapons across 8 categories (Assault, SMGs, LMGs, Shotguns, DMRs, Snipers, Sidearms, RPG &amp; Guided Launchers)</li>
                    <li>Arsenal Armory structures at both team spawns — the exclusive station to swap your 3 carried slots during combat</li>
                    <li>Emplaced 105mm M119 Field Guns, BGM-71 TOW Launchers, 20mm Twin Autocannons &amp; .50 Cal M2HB Turrets</li>
                    <li>Fire-and-forget IR Lock-On (Javelin / Stinger), laser-guided SACLOS missiles, UAV Recon (2 kills), Precision Air Strike (4), and Heavy Barrage (6)</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-[#121824] border border-slate-800 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-slate-100 mb-2">
                      4× Expanded Arenas, Helicopters &amp; Online Multiplayer
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Battle 10v10 across huge 680–2160m arenas (Industrial Yard, Desert Outpost, Cryo Bunker, Pacific Archipelago) with 3 capture zones (A, B, C),
                      flyable AH-64 Apache Attack Helicopters, Stryker APCs, M1A2 Heavy Tanks, Mini Hangar heavy resupply bays, finite vehicle ordnance, and live human multiplayer rooms.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLobbyTab('play')}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Configure Loadout
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
          ) : lobbyTab === 'rooms' ? (
            <div className="space-y-5 py-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Room Config */}
                <div className="lg:col-span-5 rounded-lg bg-[#121824] border border-slate-800 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-semibold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-400" />
                      Create or Join Multiplayer Room
                    </h2>
                    <span className="text-[11px] font-mono text-emerald-400">Live WebSocket Sync</span>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Room Code</label>
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
                      className="w-full px-3 py-2 rounded-md bg-[#0d121c] border border-slate-700 focus:border-sky-400 focus:outline-none text-sm font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Your Faction</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['blue', 'red'] as TeamId[]).map((tid) => (
                        <button
                          key={tid}
                          type="button"
                          onClick={() => onUpdateConfig({ playerTeam: tid, mode: 'multiplayer' })}
                          className={`py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
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

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">AI Bot Backfill</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ botFill: true, mode: 'multiplayer' })}
                        className={`py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                          config.botFill
                            ? 'bg-sky-600 border-sky-400 text-white'
                            : 'bg-[#0d121c] border-slate-800 text-slate-300'
                        }`}
                      >
                        Bots + Humans (10v10)
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ botFill: false, mode: 'multiplayer' })}
                        className={`py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                          !config.botFill
                            ? 'bg-sky-600 border-sky-400 text-white'
                            : 'bg-[#0d121c] border-slate-800 text-slate-300'
                        }`}
                      >
                        Humans Only
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (config.mode !== 'multiplayer') {
                        onUpdateConfig({ mode: 'multiplayer' });
                      }
                      onStartMatch();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Connect &amp; Join Room &ldquo;{config.roomId}&rdquo;
                  </button>
                </div>

                {/* Active Rooms List */}
                <div className="lg:col-span-7 rounded-lg bg-[#121824] border border-slate-800 p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-base font-semibold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      Active Multiplayer Rooms
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
                        Enter a room code on the left (like <span className="font-mono text-slate-300">alpha-1</span>) and click Connect. Share the same room code with friends to play together.
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
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-white">{rm.roomId}</span>
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                                {MAPS[rm.mapId]?.name || rm.mapId}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {rm.botFill ? 'Bots + Humans' : 'Humans Only'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 font-mono">
                              Score: {rm.blueScore} - {rm.redScore} / {rm.scoreLimit} · {rm.humanCount}/{rm.maxHumans} Players
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateConfig({
                                mode: 'multiplayer',
                                roomId: rm.roomId,
                                mapId: rm.mapId,
                                scoreLimit: rm.scoreLimit,
                                botFill: rm.botFill,
                              });
                              onStartMatch();
                            }}
                            className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer"
                          >
                            Join
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Mode & Faction Quick Bar */}
              <div className="mb-4 rounded-lg bg-[#121824] border border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-400 mr-1">Mode:</span>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ mode: 'solo' })}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                      config.mode === 'solo'
                        ? 'bg-amber-500 border-amber-400 text-slate-950'
                        : 'bg-[#0d121c] border-slate-700 text-slate-300'
                    }`}
                  >
                    Solo vs AI Bots
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ mode: 'multiplayer' })}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                      config.mode === 'multiplayer'
                        ? 'bg-sky-500 border-sky-400 text-slate-950'
                        : 'bg-[#0d121c] border-slate-700 text-slate-300'
                    }`}
                  >
                    Online Multiplayer
                  </button>

                  {config.mode === 'multiplayer' && (
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs text-slate-400">Room:</span>
                      <input
                        type="text"
                        maxLength={20}
                        value={config.roomId}
                        onChange={(e) =>
                          onUpdateConfig({
                            roomId: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') || 'alpha-1',
                          })
                        }
                        className="w-28 px-2.5 py-1 rounded bg-[#0d121c] border border-slate-700 text-xs font-mono text-white"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ botFill: !config.botFill })}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono border cursor-pointer ${
                          config.botFill
                            ? 'bg-slate-800 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {config.botFill ? 'Bot Fill: ON' : 'Humans Only'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Team:</span>
                  {(['blue', 'red'] as TeamId[]).map((tid) => (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => onUpdateConfig({ playerTeam: tid })}
                      className={`px-3 py-1 rounded text-xs font-semibold border cursor-pointer ${
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

              {/* Map Selection Strip */}
              <div className="mb-4">
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="font-display text-base font-semibold text-slate-100">
                    Select 3-Zone Combat Arena
                  </h2>
                  <span className="text-xs text-slate-400">Live 3D battlefield preview behind lobby</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {MAP_ORDER.map((mid: MapId) => {
                    const m = MAPS[mid];
                    const selected = config.mapId === mid;
                    return (
                      <button
                        key={mid}
                        type="button"
                        onClick={() => onUpdateConfig({ mapId: mid })}
                        className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-slate-800/95 border-amber-400 text-white'
                            : 'bg-[#121824] border-slate-800 hover:border-slate-600 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                            <MapPin className={`w-3.5 h-3.5 ${selected ? 'text-amber-400' : 'text-slate-400'}`} />
                            {m.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">{m.sizeLabel}</span>
                        </div>
                        <div className="text-[11px] text-amber-300/90 mb-1">{m.environment}</div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {m.zones.map((zn, idx) => (
                            <span
                              key={zn}
                              className="px-1.5 py-0.5 rounded bg-[#0a0f18] border border-slate-700/80 text-[10px] font-mono text-slate-300"
                            >
                              {['A', 'B', 'C'][idx]}: {zn}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{m.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: 50-Weapon Starting Loadout */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <h2 className="font-display text-base font-semibold text-slate-100">
                      Starting 3-Slot Arsenal (50 Weapons)
                    </h2>
                    <span className="text-xs text-cyan-300">
                      In-match weapon changes available only at base Arsenal [E]
                    </span>
                  </div>

                  {/* 3-Slot Selector */}
                  <div className="grid grid-cols-3 gap-2 mb-2.5">
                    {SLOT_CONFIGS.map((slot) => {
                      const wid = carriedIds[slot.idx];
                      const w = WEAPONS[wid];
                      const isEditing = editingSlot === slot.idx;
                      return (
                        <button
                          key={slot.idx}
                          type="button"
                          onClick={() => setEditingSlot(slot.idx)}
                          className={`text-left px-2.5 py-2 rounded-lg border transition-colors cursor-pointer ${
                            isEditing
                              ? 'bg-cyan-500/15 border-cyan-400 text-white'
                              : 'bg-[#121824] border-slate-800 hover:border-slate-600 text-slate-300'
                          }`}
                        >
                          <div className="text-[10px] font-mono font-bold text-amber-400">
                            {slot.label}
                          </div>
                          <div className="font-display text-xs font-bold text-white truncate mt-0.5">
                            {w.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {w.caliber}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Category Filter + Search */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1">
                      {WEAPON_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setWeaponCategory(cat.id)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                            weaponCategory === cat.id
                              ? 'bg-amber-500 text-slate-950 font-semibold'
                              : 'bg-[#121824] text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <div className="relative w-full sm:w-44">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={weaponQuery}
                        onChange={(e) => setWeaponQuery(e.target.value)}
                        placeholder="Search weapon..."
                        className="w-full pl-8 pr-2.5 py-1 rounded bg-[#121824] border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Scrollable 50-weapon Picker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[295px] overflow-y-auto touch-pan-y pr-1">
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
                          <div className="flex items-start justify-between gap-2 mb-0.5">
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
                          <div className="text-[10px] text-slate-400 mb-1.5 truncate">
                            {w.caliber} · {w.fireMode} · {w.magSize}/{w.reserveMax}
                          </div>
                          <div className="space-y-1 text-[10px] text-slate-400">
                            <div className="flex items-center gap-2">
                              <span className="w-10 shrink-0">Power</span>
                              <div className="flex-1 h-1 bg-slate-900 rounded-sm overflow-hidden">
                                <div className="h-full bg-amber-400" style={{ width: `${dmgPct}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-10 shrink-0">ROF</span>
                              <div className="flex-1 h-1 bg-slate-900 rounded-sm overflow-hidden">
                                <div className="h-full bg-sky-400" style={{ width: `${rofPct}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-10 shrink-0">Range</span>
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

                {/* Right: Match Rules & Controls */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  <div className="space-y-3.5">
                    <h2 className="font-display text-base font-semibold text-slate-100">
                      Team Deathmatch Rules
                    </h2>

                    <div>
                      <div className="text-xs text-slate-400 mb-1.5">Squad Size</div>
                      <div className="grid grid-cols-3 gap-2">
                        {([4, 6, 10] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => onUpdateConfig({ teamSize: sz })}
                            className={`py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                              config.teamSize === sz
                                ? 'bg-blue-600 border-blue-400 text-white'
                                : 'bg-[#121824] border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {sz} vs {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 mb-1.5">Elimination Target</div>
                      <div className="grid grid-cols-3 gap-2">
                        {([25, 50, 75] as const).map((lim) => (
                          <button
                            key={lim}
                            type="button"
                            onClick={() => onUpdateConfig({ scoreLimit: lim })}
                            className={`py-2 rounded-md text-xs font-medium font-mono tabular-nums border transition-colors cursor-pointer ${
                              config.scoreLimit === lim
                                ? 'bg-blue-600 border-blue-400 text-white'
                                : 'bg-[#121824] border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {lim} Kills
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 mb-1.5">Bot Difficulty</div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['recruit', 'tactical', 'veteran'] as Difficulty[]).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => onUpdateConfig({ difficulty: d })}
                            className={`py-2 rounded-md text-xs font-medium capitalize border transition-colors cursor-pointer ${
                              config.difficulty === d
                                ? 'bg-blue-600 border-blue-400 text-white'
                                : 'bg-[#121824] border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
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

                    <div>
                      <div className="text-xs text-slate-400 mb-1.5">Mobile / Touch Controls</div>
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

                  {/* Controls Quick Reference */}
                  <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                    <div className="text-slate-200 font-medium mb-1">Combat Controls</div>
                    <div className="flex justify-between">
                      <span>Move / Sprint / Jump</span>
                      <span className="font-mono text-slate-300">WASD · Shift · Space</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fire / Scope &amp; Lock-On</span>
                      <span className="font-mono text-slate-300">LMB · RMB or F</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Switch Carried Slots / Reload</span>
                      <span className="font-mono text-slate-300">1–3 / Q / Wheel · R</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Arsenal / Hangar / Vehicle / Mount</span>
                      <span className="font-mono text-slate-300">E</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heli Climb / Descend / Crew Seat</span>
                      <span className="font-mono text-slate-300">Space · Ctrl/Q · C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dig Trench / Air Strike / Zoom</span>
                      <span className="font-mono text-slate-300">T · X · V</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frag Grenade (Hold to Cook)</span>
                      <span className="font-mono text-slate-300">G</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mute Audio / Scoreboard</span>
                      <span className="font-mono text-slate-300">M · Tab</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onStartMatch}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors shadow-lg cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {config.mode === 'multiplayer' ? `Join Room "${config.roomId}"` : 'Deploy to Match'}
                  </button>
                </div>
              </div>
            </>
          )}
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
                Adjust sensitivity or resume combat · Swap weapons at base Arsenal
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
                Exit to Loadout
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
          />
        </div>
      </div>
    );
  }

  if (hud.phase === 'ended') {
    const blueWon = hud.winner === 'blue';
    const isDraw = hud.winner === 'draw';
    const playerWon = hud.winner === hud.playerTeam;
    return (
      <div className="fixed inset-0 z-20 flex items-start justify-center p-3 sm:p-6 bg-[#070a10]/80 overflow-y-auto touch-pan-y">
        <div className="my-auto w-full max-w-4xl space-y-5">
          <div className="rounded-xl bg-[#0d121c]/95 border border-slate-700/80 p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  blueWon
                    ? 'bg-blue-600/25 text-blue-400 border border-blue-500/40'
                    : isDraw
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-red-600/25 text-red-400 border border-red-500/40'
                }`}
              >
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold text-white">
                  {blueWon ? 'Vanguard Victory' : isDraw ? 'Match Draw' : 'Syndicate Victory'}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5 font-mono tabular-nums">
                  Final Score: Vanguard {hud.blueScore} — {hud.redScore} Syndicate
                  {!isDraw && (
                    <span className={`ml-2 ${playerWon ? 'text-emerald-400' : 'text-red-400'}`}>
                      ({playerWon ? 'Victory' : 'Defeat'})
                    </span>
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
                Change Loadout
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
          />
        </div>
      </div>
    );
  }

  return null;
};
