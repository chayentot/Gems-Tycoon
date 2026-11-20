import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Gems Tycoon",
  description: "Build and operate your gemstone mining empire in Gems Tycoon Map 3."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
