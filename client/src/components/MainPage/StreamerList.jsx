import { Link } from "react-router-dom";

const streamers = [
  { name: "Name Streamer", followers: "12.4k Followers" },
  { name: "Name Streamer", followers: "9.1k Followers" },
  { name: "Name Streamer", followers: "7.8k Followers" },
];

const StreamerList = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-10 py-16">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white text-xl md:text-2xl font-bold">
          ค้นพบ <span className="donix-gradient-text">STREAMER</span>
        </h2>
        <Link
          to="/discover"
          className="text-[#a78bfa] text-sm hover:text-[#c4b5fd] transition-colors"
        >
          ดูทั้งหมด
        </Link>
      </div>
      <p className="text-[#9ca3af] text-sm mb-8">Streamer ที่กำลังโตสนใจ</p>

      <div className="grid sm:grid-cols-3 gap-6">
        {streamers.map((s, i) => (
          <div
            key={i}
            className="bg-[#13101c] border border-[#374151] rounded-2xl overflow-hidden
                       hover:border-[#7c3aed]/50 transition-colors"
          >
            <div className="h-32 bg-linear-to-br from-[#4c1d95]/50 to-[#7c3aed]/20" />
            <div className="p-4">
              <p className="text-white text-sm font-semibold">{s.name}</p>
              <p className="text-[#6b7280] text-xs mt-1">{s.followers}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StreamerList;
