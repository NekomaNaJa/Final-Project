import React from "react";

const GLOWS = [
  {
    className:
      "absolute -top-40 left-1/2 h-[650px] w-[950px] -translate-x-1/2 rounded-full blur-[110px] opacity-75",
    background:
      "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.28) 0%, rgba(88, 28, 135, 0.15) 45%, rgba(9, 8, 18, 0) 75%)",
  },
  {
    className:
      "absolute top-1/4 -left-24 h-[500px] w-[500px] rounded-full blur-[120px] opacity-40",
    background:
      "radial-gradient(circle, rgba(109, 40, 217, 0.2) 0%, rgba(9, 8, 18, 0) 70%)",
  },
  {
    className:
      "absolute top-2/3 -right-24 h-[550px] w-[550px] rounded-full blur-[130px] opacity-35",
    background:
      "radial-gradient(circle, rgba(147, 51, 234, 0.18) 0%, rgba(9, 8, 18, 0) 70%)",
  },
];

const AmbientBackground = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    {GLOWS.map(({ className, background }) => (
      <div key={className} className={className} style={{ background }} />
    ))}
  </div>
);

export default AmbientBackground;
