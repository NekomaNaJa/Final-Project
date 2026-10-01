// The password policy is defined once in client/src/utils/passwordRules.js
// (plain ESM, no React/browser APIs) and re-exported here, so the server and the
// client always enforce exactly the same rules without duplicating the logic.
export {
  passwordRules,
  isPasswordValid,
  getPasswordError,
} from "../../client/src/utils/passwordRules.js";
