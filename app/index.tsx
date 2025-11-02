import React from "react";
import { AuthProvider } from "../src/context/auth";
import RootNavigator from "./RootNavigator";

export default function AppEntry() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
