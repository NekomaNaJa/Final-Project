import Navbar from "../components/MainPage/Navbar";
import Hero from "../components/MainPage/Hero";
import Features from "../components/MainPage/Features";
import StreamerList from "../components/MainPage/StreamerList";
import CTASection from "../components/MainPage/CTASection";
import Footer from "../components/MainPage/Footer";

const MainPage = () => {
  return (
    <div className="min-h-screen w-full bg-[#050505] font-sans">
      <Navbar />
      <Hero />
      <Features />
      <StreamerList />
      <CTASection />
      <Footer />
    </div>
  );
};

export default MainPage;
