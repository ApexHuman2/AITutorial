import { getCurrentUser } from "@/lib/serverAuth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  return (
    <DashboardClient
      uid={user!.uid}
      email={user!.email ?? ""}
      name={(user!.name as string) ?? user!.email ?? "Student"}
    />
  );
}
