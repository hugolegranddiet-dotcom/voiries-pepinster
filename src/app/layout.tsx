import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Voiries Pepinster",
    template: "%s · Voiries Pepinster",
  },
  description: "Suivi privé de l'état des voiries de la commune de Pepinster.",
  // Application privée : aucune indexation par les moteurs de recherche.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d6b69",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
