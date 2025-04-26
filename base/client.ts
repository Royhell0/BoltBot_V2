import {
  Client as BaseClient,
  ClientOptions,
  LocalAuth,
  Message,
  Contact,
  Chat,
} from "whatsapp-web.js";
import { cwd } from "process";
import path from "path"; // Import the path module
import fs from "fs/promises";
import { Command } from "../interfaces/command";
import { Event } from "../interfaces/event";
import { Collection } from "@discordjs/collection";
import Logger from "../Util/logger";
import { I18n } from "../i18n/classes/i18n";
import { connection } from "mongoose";
import { Config } from "../Util/config";
import Schemas from "../database/mongoose/schemas/export";
import { connect } from "../database/mongoose/index";

class Client extends BaseClient {
  public commands: Collection<string, Command> = new Collection();
  public i18n: I18n = new I18n({ path: path.join(cwd(), "i18n", "locales") }); // Use path.join for cross-platform compatibility
  public config: typeof Config = Config;
  public uptime: number = null;
  public cooldowns: Collection<
    string,
    { time: number; sent: boolean; count: number }
  > = new Collection();
  public path: string; // This is cwd()
  public db: {
    connection: typeof connection;
    schemas: typeof Schemas;
  };
  constructor(options?: ClientOptions) {
    const defaultOptions: ClientOptions = {
      puppeteer: {
        // Remove the hardcoded Windows path
        // executablePath:
        //  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        // Add args for headless environments (like Render)
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          // '--single-process', // keep commented unless needed
          "--disable-gpu",
        ],
      },
      authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }), // Explicitly set dataPath to where the disk is mounted
    };
    super(Object.assign({}, defaultOptions, options)); // Ensure defaultOptions are applied correctly
    this.commands = new Collection();
    this.path = cwd(); // Store current working directory
  }

  // Modified registerEvents
  protected async registerEvents(dir: string, debug = false): Promise<boolean> {
    try {
      // Construct path relative to the compiled output directory ('dist')
      let dirPath = path.join(this.path, "dist", dir); // Look inside 'dist/events'
      let files = await fs.readdir(dirPath);

      for (let file of files) {
        let fullPath = path.join(dirPath, file);
        let stat = await fs.lstat(fullPath);

        if (stat.isDirectory()) {
          // Recursive call needs path relative to 'dist' base
          await this.registerEvents(path.join(dir, file), debug);
        } else if (file.endsWith(".js")) {
          // Look for .js files now
          // Import using the correct full path
          let { default: event } = (await import(fullPath)) as {
            default: Event;
          };
          if (event.once) {
            this.once(event.name, event.run.bind(null, this));
          } else {
            this.on(event.name, event.run.bind(null, this));
          }
          if (debug) Logger.logEventRegistered(event);
        }
      }
      return true;
    } catch (error) {
      console.error(`Error registering events in ${dir}:`, error); // Log errors clearly
      return false;
    }
  }

  // Modified registerCommands
  protected async registerCommands(
    dir: string,
    debug = false
  ): Promise<boolean> {
    try {
      // Construct path relative to the compiled output directory ('dist')
      let dirPath = path.join(this.path, "dist", dir); // Look inside 'dist/commands'
      let files = await fs.readdir(dirPath);

      for (let file of files) {
        let fullPath = path.join(dirPath, file);
        let stat = await fs.lstat(fullPath);

        if (stat.isDirectory()) {
          // Recursive call needs path relative to 'dist' base
          await this.registerCommands(path.join(dir, file), debug);
        } else if (file.endsWith(".js")) {
          // Look for .js files now
          // Import using the correct full path
          let { default: cmd } = (await import(fullPath)) as {
            default: Command;
          };

          this.commands.set(cmd.name, cmd);
          if (debug) Logger.logCommandRegistered(cmd);
        }
      }
      return true;
    } catch (error) {
      console.error(`Error registering commands in ${dir}:`, error); // Log errors clearly
      return false;
    }
  }

  protected async startDatabase(url: string) {
    if (!url) {
      console.error("Database URL is missing. Cannot connect.");
      this.db = null;
      return; // Exit early if no URL
    }
    try {
      console.log("Attempting to connect to database..."); // Add log
      this.db = await connect(url);
      console.log("Database connection successful."); // Add log
    } catch (error) { // Catch specific error
      this.db = null;
      console.error("Error connecting to database:", error); // Log the actual error
    }
  }

  public async start(options: {
    eventsDir: string;
    commandsDir: string;
    debug?: boolean;
  }) {
    let defaultOptions = {
      eventsDir: "events", // These are relative paths passed in
      commandsDir: "commands", // These are relative paths passed in
      debug: false,
    };
    options = Object.assign(defaultOptions, options);

    // Attempt database connection FIRST
    await this.startDatabase(this.config.mongoUrl);
    if (!this.db) {
       console.error("Database connection failed. Aborting bot start.");
       // Optionally exit or prevent further initialization
       // process.exit(1); // Uncomment to force exit if DB connection is critical
       return;
    }

    // Proceed with registration only if DB connection succeeded (or is not critical)
    await this.registerEvents(options.eventsDir, options.debug);
    await this.registerCommands(options.commandsDir, options.debug);

    console.log("Initializing WhatsApp client..."); // Add log
    await this.initialize();
  }

  public awaitMessage(options: {
    filter: (message: Message) => boolean;
    time: number;
  }): Promise<Message> {
    return new Promise<Message>((resolve, reject) => {
      const timeout = setTimeout(() => {
         this.off('message', messageListener); // Clean up listener on timeout
         reject(new Error("Message await timed out")); // Reject with an error
      }, options.time);

      const messageListener = (message: Message) => {
        if (options.filter(message)) {
          clearTimeout(timeout); // Clear timeout if message is found
          this.off('message', messageListener); // Clean up listener
          resolve(message);
        }
      };
      this.on("message", messageListener);
    });
  }
}

export default Client;
export { Client };
