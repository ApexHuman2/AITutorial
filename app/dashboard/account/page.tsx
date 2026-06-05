import { getCurrentUser } from "@/lib/serverAuth";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const user = await getCurrentUser();
  return (
    <AccountClient
      uid={user!.uid}
      email={user!.email ?? ""}
      name={(user!.name as string) ?? user!.email ?? "Student"}
    />
  );
}
