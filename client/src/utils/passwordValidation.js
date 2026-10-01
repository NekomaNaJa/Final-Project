// Entry point kept for backwards compatibility with existing imports/tests.
// The actual rules live in passwordRules.js so the server can share them.
export {
  passwordRules,
  isPasswordValid,
  getPasswordError,
} from "./passwordRules";
