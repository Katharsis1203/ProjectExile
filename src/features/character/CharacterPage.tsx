import { useId, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { CHARACTER_CATALOG as catalog } from "../../data/characterCatalog";
import { getFeatBlockReason, getStatBreakdown, learnFeat, trainStat } from "../../engine/character";
import { useModalDialog } from "../../shared/hooks/useModalDialog";
import { getImageUrl } from "../../shared/lib/publicAssetUrl";
import type { PlayerState } from "../../types/player";
import "./CharacterPage.css";

type Props = { player: PlayerState; setPlayer: Dispatch<SetStateAction<PlayerState>>; onClose: () => void; onEquipment: () => void };
const TABS = ["Overview", "Feats & skills", "Equipment", "Journal", "Bonds & discoveries"] as const;
type Tab = typeof TABS[number];

export default function CharacterPage({ player, setPlayer, onClose, onEquipment }: Props) {
  const [tab, setTab] = useState<Tab>("Overview");
  const ref = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  useModalDialog({ containerRef: ref, initialFocusRef: headingRef, onEscape: onClose });
  const data = player.character;
  const progress = data.progression;
  const statIds = Object.keys({ ...player.stats, ...data.skills });
  const statGroups = Object.entries({ ...catalog.statCategories, other: "Other" }).map(([category, label]) => ({
    category, label,
    ids: statIds.filter((id) => {
      const assigned = catalog.stats[id]?.category;
      return (assigned && catalog.statCategories[assigned] ? assigned : "other") === category;
    }),
  })).filter((group) => group.ids.length > 0);
  const quests = Object.entries(data.quests);

  return (
    <div className="character-backdrop">
      <section ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className="character-sheet"
        style={{ backgroundImage: `url("${getImageUrl("parchment.png")}")` }}>
        <header className="character-header">
          <img className="character-portrait" src={getImageUrl(`avatar/portraits/${data.appearance.portrait}`)} alt={player.name} />
          <div className="character-identity">
            <p className="character-eyebrow">Character · Level {progress.level}</p>
            <h1 id={titleId} ref={headingRef} tabIndex={-1}>{player.name}</h1>
            <p>{player.title} · {data.background}</p>
            <p className="character-muted">{data.appearance.description}</p>
          </div>
          <button type="button" className="character-button" onClick={onClose}>Close</button>
        </header>
        <div className="character-progress">
          <span>{progress.experience} experience · Next level at {progress.level * 100}</span>
          <strong>{progress.points} advancement {progress.points === 1 ? "point" : "points"}</strong>
          <progress aria-label="Experience toward next level" max={100} value={progress.experience % 100} />
        </div>
        <nav className="character-tabs" aria-label="Character sections">
          {TABS.map((label) => <button type="button" key={label} aria-pressed={tab === label} onClick={() => label === "Equipment" ? onEquipment() : setTab(label)}>{label}</button>)}
        </nav>
        <div className="character-content">
          {tab === "Overview" && <>
            <div className="character-resources">{player.resources.map((resource) => <div key={resource.id} className={`character-card character-resource character-resource--${resource.tone}`}>
              <div className="character-row"><strong>{resource.label}</strong><span>{resource.value} / {resource.max}</span></div>
              <progress aria-label={resource.label} max={resource.max} value={resource.value} />
            </div>)}</div>
            <h2>Attributes & skills</h2>
            <div className="character-stat-list">{statGroups.map((group) => (
              <section key={group.category} className="character-stat-group" aria-labelledby={`${titleId}-${group.category}`}>
                <h3 id={`${titleId}-${group.category}`} className="character-stat-category">{group.label}</h3>
                {group.ids.map((id) => {
              const stat = getStatBreakdown(player, id);
              const name = catalog.stats[id]?.name ?? id;
              const breakdown = `Base ${stat.base}${stat.modifiers.map((m) => ` · ${m.amount > 0 ? "+" : ""}${m.amount} ${m.source}`).join("")}`;
              return <article key={id} className="character-stat-row">
                <h4>{name}</h4>
                <span className="character-stat-description">{catalog.stats[id]?.description}</span>
                <span className="character-stat-level" tabIndex={0} aria-label={`${name} level ${stat.value}`} aria-describedby={`${titleId}-${id}-breakdown`}>
                  <strong>{stat.value}</strong>
                  <span role="tooltip" id={`${titleId}-${id}-breakdown`} className="character-stat-breakdown">{breakdown}</span>
                </span>
              </article>;
                })}
              </section>
            ))}</div>
            <h2>Conditions</h2>
            <p className="character-muted">Timed conditions count down after story choices. Browsing menus does not advance time.</p>
            {player.effects.length ? <div className="character-grid">{player.effects.map((effect) => <article className="character-card" key={effect.id}>
              <div className="character-row"><h3>{effect.name}</h3><span>{effect.duration}</span></div><p>{effect.effect}</p>
            </article>)}</div> : <p className="character-empty">No active conditions.</p>}
          </>}
          {tab === "Feats & skills" && <>
            <h2>Feats</h2><p className="character-muted">Spend advancement points on permanent abilities. Prerequisites use your base stats.</p>
            <div className="character-grid">{Object.entries(catalog.feats).map(([id, feat]) => {
              const blocked = getFeatBlockReason(player, id);
              return <article className="character-card" key={id}>
                <div className="character-row"><h3>{feat.name}</h3><span>Rank {data.feats[id] ?? 0} / {feat.maxRank}</span></div>
                <p>{feat.description}</p><p className="character-muted">{blocked ?? `Costs ${feat.cost} advancement point.`}</p>
                <button className="character-button" type="button" disabled={Boolean(blocked)} onClick={() => setPlayer((current) => learnFeat(current, id))}>{data.feats[id] ? "Improve feat" : "Learn feat"}</button>
              </article>;
            })}</div>
            <h2>Training</h2><p className="character-muted">One advancement point raises a base attribute or skill by one, up to 20.</p>
            {statGroups.map((group) => <section key={group.category} className="character-training-group" aria-labelledby={`${titleId}-training-${group.category}`}>
              <h3 id={`${titleId}-training-${group.category}`} className="character-stat-category">{group.label}</h3>
              <div className="character-grid">{group.ids.map((id) => {
              const base = data.skills[id] ?? player.stats[id] ?? 0;
              return <div className="character-card character-row" key={id}><span>{catalog.stats[id]?.name ?? id} · {base}</span>
                <button className="character-button" type="button" disabled={progress.points < 1 || base >= 20} onClick={() => setPlayer((current) => trainStat(current, id))}>Train {catalog.stats[id]?.name ?? id}</button>
              </div>;
              })}</div>
            </section>)}
          </>}
          {tab === "Journal" && <>
            <h2>Quests & decisions</h2>
            {!quests.length && <p className="character-empty">No recorded quests yet. Visit Life in the hub and look for The Missing Ledger.</p>}
            {quests.map(([id, quest]) => { const definition = catalog.quests[id]; return <article key={id} className="character-card">
              <div className="character-row"><h3>{definition?.name ?? id}</h3><strong>{definition?.stages[quest.stage] ?? quest.stage}</strong></div>
              {Object.entries(quest.objectives).map(([key, complete]) => <p key={key}>{complete ? "✓" : "○"} {definition?.objectives[key] ?? key}</p>)}
              {Object.entries(quest.decisions).map(([key, value]) => <p key={key}><strong>{definition?.decisions[key]?.label ?? key}: </strong>{definition?.decisions[key]?.values[value] ?? value}</p>)}
            </article>; })}
            <h2>Remembered facts</h2><div className="character-card">{Object.entries(data.flags).map(([id, value]) => <p key={id} className="character-row"><span>{catalog.flags[id]?.name ?? id}</span><strong>{typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</strong></p>)}</div>
          </>}
          {tab === "Bonds & discoveries" && <>
            <h2>Reputation</h2><div className="character-grid">{Object.entries(data.reputation).map(([id, value]) => <div key={id} className="character-card character-row"><h3>{catalog.factions[id]?.name ?? id}</h3><strong>{value > 0 ? "+" : ""}{value}</strong></div>)}</div>
            <h2>Relationships</h2><div className="character-grid">{Object.entries(data.relationships).map(([id, value]) => <div key={id} className="character-card character-row"><h3>{catalog.people[id]?.name ?? id}</h3><strong>{value > 0 ? "+" : ""}{value}</strong></div>)}</div>
            <h2>Discoveries</h2>{data.discoveries.length ? data.discoveries.map((id) => <article className="character-card" key={id}><h3>{catalog.discoveries[id]?.name ?? id}</h3><p>{catalog.discoveries[id]?.description}</p></article>) : <p className="character-empty">Your discoveries will appear here as you explore.</p>}
          </>}
        </div>
      </section>
    </div>
  );
}
