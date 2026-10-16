import { FocusColumn } from "@/components/AppFrame";

/** Odaklı akış: masaüstünde ortada dar kolon */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <FocusColumn>{children}</FocusColumn>;
}
