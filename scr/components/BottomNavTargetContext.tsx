import { createContext, useContext, type RefObject } from "react";

const BottomNavTreinoTargetContext = createContext<RefObject<HTMLSpanElement> | null>(null);

export const BottomNavTreinoTargetProvider = BottomNavTreinoTargetContext.Provider;

export function useBottomNavTreinoTarget() {
  return useContext(BottomNavTreinoTargetContext);
}
