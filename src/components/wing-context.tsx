import { useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  inferSharedWing,
  parseWing,
  wingFromPath,
  WING_STORAGE_KEY,
  type WingId,
} from "@/lib/wings";

type WingContextValue = {
  wing: WingId | "gate";
  lastWing: WingId | null;
  setWing: (id: WingId) => void;
};

const WingContext = createContext<WingContextValue>({
  wing: "gate",
  lastWing: null,
  setWing: () => {},
});

export function WingProvider({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [stored, setStored] = useState<WingId | null>(null);

  useEffect(() => {
    setStored(parseWing(sessionStorage.getItem(WING_STORAGE_KEY)));
  }, []);

  const pathWing = wingFromPath(pathname);

  useEffect(() => {
    if (pathWing === "gate") return;
    sessionStorage.setItem(WING_STORAGE_KEY, pathWing);
    setStored(pathWing);
  }, [pathWing]);

  const value = useMemo<WingContextValue>(() => {
    const setWing = (id: WingId) => {
      sessionStorage.setItem(WING_STORAGE_KEY, id);
      setStored(id);
    };
    if (pathWing !== "gate") {
      return { wing: pathWing, lastWing: pathWing, setWing };
    }
    if (pathname === "/") {
      return { wing: "gate", lastWing: stored, setWing };
    }
    const inferred = stored ?? inferSharedWing(pathname);
    return { wing: inferred, lastWing: stored ?? inferred, setWing };
  }, [pathWing, pathname, stored]);

  return <WingContext.Provider value={value}>{children}</WingContext.Provider>;
}

export function useWing() {
  return useContext(WingContext);
}
