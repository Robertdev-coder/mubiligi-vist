import { redirect } from "next/navigation";

export default function LegacyRegistrationLookupPage() {
  redirect("/login");
}
