import React, { useMemo, useState } from 'react';
import { Check, Package, Search, Shield, X } from 'lucide-react';
import { LoadoutSlots, WeaponCategory, WeaponId } from '../game/types';
import { WEAPON_CATEGORIES, WEAPON_ORDER, WEAPONS } from '../game/weapons';

interface ArsenalModalProps {
  arsenalName: string;
  loadout: LoadoutSlots;
  activeSlot: 0 | 1 | 2;
  carriedBelts: number;
  maxCarriedBelts: number;
  onEquipSlot: (slotIndex: 0 | 1 | 2, weaponId: WeaponId) => void;
  onRefillBelts: () => void;
  onClose: () => void;
}

const SLOT_LABELS: Array<{ idx: 0 | 1 | 2; title: string; hint: string }> = [
  { idx: 0, title: 'Slot [1] Primary', hint: 'Rifles, SMGs, LMGs, Snipers' },
  { idx: 1, title: 'Slot [2] Secondary', hint: 'Sidearms, PDWs, Shotguns' },
  { idx: 2, title: 'Slot [3] Heavy', hint: 'RPGs, Guided Missiles, LMGs' },
];

export const ArsenalModal: React.FC<ArsenalModalProps> = ({
  arsenalName,
  loadout,
  activeSlot,
  carriedBelts,
  maxCarriedBelts,
  onEquipSlot,
  onRefillBelts,
  onClose,
}) => {
  const [targetSlot, setTargetSlot] = useState<0 | 1 | 2>(activeSlot);
  const [category, setCategory] = useState<WeaponCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const filteredWeapons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WEAPON_ORDER.filter((id) => {
      const spec = WEAPONS[id];
      if (category !== 'all' && spec.category !== category) return false;
      if (!q) return true;
      return (
        spec.name.toLowerCase().includes(q) ||
        spec.caliber.toLowerCase().includes(q) ||
        spec.role.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-2 sm:p-4 bg-[#070a10]/82">
      <div className="w-full max-w-5xl max-h-[92dvh] flex flex-col rounded-xl bg-[#0d121c] border border-cyan-500/45 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-3 sm:px-5 sm:py-4 border-b border-slate-800 bg-[#0b1019]">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-[11px] sm:text-xs font-mono uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              {arsenalName} · Field Armory
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
              50-Weapon Tactical Arsenal
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefillBelts}
              className="min-h-[40px] flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#121824] hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>
                Heavy Belts ({carriedBelts}/{maxCarriedBelts})
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Resupply &amp; Deploy
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              aria-label="Close Arsenal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carried 3-Slot Strip */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-[#101623] border-b border-slate-800 grid grid-cols-3 gap-2">
          {SLOT_LABELS.map((s) => {
            const equipped = WEAPONS[loadout[s.idx]];
            const editing = targetSlot === s.idx;
            return (
              <button
                key={s.idx}
                type="button"
                onClick={() => setTargetSlot(s.idx)}
                className={`text-left px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-lg border transition-colors cursor-pointer ${
                  editing
                    ? 'bg-cyan-500/15 border-cyan-400 text-white'
                    : 'bg-[#0d121c] border-slate-800 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="font-mono font-bold text-amber-400">{s.title}</span>
                  <span className="hidden sm:inline text-slate-400">{editing ? 'Assigning' : s.hint}</span>
                </div>
                <div className="font-display text-xs sm:text-sm font-bold text-white mt-0.5 truncate">
                  {equipped.name}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {equipped.caliber} · {equipped.magSize} rd
                </div>
              </button>
            );
          })}
        </div>

        {/* Category Filter + Search */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {WEAPON_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  category === cat.id
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-[#121824] text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter weapons or caliber..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#121824] border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
            />
          </div>
        </div>

        {/* Weapons Grid */}
        <div className="flex-1 overflow-y-auto touch-pan-y p-3.5 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredWeapons.map((wid) => {
            const w = WEAPONS[wid];
            const equippedInSlot = loadout.indexOf(wid);
            const isTargetEquipped = equippedInSlot === targetSlot;
            const dmgPct = Math.min(100, Math.round(((w.damage * w.pellets) / 220) * 100));
            const rofPct = Math.min(100, Math.round((w.rpm / 1150) * 100));
            const rngPct = Math.min(100, Math.round((w.range / 320) * 100));

            return (
              <button
                key={wid}
                type="button"
                onClick={() => onEquipSlot(targetSlot, wid)}
                className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                  isTargetEquipped
                    ? 'bg-cyan-500/15 border-cyan-400 text-white'
                    : equippedInSlot !== -1
                    ? 'bg-slate-800/80 border-amber-500/50 text-white'
                    : 'bg-[#121824] border-slate-800 hover:border-slate-600 text-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display text-sm font-bold text-white truncate">
                      {w.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {w.caliber} · {w.fireMode} · {w.magSize}/{w.reserveMax}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {equippedInSlot !== -1 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[10px] font-mono text-amber-300">
                        Slot {equippedInSlot + 1}
                      </span>
                    )}
                    {w.guidance === 'lock_on' && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-[10px] font-mono text-sky-300">
                        LOCK-ON
                      </span>
                    )}
                    {w.guidance === 'laser_guided' && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[10px] font-mono text-cyan-300">
                        SACLOS
                      </span>
                    )}
                    {w.suppressed && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] font-mono text-emerald-300">
                        SILENCED
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 mt-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-11 shrink-0">Power</span>
                    <div className="flex-1 h-1.5 bg-slate-900 rounded-sm overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${dmgPct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-11 shrink-0">ROF</span>
                    <div className="flex-1 h-1.5 bg-slate-900 rounded-sm overflow-hidden">
                      <div className="h-full bg-sky-400" style={{ width: `${rofPct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-11 shrink-0">Range</span>
                    <div className="flex-1 h-1.5 bg-slate-900 rounded-sm overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${rngPct}%` }} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-2.5 bg-[#0b1019] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            Arsenal equips carried weapons &amp; restocks Heavy MG/Artillery Belts (4/4).
          </span>
          <span className="font-mono">{filteredWeapons.length} weapons shown</span>
        </div>
      </div>
    </div>
  );
};
