import { passwordRules } from "../../utils/passwordValidation";

const PasswordChecklist = ({ password }) => {
  if (!password) return null;

  return (
    <ul className="mb-4 space-y-1">
      {passwordRules.map((rule) => {
        const passed = rule.test(password);
        return (
          <li
            key={rule.id}
            className={`text-xs flex items-center gap-1.5 transition-colors ${
              passed ? "text-green-400" : "text-[#6b7280]"
            }`}
          >
            <span>{passed ? "✓" : "✗"}</span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
};

export default PasswordChecklist;
