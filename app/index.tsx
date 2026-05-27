import { Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function Index() {
  const { isOnboarded, user } = useApp();

  if (!isOnboarded) return <Redirect href="/onboarding" />;
  if (!user) return <Redirect href="/auth" />;
  return <Redirect href="/(tabs)" />;
}
