import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useAuth } from "../src/context/auth";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import Tabs from "./Tabs";

export type RootParamList = {
  App: undefined;
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<RootParamList>();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        id="root"
        screenOptions={{ headerShown: false, animation: "fade" }}
      >
        {user ? (
          <Stack.Screen name="App" component={Tabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
