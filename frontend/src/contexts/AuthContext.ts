import { createContext } from "react";

import { AuthControllerGetProfileQueryResult } from "@/data/api";

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: AuthControllerGetProfileQueryResult | null;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  profile: null,
});
