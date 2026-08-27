import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const InputField = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  name,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-5">
      {label && (
        <label className="block text-[#9ca3af] text-sm mb-2">{label}</label>
      )}
      <div className="relative">
        <input
          type={isPassword && showPassword ? "text" : type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full bg-[#1f2937] border border-[#374151] text-white placeholder-[#6b7280]
                     rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#7c3aed]
                     transition-colors pr-12"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-white transition-colors"
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;
