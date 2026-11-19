import React from 'react';
import { X } from 'lucide-react';
import { ScoreboardEntry } from '../game/types';
import { WEAPONS } from '../game/weapons';

interface ScoreboardModalProps {
  entries: ScoreboardEntry[];
  blueScore: number;
  redScore: number;
  scoreLimit: number;
  onClose?: () => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  entries,
  blueScore,
  redScore,
  scoreLimit,
  onClose,
}) => {
  const blueTeam = entries.filter((e) => e.team === 'blue');
  const redTeam = entries.filter((e) => e.team === 'red');

  const renderTeamTable = (title: string, colorClass: string, rows: ScoreboardEntry[]) => (
    <div className="flex-1 min-w-0 overflow-x-auto touch-pan-x">
      <div className="flex items-baseline justify-between pb-2 mb-2 border-b border-slate-700/80">
        <span className={`font-display text-sm font-semibold tracking-wide ${colorClass}`}>
          {title}
        </span>
        <span className="font-mono text-xs text-slate-400 tabular-nums">
          {rows.length} Combatants
        </span>
      </div>
      <table className="w-full min-w-[290px] text-left border-collapse">
        <thead>
          <tr className="text-[11px] text-slate-400 border-b border-slate-800/80">
            <th className="py-1.5 font-medium">Callsign</th>
            <th className="py-1.5 font-medium">Loadout</th>
            <th className="py-1.5 font-medium text-right w-10">K</th>
            <th className="py-1.5 font-medium text-right w-10">D</th>
            <th className="py-1.5 font-medium text-right w-10">A</th>
            <th className="py-1.5 font-medium text-right w-12">K/D</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const kd = row.deaths === 0 ? row.kills.toFixed(2) : (row.kills / row.deaths).toFixed(2);
            const weaponShort = WEAPONS[row.weaponId]?.shortName ?? row.weaponId;
            return (
              <tr
                key={row.id}
                className={`text-xs border-b border-slate-800/50 ${
                  row.isPlayer ? 'bg-slate-800/75 text-white font-semibold' : 'text-slate-300'
                }`}
              >
                <td className="py-1.5 pr-2 truncate max-w-[140px] sm:max-w-[165px]">
                  {row.name}
                  {row.isHuman && !row.isPlayer && (
                    <span className="ml-1.5 text-[10px] font-mono text-amber-400">PLAYER</span>
                  )}
                  {!row.alive && (
                    <span className="ml-1.5 text-[10px] font-normal text-slate-500">MIA</span>
                  )}
                </td>
                <td className="py-1.5 pr-2 text-[11px] text-slate-400 whitespace-nowrap">
                  {weaponShort}
                </td>
                <td className="py-1.5 text-right font-mono tabular-nums">{row.kills}</td>
                <td className="py-1.5 text-right font-mono tabular-nums text-slate-400">{row.deaths}</td>
                <td className="py-1.5 text-right font-mono tabular-nums text-slate-400">{row.assists}</td>
                <td className="py-1.5 text-right font-mono tabular-nums text-amber-400">{kd}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto rounded-xl bg-[#0d121c]/95 border border-slate-700/80 p-3.5 sm:p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-white">Team Deathmatch Standings</h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">First team to {scoreLimit} eliminations wins</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 font-mono tabular-nums">
          <div className="text-right">
            <div className="text-[10px] sm:text-[11px] text-blue-400">Vanguard</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{blueScore}</div>
          </div>
          <span className="text-slate-600 text-lg">/</span>
          <div className="text-left">
            <div className="text-[10px] sm:text-[11px] text-red-400">Syndicate</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{redScore}</div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
              aria-label="Close Scoreboard"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[58vh] overflow-y-auto touch-pan-y pr-1">
        {renderTeamTable('Vanguard (Blue)', 'text-blue-400', blueTeam)}
        {renderTeamTable('Syndicate (Red)', 'text-red-400', redTeam)}
      </div>
    </div>
  );
};
