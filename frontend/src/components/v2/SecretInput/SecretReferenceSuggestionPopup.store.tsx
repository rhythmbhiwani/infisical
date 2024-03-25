import { create } from "zustand";

import { DecryptedSecret } from "@app/hooks/api/types";

interface PopupState {
  showSuggestions: boolean;
  suggestions: DecryptedSecret[];
  environments: string[];
  currentEnvironment: string;
  selectHandler: (key: string) => void;
  setShowSuggestions: (value: boolean) => void;
  setSuggestions: (secrets: DecryptedSecret[]) => void;
  setEnvironments: (envs: string[]) => void;
  setCurrentEnvironment: (env: string) => void;
  setSelectHandler: (fn: (key: string) => void) => void;
}

const useSecretReferenceSuggestionPopupStore = create<PopupState>()((set) => ({
  showSuggestions: false,
  suggestions: [],
  environments: [],
  currentEnvironment: "",
  selectHandler: () => {},
  setShowSuggestions: (value) => set((state) => ({ ...state, showSuggestions: value })),
  setSuggestions: (values) => set((state) => ({ ...state, suggestions: values })),
  setEnvironments: (values) => set((state) => ({ ...state, environments: values })),
  setCurrentEnvironment: (value) => set((state) => ({ ...state, currentEnvironment: value })),
  setSelectHandler: (handler) => set((state) => ({ ...state, selectHandler: handler }))
}));

export { useSecretReferenceSuggestionPopupStore };
