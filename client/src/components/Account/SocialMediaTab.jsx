import React from "react";
import SettingsCard from "../DonatePage/SettingsCard";
import SocialMediaForm from "../shared/SocialMediaForm";

const SocialMediaTab = () => {
  const handleSave = () => {
    console.log("Saving account social links");
  };

  return (
    <SettingsCard title="โซเชียลมีเดีย" subtitle="SOCIAL MEDIA" onSave={handleSave}>
      <SocialMediaForm />
    </SettingsCard>
  );
};

export default SocialMediaTab;
