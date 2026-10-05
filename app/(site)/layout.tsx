import { Navbar, MobileTabBar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[68px]">{children}</main>
      <Footer />
      <MobileTabBar />
    </>
  );
}
