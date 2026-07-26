import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/lib/auth";
import { colors } from "../src/lib/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: colors.background },
          headerBackTitle: "Back",
        }}
      >
        <Stack.Screen name="index" options={{ title: "2dcite" }} />
        <Stack.Screen name="login" options={{ title: "Sign in" }} />
        <Stack.Screen name="signup" options={{ title: "Create account" }} />
        <Stack.Screen name="jobs/index" options={{ title: "Jobs" }} />
        <Stack.Screen name="jobs/new" options={{ title: "New review" }} />
        <Stack.Screen name="jobs/[id]" options={{ title: "Job" }} />
        <Stack.Screen
          name="assignments/index"
          options={{ title: "Assignments" }}
        />
        <Stack.Screen
          name="assignments/[id]"
          options={{ title: "Assignment" }}
        />
        <Stack.Screen name="legal" options={{ title: "Legal notices" }} />
      </Stack>
    </AuthProvider>
  );
}
