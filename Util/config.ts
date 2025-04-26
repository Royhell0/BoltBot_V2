// Removed: import dotenv from 'dotenv';
// Removed: dotenv.config();

const Config = {
  prefix: process.env.BOT_PREFIX || "/",
  support: process.env.SUPPORT_GROUP || "",
  test: process.env.TEST_GROUP || "",
  invite: process.env.INVITE_LINK || "",
  devs: (process.env.DEVS || "").split(',').filter(d => d.trim() !== ''),
  mongoUrl: process.env.MONGO_URL || "",
};

// Removed DEBUG console.log lines

// Original checks
if (!Config.mongoUrl) {
    // The error log inside startDatabase in base/client.ts is better now
    // console.error("FATAL ERROR: Config.mongoUrl is empty or undefined!");
}
 if (!Config.devs || Config.devs.length === 0) {
    console.warn("WARNING: DEVS environment variable is not set or empty.");
}
 if (!Config.support || !Config.test) {
    console.warn("WARNING: SUPPORT_GROUP or TEST_GROUP environment variable is not set.");
}

export default Config;
export { Config };
