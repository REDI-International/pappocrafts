import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Categories from "@/components/Categories";
import ServicesPreview from "@/components/ServicesPreview";
import Mission from "@/components/Mission";
import WaitlistForm from "@/components/WaitlistForm";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Mission />
        <HowItWorks />
        <Categories />
        <ServicesPreview />
        <WaitlistForm />
        <Hero />
      </main>
      <Footer />
    </>
  );
}
