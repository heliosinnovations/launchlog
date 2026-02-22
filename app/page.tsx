import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ExampleProfileSection from "@/components/ExampleProfileSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

export default async function Home() {
  // Check if user is signed in - redirect to dashboard if so
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ExampleProfileSection />
        <PricingSection />
        <FAQSection />
        <Footer />
      </main>
    </>
  );
}
