import { redirect } from "next/navigation";

export default function LegacyPublicRegistrationPage() {
  redirect("/login");
}
