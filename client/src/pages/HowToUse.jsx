import Navbar from "../components/MainPage/Navbar";
import StepsSection from "../components/HowToUse/StepsSection";
import BenefitsSection from "../components/HowToUse/BenefitsSection";
import CTASection from "../components/MainPage/CTASection";
import Footer from "../components/MainPage/Footer";

const HowToUse = () => {
  return (
    <div className="min-h-screen w-full bg-[#050505] font-sans">
      <Navbar />
      <StepsSection />
      <BenefitsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default HowToUse;