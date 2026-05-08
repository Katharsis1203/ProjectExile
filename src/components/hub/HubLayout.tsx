import HubAreaPanel from "./HubAreaPanel";
import HubMainContent from "./HubMainContent";
import HubSideBar from "./HubSideBar";
import HubEventRow from "./HubEventRow";

export default function HubLayout() {
  return (
    <div className="min-h-screen overflow-auto bg-neutral-950 text-white">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="h-225 w-337.5 shrink-0 bg-neutral-900 p-4">
          <div className="grid h-full grid-rows-[4fr_1fr] gap-4">
            <div className="flex gap-4 overflow-hidden">
              <HubAreaPanel />
              <HubMainContent />
              <HubSideBar />
            </div>

            <HubEventRow />
          </div>
        </div>
      </div>
    </div>
  );
}