// App.tsx (ROOT of the repo, not in /app)
import React from "react";
import RootNavigator from "./app/RootNavigator";
import { AuthProvider } from "./src/context/auth";

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
