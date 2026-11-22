import React from 'react';
import { WeaponSpec } from '../game/types';

interface WeaponArtworkProps {
  weapon: WeaponSpec;
  className?: string;
}

function toHexColor(num: number | undefined, fallback: string): string {
  if (typeof num !== 'number' || Number.isNaN(num)) return fallback;
  return `#${num.toString(16).padStart(6, '0')}`;
}

export const WeaponArtwork: React.FC<WeaponArtworkProps> = ({ weapon, className = '' }) => {
  const metal = toHexColor(weapon.finishHex, '#2c3645');
  const furniture = toHexColor(weapon.furnitureHex, '#3b4454');
  const accent = weapon.accentHex || '#f59e0b';
  const darkMetal = '#121822';
  const brightEdge = '#64748b';
  const opticGlass = '#38bdf8';

  const bScale = weapon.barrelScale ?? 1.0;
  const barrelExtend = Math.max(-12, Math.min(26, (bScale - 1) * 28));
  const muzzleX = 205 + barrelExtend;

  const renderOptic = (x: number, y: number) => {
    if (weapon.optic === 'sniper') {
      return (
        <g>
          <rect x={x - 2} y={y - 3} width={4} height={4} fill={darkMetal} />
          <rect x={x + 22} y={y - 3} width={4} height={4} fill={darkMetal} />
          <rect x={x - 14} y={y - 12} width={52} height={9} rx={2} fill="#18202c" stroke={brightEdge} strokeWidth={0.8} />
          <polygon points={`${x + 38},${y - 12} ${x + 48},${y - 14} ${x + 48},${y - 1} ${x + 38},${y - 3}`} fill="#1e293b" stroke={brightEdge} strokeWidth={0.8} />
          <rect x={x + 8} y={y - 14.5} width={8} height={3} rx={0.6} fill={accent} opacity={0.85} />
          <line x1={x + 48} y1={y - 13} x2={x + 48} y2={y - 2} stroke={opticGlass} strokeWidth={1.6} />
        </g>
      );
    }
    if (weapon.optic === 'acog') {
      return (
        <g>
          <rect x={x} y={y - 3} width={16} height={3} fill={darkMetal} />
          <rect x={x - 4} y={y - 10} width={24} height={7} rx={1.5} fill="#1b2432" stroke={brightEdge} strokeWidth={0.8} />
          <polygon points={`${x + 20},${y - 10} ${x + 26},${y - 11.5} ${x + 26},${y - 1.5} ${x + 20},${y - 3}`} fill="#243042" stroke={brightEdge} strokeWidth={0.7} />
          <rect x={x + 2} y={y - 11.5} width={12} height={1.8} rx={0.6} fill="#ef4444" />
        </g>
      );
    }
    if (weapon.optic === 'holo') {
      return (
        <g>
          <rect x={x} y={y - 3} width={16} height={3} fill={darkMetal} />
          <rect x={x + 1} y={y - 10} width={14} height={7} rx={1.2} fill="#1b2432" stroke={brightEdge} strokeWidth={0.8} />
          <rect x={x + 5} y={y - 8} width={6} height={4} fill={opticGlass} opacity={0.45} />
        </g>
      );
    }
    if (weapon.optic === 'reflex') {
      return (
        <g>
          <rect x={x} y={y - 2.5} width={12} height={2.5} fill={darkMetal} />
          <path d={`M ${x + 2} ${y - 2.5} L ${x + 2} ${y - 9} Q ${x + 6} ${y - 11} ${x + 10} ${y - 9} L ${x + 10} ${y - 2.5}`} fill="none" stroke={brightEdge} strokeWidth={1.3} />
          <circle cx={x + 6} cy={y - 6} r={1.2} fill="#ef4444" />
        </g>
      );
    }
    if (weapon.optic === 'pgo') {
      return (
        <g>
          <rect x={x} y={y - 9} width={18} height={8} rx={1.5} fill="#1f2937" stroke={brightEdge} strokeWidth={0.8} />
          <polygon points={`${x - 6},${y - 8} ${x},${y - 9} ${x},${y - 1} ${x - 6},${y - 2}`} fill={darkMetal} />
          <line x1={x + 18} y1={y - 8} x2={x + 18} y2={y - 2} stroke={opticGlass} strokeWidth={1.6} />
        </g>
      );
    }
    if (weapon.optic === 'thermal_lock') {
      return (
        <g>
          <rect x={x - 8} y={y - 18} width={34} height={18} rx={3} fill="#283526" stroke="#64748b" strokeWidth={0.9} />
          <circle cx={x + 19} cy={y - 9} r={5} fill="#0f172a" stroke={opticGlass} strokeWidth={1.1} />
          <rect x={x - 3} y={y - 13} width={12} height={7} rx={1} fill="#1e293b" stroke={accent} strokeWidth={0.7} />
        </g>
      );
    }
    // Iron sights
    return (
      <g>
        <rect x={x} y={y - 3.5} width={4} height={3.5} fill={darkMetal} />
        <rect x={x + 32} y={y - 4.5} width={3} height={4.5} fill={darkMetal} />
      </g>
    );
  };

  const renderMagazine = (x: number, y: number, compact = false) => {
    const style = weapon.magStyle;
    if (!style || style === 'none') return null;
    if (style === 'drum') {
      return (
        <g>
          <rect x={x - 5} y={y} width={10} height={7} fill={darkMetal} />
          <circle cx={x} cy={y + 16} r={13} fill="#18202c" stroke={brightEdge} strokeWidth={1} />
          <circle cx={x} cy={y + 16} r={6} fill={darkMetal} stroke={accent} strokeWidth={0.6} opacity={0.75} />
        </g>
      );
    }
    if (style === 'curved') {
      return (
        <path
          d={`M ${x - 6} ${y} L ${x + 5} ${y} Q ${x + 10} ${y + 16} ${x + 16} ${y + (compact ? 22 : 28)} L ${x + 5} ${y + (compact ? 25 : 31)} Q ${x - 1} ${y + 16} ${x - 6} ${y} Z`}
          fill={weapon.chassis === 'ar_ak' && weapon.id !== 'galil_ace' ? '#92400e' : '#1f2937'}
          stroke={brightEdge}
          strokeWidth={0.8}
        />
      );
    }
    if (style === 'box') {
      const h = weapon.category === 'lmg' ? 22 : 24;
      const w = weapon.category === 'lmg' ? 22 : 12;
      return (
        <rect
          x={x - w / 2}
          y={y}
          width={w}
          height={h}
          rx={1.5}
          transform={weapon.category === 'lmg' ? undefined : `rotate(-10 ${x} ${y})`}
          fill={weapon.category === 'lmg' ? '#2c3d28' : '#1e2736'}
          stroke={brightEdge}
          strokeWidth={0.85}
        />
      );
    }
    return null;
  };

  const renderWeapon = () => {
    // 1. PISTOLS
    if (weapon.chassis === 'pistol') {
      const isHeavy = weapon.id === 'deagle50';
      const slideLen = isHeavy ? 96 : 80 + barrelExtend * 0.4;
      return (
        <g transform="translate(8, 2)">
          {/* Frame & Trigger Guard */}
          <rect x={92} y={40} width={slideLen - 6} height={11} rx={2} fill={furniture} stroke={brightEdge} strokeWidth={0.7} />
          <path d="M 102 51 L 122 51 L 118 65 L 106 65 Z" fill="none" stroke={furniture} strokeWidth={2.2} />
          {/* Angled Pistol Grip + Extended Mag Base */}
          <polygon points="84,48 103,48 94,86 73,83" fill={furniture} stroke={brightEdge} strokeWidth={0.8} />
          <polygon points="75,83 92,86 90,92 73,89" fill={darkMetal} stroke={accent} strokeWidth={0.7} />
          {/* Slide */}
          <rect x={85} y={26} width={slideLen} height={15} rx={2} fill={metal} stroke={brightEdge} strokeWidth={0.9} />
          {/* Slide Serrations */}
          <g stroke={darkMetal} strokeWidth={1.2}>
            <line x1={91} y1={28} x2={91} y2={39} />
            <line x1={95} y1={28} x2={95} y2={39} />
            <line x1={99} y1={28} x2={99} y2={39} />
          </g>
          {/* Ejection Port */}
          <rect x={122} y={28} width={16} height={5} rx={1} fill={darkMetal} />
          {/* Suppressor or Barrel Tip */}
          {weapon.suppressed ? (
            <rect x={85 + slideLen} y={28} width={44} height={11} rx={2.5} fill="#141923" stroke={brightEdge} strokeWidth={0.8} />
          ) : (
            <rect x={85 + slideLen} y={31} width={9} height={6} fill="#94a3b8" />
          )}
          {/* Optic */}
          {weapon.optic === 'reflex' ? (
            renderOptic(106, 26)
          ) : (
            <g>
              <rect x={88} y={22.5} width={5} height={3.5} fill={darkMetal} />
              <rect x={85 + slideLen - 7} y={22.5} width={4} height={3.5} fill={accent} />
            </g>
          )}
        </g>
      );
    }

    // 2. RPG-7 LAUNCHER
    if (weapon.chassis === 'launcher_rpg') {
      return (
        <g>
          {/* Rear Exhaust Bell */}
          <polygon points="18,41 36,44 36,54 18,57" fill={darkMetal} stroke={brightEdge} strokeWidth={0.8} />
          {/* Main Steel Tube + Wooden Heatguard Center */}
          <rect x={36} y={45} width={156} height={8} fill={metal} stroke={brightEdge} strokeWidth={0.8} />
          <rect x={76} y={43} width={56} height={12} rx={2} fill={furniture} stroke={brightEdge} strokeWidth={0.8} />
          {/* Pistol Grips */}
          <polygon points="116,55 126,55 123,77 113,77" fill={darkMetal} stroke={brightEdge} strokeWidth={0.7} />
          <polygon points="148,53 157,53 154,73 145,73" fill={darkMetal} stroke={brightEdge} strokeWidth={0.7} />
          {/* PGO-7 Side Optic */}
          {renderOptic(122, 43)}
          {/* Iconic Conical PG-7V Warhead protruding at front */}
          <rect x={192} y={46} width={14} height={6} fill="#36462b" />
          <polygon points="206,45 224,38 224,60 206,53" fill="#465938" stroke={brightEdge} strokeWidth={0.8} />
          <polygon points="224,38 250,47 250,51 224,60" fill="#526942" stroke={brightEdge} strokeWidth={0.8} />
          <rect x={249} y={47.5} width={6} height={3} fill="#94a3b8" />
        </g>
      );
    }

    // 3. GUIDED / AT4 LAUNCHERS
    if (weapon.chassis === 'launcher_guided') {
      const isJavelin = weapon.id === 'fgm148_javelin';
      const isStinger = weapon.id === 'fim92_stinger';
      const isAt4 = weapon.id === 'at4_cs';
      return (
        <g>
          {/* Front & Rear Foam Endcaps */}
          <rect x={28} y={41} width={12} height={20} rx={2} fill="#18202c" stroke={brightEdge} strokeWidth={0.8} />
          <rect x={40} y={43} width={166} height={16} rx={2} fill={furniture} stroke={brightEdge} strokeWidth={0.9} />
          <rect x={206} y={40} width={16} height={22} rx={2} fill="#18202c" stroke={brightEdge} strokeWidth={0.8} />
          {/* Hazard Identification Band */}
          <rect x={176} y={43} width={10} height={16} fill={isAt4 ? '#eab308' : accent} opacity={0.88} />
          {/* Carrying Sling & Grips */}
          <polygon points="122,59 133,59 129,80 118,80" fill={darkMetal} stroke={brightEdge} strokeWidth={0.7} />
          {isJavelin ? (
            renderOptic(134, 43)
          ) : isStinger ? (
            <g>
              <rect x={172} y={29} width={22} height={14} rx={1.5} fill="#2f3e2b" stroke={brightEdge} strokeWidth={0.8} />
              <line x1={177} y1={33} x2={190} y2={33} stroke={accent} strokeWidth={1.2} />
            </g>
          ) : (
            renderOptic(136, 43)
          )}
        </g>
      );
    }

    // 4. SNIPER RIFLES (BOLT & HEAVY ANTI-MATERIEL)
    if (weapon.chassis === 'sniper_bolt' || weapon.chassis === 'sniper_heavy') {
      const isHeavy = weapon.chassis === 'sniper_heavy';
      const isClassicWood = weapon.id === 'kar98k';
      const isBullpupSniper = weapon.id === 'dsr50';
      return (
        <g>
          {/* Stock */}
          {isBullpupSniper ? (
            <polygon points="24,42 82,42 82,60 28,64" fill={metal} stroke={brightEdge} strokeWidth={0.8} />
          ) : (
            <polygon points="16,44 74,44 72,62 18,68" fill={furniture} stroke={brightEdge} strokeWidth={0.85} />
          )}
          {!isClassicWood && (
            <rect x={32} y={40} width={24} height={4} rx={1} fill={darkMetal} />
          )}
          {/* Grip */}
          <polygon points="78,56 91,56 85,78 73,76" fill={isClassicWood ? furniture : darkMetal} stroke={brightEdge} strokeWidth={0.7} />
          {/* Receiver */}
          <rect x={72} y={40} width={68} height={15} rx={2} fill={metal} stroke={brightEdge} strokeWidth={0.9} />
          {/* Bolt Handle */}
          <circle cx={96} cy={47} r={3.2} fill="#94a3b8" />
          {/* Handguard */}
          {isHeavy ? (
            <rect x={140} y={41} width={44} height={12} rx={1.5} fill={metal} stroke={brightEdge} strokeWidth={0.8} />
          ) : (
            <rect x={140} y={44} width={42} height={9} rx={1.5} fill={furniture} stroke={brightEdge} strokeWidth={0.7} />
          )}
          {/* Long Precision Barrel */}
          <rect x={140} y={44} width={muzzleX - 134} height={4.5} fill="#475569" stroke={brightEdge} strokeWidth={0.5} />
          {/* Heavy Dual-Baffle Muzzle Brake or Suppressor */}
          {weapon.suppressed ? (
            <rect x={muzzleX} y={41.5} width={30} height={9.5} rx={2} fill={darkMetal} stroke={brightEdge} strokeWidth={0.7} />
          ) : isHeavy ? (
            <g>
              <rect x={muzzleX + 4} y={40} width={18} height={12} rx={1} fill={darkMetal} stroke={brightEdge} strokeWidth={0.9} />
              <line x1={muzzleX + 10} y1={41} x2={muzzleX + 10} y2={51} stroke={accent} strokeWidth={1.2} />
              <line x1={muzzleX + 16} y1={41} x2={muzzleX + 16} y2={51} stroke={accent} strokeWidth={1.2} />
            </g>
          ) : (
            <rect x={muzzleX + 4} y={42.5} width={10} height={7} rx={1} fill={darkMetal} />
          )}
          {/* Bipod Folded / Deployed */}
          <line x1={174} y1={52} x2={182} y2={76} stroke={brightEdge} strokeWidth={2.2} strokeLinecap="round" />
          <line x1={174} y1={52} x2={169} y2={76} stroke={darkMetal} strokeWidth={2} strokeLinecap="round" />
          {/* Box Mag */}
          {isBullpupSniper ? renderMagazine(62, 56, true) : renderMagazine(115, 55)}
          {/* High-Power Sniper Scope */}
          {renderOptic(84, 40)}
        </g>
      );
    }

    // 5. SHOTGUNS
    if (weapon.chassis === 'shotgun_pump' || weapon.chassis === 'shotgun_auto') {
      const isAuto = weapon.chassis === 'shotgun_auto';
      return (
        <g>
          <polygon points="20,44 76,43 74,58 22,66" fill={furniture} stroke={brightEdge} strokeWidth={0.85} />
          <polygon points="75,55 88,55 82,76 70,74" fill={darkMetal} stroke={brightEdge} strokeWidth={0.7} />
          <rect x={74} y={39} width={60} height={17} rx={2} fill={metal} stroke={brightEdge} strokeWidth={0.9} />
          {/* Barrel + Underbarrel Tube */}
          <rect x={134} y={40} width={muzzleX - 134} height={5.5} fill={metal} stroke={brightEdge} strokeWidth={0.6} />
          {!isAuto && (
            <>
              <rect x={134} y={48} width={muzzleX - 144} height={4.5} fill="#334155" />
              {/* Pump Forend */}
              <rect x={144} y={46} width={34} height={9} rx={2} fill={furniture} stroke={brightEdge} strokeWidth={0.8} />
            </>
          )}
          {isAuto && (
            <>
              <rect x={134} y={41} width={44} height={13} rx={1.5} fill={furniture} stroke={brightEdge} strokeWidth={0.7} />
              {renderMagazine(116, 56)}
            </>
          )}
          {renderOptic(86, 39)}
        </g>
      );
    }

    // 6. LMGs (Belt-Fed / Heavy Drum)
    if (weapon.chassis === 'lmg_belt') {
      const isMg42 = weapon.id === 'mg42';
      return (
        <g>
          <polygon points="18,42 72,41 70,58 20,64" fill={furniture} stroke={brightEdge} strokeWidth={0.85} />
          <polygon points="76,56 89,56 83,78 72,76" fill={darkMetal} stroke={brightEdge} strokeWidth={0.75} />
          {/* Receiver + Feed Cover */}
          <rect x={70} y={37} width={68} height={20} rx={2} fill={metal} stroke={brightEdge} strokeWidth={0.95} />
          <rect x={76} y={34} width={46} height={4} rx={1} fill="#334155" />
          {/* Perforated Jacket or Quad-Rail Handguard */}
          <rect x={138} y={39} width={48} height={14} rx={2} fill={isMg42 ? metal : furniture} stroke={brightEdge} strokeWidth={0.8} />
          {isMg42 && (
            <g fill={darkMetal}>
              <circle cx={146} cy={46} r={2} />
              <circle cx={155} cy={46} r={2} />
              <circle cx={164} cy={46} r={2} />
              <circle cx={173} cy={46} r={2} />
            </g>
          )}
          {/* Heavy Fluted Barrel & Flash Hider */}
          <rect x={186} y={42.5} width={Math.max(18, muzzleX - 186)} height={5.5} fill="#475569" />
          <rect x={muzzleX} y={41} width={12} height={8.5} rx={1} fill={darkMetal} />
          {/* Brass Ammo Belt Link Visible Entering Side */}
          <rect x={102} y={44} width={16} height={6} fill="#d97706" rx={1} />
          {/* Deployed Bipod */}
          <line x1={174} y1={53} x2={182} y2={76} stroke={brightEdge} strokeWidth={2.2} strokeLinecap="round" />
          <line x1={174} y1={53} x2={168} y2={76} stroke={darkMetal} strokeWidth={2} strokeLinecap="round" />
          {renderMagazine(112, 57)}
          {renderOptic(84, 34)}
        </g>
      );
    }

    // 7. BULLPUPS (FAMAS / AUG A3)
    if (weapon.chassis === 'bullpup') {
      const isFamas = weapon.id === 'famas_f1';
      return (
        <g>
          {/* Integrated Rear Body + Magazine behind grip */}
          <rect x={34} y={39} width={118} height={20} rx={3} fill={metal} stroke={brightEdge} strokeWidth={0.9} />
          <rect x={32} y={40} width={8} height={22} rx={1.5} fill={furniture} />
          {/* Rear Curved Mag */}
          {renderMagazine(60, 59, true)}
          {/* Trigger & Guard + Vertical Foregrip */}
          <polygon points="104,59 116,59 111,81 99,79" fill={furniture} stroke={brightEdge} strokeWidth={0.75} />
          <rect x={144} y={59} width={8} height={17} rx={1.5} fill={furniture} />
          {/* Top Carry Handle (FAMAS) or AUG Scope */}
          {isFamas ? (
            <path d="M 52 39 L 58 28 L 146 28 L 152 39" fill="none" stroke={metal} strokeWidth={4.5} />
          ) : null}
          {/* Barrel + Flash Hider */}
          <rect x={152} y={43} width={muzzleX - 152} height={5} fill="#475569" />
          <rect x={muzzleX} y={41.5} width={10} height={8} rx={1} fill={darkMetal} />
          {renderOptic(90, isFamas ? 28 : 39)}
        </g>
      );
    }

    // 8. AK FAMILY (AK-74 / AKM / Galil / RPK)
    if (weapon.chassis === 'ar_ak') {
      return (
        <g>
          <polygon points="18,45 72,43 70,58 20,66" fill={furniture} stroke={brightEdge} strokeWidth={0.85} />
          <polygon points="75,55 88,55 82,78 70,76" fill={furniture} stroke={brightEdge} strokeWidth={0.75} />
          <rect x={72} y={40} width={64} height={16} rx={1.5} fill={metal} stroke={brightEdge} strokeWidth={0.9} />
          {/* Signature Curved Gas Block + Handguard */}
          <rect x={136} y={41} width={40} height={13} rx={2} fill={furniture} stroke={brightEdge} strokeWidth={0.8} />
          <rect x={136} y={37} width={34} height={4} fill="#334155" />
          <polygon points="176,40 183,35 186,44 176,44" fill={darkMetal} />
          {/* Barrel + Slant Brake */}
          <rect x={176} y={43} width={muzzleX - 176} height={4.5} fill="#475569" />
          <rect x={muzzleX} y={41.5} width={11} height={7.5} rx={1} fill={darkMetal} />
          {renderMagazine(118, 56)}
          {renderOptic(88, 40)}
        </g>
      );
    }

    // 9. SMGs & PDWs (MP5, UMP45, P90, Vector, MP7, Bizon, Thompson)
    if (weapon.chassis === 'smg_mp5' || weapon.chassis === 'smg_pdw') {
      const isP90 = weapon.id === 'p90';
      const isBizon = weapon.id === 'pp19_bizon';
      const isVector = weapon.id === 'vector45';
      const isThompson = weapon.id === 'thompson_m1';

      if (isP90) {
        return (
          <g>
            <path d="M 38 40 L 166 40 L 172 60 L 128 60 L 122 76 L 106 76 L 110 60 L 82 60 L 76 76 L 42 76 Z" fill={metal} stroke={brightEdge} strokeWidth={0.9} />
            {/* Signature P90 Top Horizontal Clear Mag */}
            <rect x={68} y={33} width={86} height={7} rx={2} fill="#38bdf8" opacity={0.35} stroke={brightEdge} strokeWidth={0.8} />
            <rect x={170} y={44} width={18} height={6} fill="#475569" />
            {renderOptic(118, 33)}
          </g>
        );
      }

      return (
        <g>
          {/* Compact Folding/Sliding Stock */}
          {isThompson ? (
            <polygon points="22,45 76,43 74,58 24,66" fill={furniture} stroke={brightEdge} strokeWidth={0.85} />
          ) : (
            <>
              <rect x={30} y={42} width={44} height={5} rx={1} fill={darkMetal} stroke={brightEdge} strokeWidth={0.7} />
              <rect x={26} y={40} width={7} height={18} rx={1.5} fill={furniture} />
            </>
          )}
          <polygon points="78,55 90,55 84,76 73,74" fill={furniture} stroke={brightEdge} strokeWidth={0.75} />
          <rect x={74} y={39} width={66} height={16} rx={2} fill={metal} stroke={brightEdge} strokeWidth={0.9} />
          {/* Handguard */}
          <rect x={140} y={41} width={36} height={12} rx={2} fill={furniture} stroke={brightEdge} strokeWidth={0.75} />
          {isVector && (
            <polygon points="110,55 138,55 132,74 114,74" fill={furniture} stroke={brightEdge} strokeWidth={0.8} />
          )}
          {isBizon && (
            <rect x={118} y={53} width={54} height={11} rx={5} fill="#1f2937" stroke={brightEdge} strokeWidth={0.85} />
          )}
          {!isBizon && renderMagazine(116, 55, true)}
          {/* Barrel or Integral Suppressor */}
          {weapon.suppressed ? (
            <rect x={176} y={40.5} width={34} height={10} rx={2.5} fill="#141923" stroke={brightEdge} strokeWidth={0.8} />
          ) : (
            <rect x={176} y={43} width={18} height={5} fill="#475569" />
          )}
          {renderOptic(88, 39)}
        </g>
      );
    }

    // 10. NATO ASSAULT RIFLES & DMRs (Default Precision Carbine / Battle Rifle)
    const isDmr = weapon.chassis === 'dmr';
    return (
      <g>
        {/* Adjustable Stock */}
        <polygon points="20,41 72,41 72,54 24,63" fill={furniture} stroke={brightEdge} strokeWidth={0.85} />
        <rect x={54} y={42} width={18} height={7} fill={darkMetal} />
        {/* Pistol Grip */}
        <polygon points="78,56 90,56 84,78 73,76" fill={furniture} stroke={brightEdge} strokeWidth={0.75} />
        {/* Upper & Lower Receiver */}
        <rect x={72} y={39} width={62} height={17} rx={2} fill={metal} stroke={brightEdge} strokeWidth={0.9} />
        <rect x={76} y={41} width={48} height={4} fill="#334155" opacity={0.6} />
        {/* Modular Quad-Rail Handguard */}
        <rect x={134} y={40} width={isDmr ? 52 : 44} height={13} rx={1.5} fill={furniture} stroke={brightEdge} strokeWidth={0.8} />
        {/* Handguard Rail Vent Slots */}
        <g stroke={darkMetal} strokeWidth={1.3}>
          <line x1={142} y1={46} x2={147} y2={46} />
          <line x1={152} y1={46} x2={157} y2={46} />
          <line x1={162} y1={46} x2={167} y2={46} />
          {isDmr && <line x1={172} y1={46} x2={177} y2={46} />}
        </g>
        {/* Vertical Foregrip on CQB Carbines */}
        {!isDmr && <rect x={152} y={53} width={6} height={12} rx={1.5} fill={darkMetal} />}
        {/* Barrel + Suppressor / Flash Hider */}
        <rect x={isDmr ? 186 : 178} y={43} width={Math.max(16, muzzleX - (isDmr ? 186 : 178))} height={4.5} fill="#475569" />
        {weapon.suppressed ? (
          <rect x={muzzleX} y={41} width={30} height={9.5} rx={2} fill={darkMetal} stroke={brightEdge} strokeWidth={0.75} />
        ) : (
          <rect x={muzzleX} y={42} width={11} height={6.5} rx={1} fill={darkMetal} />
        )}
        {/* Magazine */}
        {renderMagazine(114, 56)}
        {/* Optic */}
        {renderOptic(84, 39)}
      </g>
    );
  };

  return (
    <div className={`relative flex items-center justify-center rounded-md bg-[#0a0f18] border border-slate-800/90 overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 264 96"
        className="w-full h-full"
        aria-label={`${weapon.name} silhouette`}
      >
        {/* Subtle technical blueprint grid */}
        <g stroke="#1e293b" strokeWidth="0.6" opacity="0.55">
          <line x1="0" y1="24" x2="264" y2="24" />
          <line x1="0" y1="48" x2="264" y2="48" />
          <line x1="0" y1="72" x2="264" y2="72" />
          <line x1="66" y1="0" x2="66" y2="96" />
          <line x1="132" y1="0" x2="132" y2="96" />
          <line x1="198" y1="0" x2="198" y2="96" />
        </g>
        {/* Accent baseline indicator */}
        <line x1="10" y1="88" x2="48" y2="88" stroke={accent} strokeWidth="1.5" opacity="0.8" />
        {renderWeapon()}
      </svg>
    </div>
  );
};
