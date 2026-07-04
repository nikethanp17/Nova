import Navbar from "@/components/Navbar";
import LandingHero from "@/components/LandingHero";
import LandingFeatures from "@/components/LandingFeatures";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
      {/* Background radial overlays */}
      <div className="fixed inset-0 z-0 bg-slate-950/20 pointer-events-none" />
      
      {/* Header Navigation */}
      <Navbar />

      {/* Main Sections */}
      <main className="flex-grow relative z-10">
        <LandingHero />
        <LandingFeatures />
      </main>

      {/* Footer Branding */}
      <Footer />
    </div>
  );
}
