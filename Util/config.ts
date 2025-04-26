import dotenv from 'dotenv';

dotenv.config();

// ADDED DEBUG LINE 1: Log the raw environment variable value
console.log(`[DEBUG] Raw process.env.MONGO_URL: "${process.env.MONGO_URL}"`);

const Config = {
  prefix: process.env.BOT_PREFIX || "/",
  support: process.env.SUPPORT_GROUP || "",
  test: process.env.TEST_GROUP || "",
  invite: process.env.INVITE_LINK || "",
  devs: (process.env.DEVS || "").split(',').filter(d => d.trim() !== ''),
  mongoUrl: process.env.MONGO_URL || "",
};

// ADDED DEBUG LINE 2: Log the value after assigning it to Config
console.log(`[DEBUG] Config.mongoUrl after assignment: "${Config.mongoUrl}"`);

// Original checks (keep these)
if (!Config.mongoUrl) {
    console.error("FATAL ERROR: Config.mongoUrl is empty or undefined after reading environment variables.");
    // No need to exit here, let the startDatabase function handle it
}
if (!Config.devs || Config.devs.length === 0) {
    console.warn("WARNING: DEVS environment variable is not set or empty.");
}
if (!Config.support || !Config.test) {
    console.warn("WARNING: SUPPORT_GROUP or TEST_GROUP environment variable is not set.");
}

export default Config;
export { Config };
