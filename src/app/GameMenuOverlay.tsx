import { useRef, type ComponentProps } from "react";
import TitlePage from "../features/title/TitlePage";
import { useModalDialog } from "../shared/hooks/useModalDialog";

export default function GameMenuOverlay(props: ComponentProps<typeof TitlePage> & { onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useModalDialog({ containerRef: ref, initialFocusRef: ref, onEscape: props.onBack });
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={props.initialView === "settings" ? "Settings" : "Save / Load"}
      tabIndex={-1} className="fixed inset-0 z-[250] overflow-y-auto outline-none">
      <TitlePage {...props} />
    </div>
  );
}
