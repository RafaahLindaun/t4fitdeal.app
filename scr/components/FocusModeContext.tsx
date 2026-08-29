import { createContext, useContext, useEffect, type ReactNode } from "react";

type FocusModeValue = {
  focusMode: boolean;
  setFocusMode: (active: boolean) => void;
};

const FocusModeContext = createContext<FocusModeValue | null>(null);

export function FocusModeProvider({
  focusMode,
  setFocusMode,
  children,
}: FocusModeValue & { children: ReactNode }) {
  return (
    <FocusModeContext.Provider value={{ focusMode, setFocusMode }}>
      {children}
    </FocusModeContext.Provider>
  );
}

export function useFocusModeRegistration(active: boolean) {
  const context = useContext(FocusModeContext);
  const setFocusMode = context?.setFocusMode;
  useEffect(() => {
    if (!setFocusMode) return;
    setFocusMode(active);
    return () => setFocusMode(false);
  }, [active, setFocusMode]);
}
