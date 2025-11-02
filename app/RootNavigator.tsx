import React, { useEffect, useState } from "react";
import { useAuth } from "../src/context/auth";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import Tabs from "./Tabs";

type AuthScreen = "Login" | "Register";

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>("Login");

  useEffect(() => {
    if (!user) {
      setAuthScreen("Login");
    }
  }, [user]);

  if (loading) return null;

  if (!user) {
    return authScreen === "Login" ? (
      <LoginScreen
        onSelectLogin={() => setAuthScreen("Login")}
        onSelectRegister={() => setAuthScreen("Register")}
      />
    ) : (
      <RegisterScreen
        onSelectLogin={() => setAuthScreen("Login")}
        onSelectRegister={() => setAuthScreen("Register")}
      />
    );
  }

  return <Tabs />;
}
