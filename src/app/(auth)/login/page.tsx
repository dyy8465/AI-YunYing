import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/features/auth/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");
  return <LoginForm />;
}
