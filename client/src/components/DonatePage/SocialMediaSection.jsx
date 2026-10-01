import React from "react";
import SettingsCard from "./SettingsCard";
import SocialMediaForm from "../shared/SocialMediaForm";

const SocialMediaSection = () => {
  const handleSave = () => {
    console.log("Saving social media links");
  };

  return (
    <SettingsCard
      title="โซเชียลมีเดีย"
      subtitle="SOCIAL MEDIA"
      onSave={handleSave}
    >
      <SocialMediaForm />
    </SettingsCard>
  );
};

export default SocialMediaSection;
