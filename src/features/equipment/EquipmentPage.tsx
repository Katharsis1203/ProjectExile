import { useId, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { CHARACTER_CATALOG as catalog } from "../../data/characterCatalog";
import { equipItem, getEffectiveStats, getEquipmentBlockReason, isEquipmentSlotCompatible, unequipItem } from "../../engine/character";
import { useModalDialog } from "../../shared/hooks/useModalDialog";
import { getImageUrl } from "../../shared/lib/publicAssetUrl";
import type { PlayerState } from "../../types/player";
import "../character/CharacterPage.css";
import "./EquipmentPage.css";

type Props = { player: PlayerState; setPlayer: Dispatch<SetStateAction<PlayerState>>; onClose: () => void; onCharacter: () => void; onInventory: () => void };
const signed = (value: number) => `${value > 0 ? "+" : ""}${value}`;

export default function EquipmentPage({ player, setPlayer, onClose, onCharacter, onInventory }: Props) {
  const [slot, setSlot] = useState("body");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const ref = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  useModalDialog({ containerRef: ref, initialFocusRef: heading, onEscape: onClose });
  const { instances, equipment } = player.character;
  const candidates = Object.values(instances).filter((item) => isEquipmentSlotCompatible(item.definitionId, slot));
  const selected = instances[selectedId ?? equipment[slot] ?? ""];
  const definition = selected && catalog.equipment[selected.definitionId];
  const isEquipped = Boolean(selected && equipment[slot] === selected.id);
  const blocked = selected ? getEquipmentBlockReason(player, selected.id, slot) : null;
  const preview = selected ? isEquipped ? unequipItem(player, slot) : equipItem(player, selected.id, slot) : player;
  const currentStats = getEffectiveStats(player);
  const previewStats = getEffectiveStats(preview);
  const changedStats = Object.keys(currentStats).filter((id) => currentStats[id] !== previewStats[id]);
  const displaced = Object.entries(equipment).filter(([key, id]) => preview.character.equipment[key] !== id && id !== selected?.id);
  const bonuses: Record<string, number> = {};
  for (const id of Object.values(equipment)) {
    const item = instances[id];
    if (item && item.durability > 0) for (const modifier of catalog.equipment[item.definitionId]?.modifiers ?? []) bonuses[modifier.stat] = (bonuses[modifier.stat] ?? 0) + modifier.amount;
  }
  function apply() {
    if (!selected) return;
    setSelectedId(selected.id);
    setPlayer((current) => isEquipped ? unequipItem(current, slot) : equipItem(current, selected.id, slot));
    setMessage(`${selected.name ?? definition?.name} ${isEquipped ? "unequipped and kept in your belongings" : `equipped in ${catalog.equipmentSlots[slot]}`}.`);
  }
  return <div className="character-backdrop">
    <section ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className="character-sheet equipment-sheet" style={{ backgroundImage: `url("${getImageUrl("parchment.png")}")` }}>
      <header className="character-header">
        <div className="character-identity"><p className="character-eyebrow">{player.name} · Belongings</p><h1 ref={heading} tabIndex={-1} id={titleId}>Equipment</h1><p className="character-muted">Select a slot to inspect, compare and change your equipment.</p></div>
        <button className="character-button" onClick={onClose}>Close</button>
      </header>
      <nav className="equipment-navigation" aria-label="Character pages"><button className="character-button" onClick={onCharacter}>Character</button><button className="character-button" onClick={onInventory}>Inventory</button><span className="character-muted">{Object.keys(equipment).length} / {Object.keys(catalog.equipmentSlots).length} slots equipped</span></nav>
      <div className="equipment-layout character-content">
        <section className="equipment-loadout" aria-label="Equipment slots">
          <div className="equipment-portrait"><img src={getImageUrl(`avatar/portraits/${player.character.appearance.portrait}`)} alt={player.name} /><span>Currently equipped</span></div>
          <div className="equipment-slots">{Object.entries(catalog.equipmentSlots).map(([id, label]) => {
            const item = instances[equipment[id] ?? ""];
            const def = item && catalog.equipment[item.definitionId];
            return <button key={id} className={`equipment-slot ${item ? "" : "equipment-slot-empty"}`} aria-pressed={slot === id} onClick={() => { setSlot(id); setSelectedId(null); setMessage(""); }}>
              <span className="equipment-slot-label">{label}</span><strong>{item ? item.name ?? def?.name : "Empty slot"}</strong><small>{item ? `Condition ${item.durability} / ${def?.maxDurability}` : "Select to equip"}</small>
            </button>;
          })}</div>
          <div className="equipment-bonuses"><h2>Equipment bonuses</h2>{Object.entries(bonuses).filter(([, amount]) => amount !== 0).length ? Object.entries(bonuses).filter(([, amount]) => amount !== 0).map(([id, amount]) => <span key={id}>{catalog.stats[id]?.name ?? id} <strong>{signed(amount)}</strong></span>) : <p className="character-muted">No equipment bonuses active.</p>}</div>
        </section>
        <section className="equipment-bag" aria-labelledby={`${titleId}-items`}><h2 id={`${titleId}-items`}>{catalog.equipmentSlots[slot]}</h2><p className="character-muted">Compatible belongings · {candidates.length}</p>
          <div className="equipment-items">{candidates.map((item) => {
            const def = catalog.equipment[item.definitionId]!;
            const wornSlot = Object.keys(equipment).find((key) => equipment[key] === item.id);
            return <button key={item.id} className="equipment-item" aria-pressed={selected?.id === item.id} onClick={() => { setSelectedId(item.id); setMessage(""); }}><strong>{item.name ?? def.name}</strong><span>{wornSlot ? `Equipped · ${catalog.equipmentSlots[wornSlot]}` : "Carried"}</span><small>{item.durability <= 0 ? "Broken" : `Condition ${item.durability} / ${def.maxDurability}`}</small></button>;
          })}</div>
          {!candidates.length && <p className="character-empty">You have no equipment for this slot yet.</p>}
        </section>
        <section className="equipment-details" aria-labelledby={`${titleId}-details`}><h2 id={`${titleId}-details`}>Item details</h2>{selected && definition ? <>
          <h3>{selected.name ?? definition.name}</h3><p>{definition.description}</p>
          <p className="character-muted">{definition.twoHanded ? "Two-handed · " : ""}Condition {selected.durability} / {definition.maxDurability}</p>
          <progress aria-label="Item condition" max={definition.maxDurability} value={selected.durability} />
          <h4>Item bonuses</h4>{definition.modifiers.length ? definition.modifiers.map((modifier, index) => <p className="character-row" key={index}><span>{catalog.stats[modifier.stat]?.name ?? modifier.stat}</span><strong>{signed(modifier.amount)}</strong></p>) : <p className="character-muted">No stat bonuses.</p>}
          {Object.entries(definition.requirements ?? {}).map(([stat, minimum]) => <p className="character-muted" key={stat}>Requires base {catalog.stats[stat]?.name ?? stat} {minimum}</p>)}
          <h4>{isEquipped ? "After unequipping" : "After equipping"}</h4>
          {changedStats.length ? changedStats.map((id) => <p className="character-row" key={id}><span>{catalog.stats[id]?.name ?? id}</span><span>{currentStats[id]} → <strong className={previewStats[id]! > currentStats[id]! ? "equipment-gain" : "equipment-loss"}>{previewStats[id]} ({signed(previewStats[id]! - currentStats[id]!)})</strong></span></p>) : <p className="character-muted">No change to effective stats.</p>}
          {displaced.map(([key, id]) => <p className="character-muted" key={key}>{instances[id]?.name ?? catalog.equipment[instances[id]!.definitionId]?.name} will return to your belongings.</p>)}
          {blocked && !isEquipped && <p className="equipment-loss">{blocked}</p>}
          <button className="character-button equipment-apply" disabled={!isEquipped && Boolean(blocked)} onClick={apply}>{isEquipped ? "Unequip" : "Equip"}</button>
        </> : <p className="character-empty">Select an item to view its condition and compare its bonuses.</p>}</section>
      </div>
      <p className="equipment-feedback" role="status">{message}</p>
    </section>
  </div>;
}
