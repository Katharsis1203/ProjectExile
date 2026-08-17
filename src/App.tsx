import { useCallback, useEffect, useRef, useState } from "react";
import IntroPage from "./components/intro/IntroPage";
import TitlePage from "./components/TitlePage";
import { createDefaultPlayer } from "./data/defaultPlayer";
import {
  applyGameSettings,
  loadGameSettings,
  writeSaveSlot,
  type GameSave,
  type SaveSlotId,
} from "./services/gamePersistence";
import HubPage from "./pages/HubPage";

type AppScreen = "title" | "intro" | "hub";

const INTRO_OPENING_NODE = "road_north";
const OUTER_FADE_IN_MS = 300;
const OUTER_FADE_FALLBACK_MS = 1800;

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("title");
  const [player, setPlayer] = useState(createDefaultPlayer);
  const [activeSlotId, setActiveSlotId] = useState<SaveSlotId | null>(null);
  const [activeSaveName, setActiveSaveName] = useState("");
  const [introNodeId, setIntroNodeId] = useState(INTRO_OPENING_NODE);
  const [introComplete, setIntroComplete] = useState(false);
  const [outerTransitionActive, setOuterTransitionActive] = useState(false);
  const transitionLockedRef = useRef(false);
  const swapTimerRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    applyGameSettings(loadGameSettings());
  }, []);

  const clearTransitionTimers = useCallback(() => {
    if (swapTimerRef.current !== null) {
      window.clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }

    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTransitionTimers, [clearTransitionTimers]);

  const revealScreen = useCallback(() => {
    if (!transitionLockedRef.current) return;

    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    window.requestAnimationFrame(() => {
      setOuterTransitionActive(false);
      transitionLockedRef.current = false;
    });
  }, []);

  const beginOuterTransition = useCallback(
    (nextScreen: AppScreen, beforeSwap?: () => void, waitForReady = false) => {
      if (transitionLockedRef.current) return;

      clearTransitionTimers();
      transitionLockedRef.current = true;
      setOuterTransitionActive(true);

      swapTimerRef.current = window.setTimeout(() => {
        beforeSwap?.();
        setScreen(nextScreen);
        swapTimerRef.current = null;

        if (waitForReady) {
          fallbackTimerRef.current = window.setTimeout(
            revealScreen,
            OUTER_FADE_FALLBACK_MS,
          );
        } else {
          window.requestAnimationFrame(revealScreen);
        }
      }, OUTER_FADE_IN_MS);
    },
    [clearTransitionTimers, revealScreen],
  );

  useEffect(() => {
    if (!activeSlotId || (screen !== "intro" && screen !== "hub")) return;

    writeSaveSlot(activeSlotId, activeSaveName, player, {
      screen,
      ...(screen === "intro"
        ? { introNodeId, introComplete }
        : {}),
    });
  }, [activeSaveName, activeSlotId, introComplete, introNodeId, player, screen]);

  const startNewGame = useCallback(
    (slotId: SaveSlotId, saveName: string) => {
      beginOuterTransition(
        "intro",
        () => {
          const newPlayer = createDefaultPlayer();
          setPlayer(newPlayer);
          setActiveSlotId(slotId);
          setActiveSaveName(saveName);
          setIntroNodeId(INTRO_OPENING_NODE);
          setIntroComplete(false);
          writeSaveSlot(slotId, saveName, newPlayer, {
            screen: "intro",
            introNodeId: INTRO_OPENING_NODE,
            introComplete: false,
          });
        },
        true,
      );
    },
    [beginOuterTransition],
  );

  const loadGame = useCallback(
    (save: GameSave) => {
      const nextScreen: AppScreen = save.resume.screen;
      beginOuterTransition(
        nextScreen,
        () => {
          setPlayer(save.player);
          setActiveSlotId(save.slotId);
          setActiveSaveName(save.saveName);
          setIntroNodeId(save.resume.introNodeId ?? INTRO_OPENING_NODE);
          setIntroComplete(Boolean(save.resume.introComplete));
        },
        true,
      );
    },
    [beginOuterTransition],
  );

  const returnToTitle = useCallback(() => {
    beginOuterTransition("title");
  }, [beginOuterTransition]);

  const enterHub = useCallback(() => {
    beginOuterTransition(
      "hub",
      () => {
        setIntroComplete(false);
        setIntroNodeId(INTRO_OPENING_NODE);
      },
      true,
    );
  }, [beginOuterTransition]);

  const handleIntroProgress = useCallback((nodeId: string, isComplete: boolean) => {
    setIntroNodeId(nodeId);
    setIntroComplete(isComplete);
  }, []);

  let content;

  if (screen === "title") {
    content = <TitlePage onNewGame={startNewGame} onLoadGame={loadGame} />;
  } else if (screen === "intro") {
    content = (
      <IntroPage
        player={player}
        setPlayer={setPlayer}
        initialNodeId={introNodeId}
        initialComplete={introComplete}
        onProgress={handleIntroProgress}
        onBackToTitle={returnToTitle}
        onComplete={enterHub}
        onReady={revealScreen}
      />
    );
  } else {
    content = (
      <HubPage
        player={player}
        setPlayer={setPlayer}
        onReady={revealScreen}
      />
    );
  }

  return (
    <>
      {content}
      <div
        aria-hidden="true"
        className={`app-outer-transition${
          outerTransitionActive ? " app-outer-transition--active" : ""
        }`}
      />
    </>
  );
}
