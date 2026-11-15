import React from 'react';
import { Crosshair, MapPin, Play, RotateCcw, Shield, Volume2, VolumeX } from 'lucide-react';
import { MAP_ORDER, MAPS } from '../game/arena';
import { Difficulty, HudSnapshot, MapId, MatchConfig, WeaponId } from '../game/types';
import { WEAPON_ORDER, WEAPONS } from '../game/weapons';
import { ScoreboardModal } from './ScoreboardModal';

interface GameMenusProps {
  hud: HudSnapshot;
  config: MatchConfig;
  onUpdateConfig: (next: Partial<MatchConfig>) => void;
  onStartMatch: () => void;
  onResumeMatch: () => void;
  onReturnToLobby: () => void;
}

export const GameMenus: React.FC<GameMenusProps> = ({
  hud,
  config,
  onUpdateConfig,
  onStartMatch,
  onResumeMatch,
  onReturnToLobby,
}) => {
  if (hud.phase === 'lobby') {
    return (
      <div className="fixed inset-0 z-20 flex items-start justify-center p-4 sm:p-5 bg-[#070a10]/62 overflow-y-auto">
        <div className="my-auto w-full max-w-5xl rounded-xl bg-[#0d121c]/95 border border-slate-700/80 p-5 sm:p-6 shadow-2xl">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Vanguard Arena
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Browser 3D Team Deathmatch · 3 Maps · 7 Weapons + RPG-7 · Fixed .50 Cal HMGs · Frag Grenades
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onUpdateConfig({ muted: !config.muted })}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {config.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {config.muted ? 'Audio Muted' : 'Audio On'}
              </button>
              <button
                type="button"
                onClick={onStartMatch}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap shrink-0 shadow-lg cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Deploy to Match
              </button>
            </div>
          </div>

          {/* Map Selection Strip */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2.5">
              <h2 className="font-display text-base font-semibold text-slate-100">
                Select Combat Arena
              </h2>
              <span className="text-xs text-slate-400">Live 3D preview updates in background</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    <div className="text-[11px] text-amber-300/90 mb-0.5">{m.environment}</div>
                    <p className="text-xs text-slate-400 leading-snug">{m.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Starting Weapon Arsenal (7 Weapons) */}
            <div className="lg:col-span-7">
              <div className="flex items-baseline justify-between mb-2.5">
                <h2 className="font-display text-base font-semibold text-slate-100">
                  Select Starting Weapon
                </h2>
                <span className="text-xs text-slate-400">All 7 weapons available in-match (1–7)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WEAPON_ORDER.map((wid: WeaponId) => {
                  const w = WEAPONS[wid];
                  const selected = config.startingWeapon === wid;
                  const dmgPct = Math.min(100, Math.round(((w.damage * w.pellets) / 160) * 100));
                  const rofPct = Math.min(100, Math.round((w.rpm / 880) * 100));
                  const rngPct = Math.min(100, Math.round((w.range / 195) * 100));
                  return (
                    <button
                      key={wid}
                      type="button"
                      onClick={() => onUpdateConfig({ startingWeapon: wid })}
                      className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-slate-800/95 border-amber-400 text-white'
                          : 'bg-[#121824] border-slate-800 hover:border-slate-600 text-slate-200'
                      }`}
                    >
                      <div className="flex items-baseline justify-between mb-0.5">
                        <span className="font-display text-sm font-bold text-white">
                          {w.name}
                        </span>
                        <span className="font-mono text-[11px] text-amber-400">Slot {w.slot}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-1.5">
                        {w.caliber} · {w.fireMode} · {w.magSize} rd
                      </div>

                      <div className="space-y-1 text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="w-12 shrink-0">Damage</span>
                          <div className="flex-1 h-1.5 bg-slate-900 rounded-sm overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: `${dmgPct}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-12 shrink-0">Fire Rate</span>
                          <div className="flex-1 h-1.5 bg-slate-900 rounded-sm overflow-hidden">
                            <div className="h-full bg-sky-400" style={{ width: `${rofPct}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-12 shrink-0">Range</span>
                          <div className="flex-1 h-1.5 bg-slate-900 rounded-sm overflow-hidden">
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
            <div className="lg:col-span-5 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <h2 className="font-display text-base font-semibold text-slate-100">
                  Team Deathmatch Rules
                </h2>

                <div>
                  <div className="text-xs text-slate-400 mb-1.5">Squad Size</div>
                  <div className="grid grid-cols-3 gap-2">
                    {([3, 4, 5] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => onUpdateConfig({ teamSize: sz })}
                        className={`py-2 rounded-md text-xs font-medium border transition-colors ${
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
                    {([15, 25, 40] as const).map((lim) => (
                      <button
                        key={lim}
                        type="button"
                        onClick={() => onUpdateConfig({ scoreLimit: lim })}
                        className={`py-2 rounded-md text-xs font-medium font-mono tabular-nums border transition-colors ${
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
                        className={`py-2 rounded-md text-xs font-medium capitalize border transition-colors ${
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
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Mouse Sensitivity</span>
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
              </div>

              {/* Controls Quick Reference */}
              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
                <div className="text-slate-200 font-medium mb-1">Controls</div>
                <div className="flex justify-between">
                  <span>Move / Sprint / Jump</span>
                  <span className="font-mono text-slate-300">WASD · Shift · Space</span>
                </div>
                <div className="flex justify-between">
                  <span>Fire / Scope &amp; Optics</span>
                  <span className="font-mono text-slate-300">LMB · RMB or F</span>
                </div>
                <div className="flex justify-between">
                  <span>Scope Magnification</span>
                  <span className="font-mono text-slate-300">V or Z (MK14 / M24)</span>
                </div>
                <div className="flex justify-between">
                  <span>Switch Weapon / Reload</span>
                  <span className="font-mono text-slate-300">1–7 / Wheel · R</span>
                </div>
                <div className="flex justify-between">
                  <span>Frag Grenade (Hold to Cook)</span>
                  <span className="font-mono text-slate-300">G</span>
                </div>
                <div className="flex justify-between">
                  <span>Mount / Dismount .50 Cal HMG</span>
                  <span className="font-mono text-slate-300">E</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onStartMatch}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors shadow-lg cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Deploy to Match
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hud.phase === 'paused') {
    return (
      <div className="fixed inset-0 z-20 flex items-start justify-center p-6 bg-[#070a10]/78 overflow-y-auto">
        <div className="my-auto w-full max-w-4xl rounded-xl bg-[#0d121c]/95 border border-slate-700/80 p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-800">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Match Paused</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust sensitivity or resume combat
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onUpdateConfig({ muted: !config.muted })}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                {config.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {config.muted ? 'Muted' : 'Audio On'}
              </button>
              <button
                type="button"
                onClick={onReturnToLobby}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Exit to Loadout
              </button>
              <button
                type="button"
                onClick={onResumeMatch}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors"
              >
                <Crosshair className="w-4 h-4" />
                Resume Match
              </button>
            </div>
          </div>

          <div className="mb-6 max-w-xs">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Mouse Sensitivity</span>
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
    const victory = hud.winner === 'blue';
    const isDraw = hud.winner === 'draw';
    return (
      <div className="fixed inset-0 z-20 flex items-start justify-center p-6 bg-[#070a10]/80 overflow-y-auto">
        <div className="my-auto w-full max-w-4xl space-y-5">
          <div className="rounded-xl bg-[#0d121c]/95 border border-slate-700/80 p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  victory
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
                  {victory ? 'Vanguard Victory' : isDraw ? 'Match Draw' : 'Syndicate Victory'}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5 font-mono tabular-nums">
                  Final Score: Vanguard {hud.blueScore} — {hud.redScore} Syndicate
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onReturnToLobby}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
              >
                Change Loadout
              </button>
              <button
                type="button"
                onClick={onStartMatch}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors"
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
