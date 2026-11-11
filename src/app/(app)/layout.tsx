import { AppShell } from "@/components/AppShell";

/** Pages de l'application : accessibles seulement une fois connecté (voir src/proxy.ts). */
export default function MiseEnPageApplication({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
