import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#f8f7f4" },
          headerTintColor: "#0f172a",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#f8f7f4" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "2dcite" }} />
      </Stack>
    </>
  );
}
