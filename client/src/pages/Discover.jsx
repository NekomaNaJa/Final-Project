import Navbar from "../components/MainPage/Navbar";
import Footer from "../components/MainPage/Footer";
import CategorySection from "../components/Discover/CategorySection";
import { Radio, Gamepad2, Heart, Star } from "lucide-react";

const mockStreamers = (count, followers) =>
  Array.from({ length: count }, () => ({
    name: "Name Streamer",
    game: "Style game",
    followers,
  }));

const categories = [
  {
    icon: Radio,
    iconColor: "bg-red-600",
    title: "กำลังไลฟ์สตรีม",
    subtitle: "Streamer ที่กำลังไลฟ์อยู่ตอนนี้",
    live: true,
    streamers: mockStreamers(3, "1.2k"),
  },
  {
    icon: Gamepad2,
    iconColor: "bg-sky-500",
    title: "เกมที่กำลังได้รับความนิยม",
    subtitle: "เกมที่มีผู้ชมมากที่สุดตอนนี้",
    streamers: mockStreamers(3, "3.4k"),
  },
  {
    icon: Heart,
    iconColor: "bg-emerald-500",
    title: "คุณอาจจะสนใจ",
    subtitle: "Streamer ที่เราคิดว่าคุณน่าจะชอบ",
    streamers: mockStreamers(3, "2.1k"),
  },
  {
    icon: Star,
    iconColor: "bg-purple-500",
    title: "สตรีมเมอร์แนะนำ",
    subtitle: "Streamer แนะนำประจำสัปดาห์",
    streamers: mockStreamers(3, "5.6k"),
  },
];

const Discover = () => {
  return (
    <div className="min-h-screen w-full bg-[#050505] font-sans">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-16">
        <span className="inline-block text-xs font-semibold tracking-[0.3em] text-[#a78bfa] uppercase mb-3">
          Explore your favorite streamer
        </span>
        <h1 className="text-white text-3xl md:text-4xl font-bold mb-12">
          ค้นพบ{" "}
          <span className="font-serif [font-variant:small-caps]">
            STREAMER
          </span>
        </h1>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 pb-16">
        {categories.map((cat) => (
          <CategorySection key={cat.title} {...cat} />
        ))}
      </section>

      <Footer />
    </div>
  );
};

export default Discover;