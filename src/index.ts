import token from "../settings"
import BotManager from "./BotManager";
import Updater from "./Updater"
import FeedManager from "./FeedManager";

let feed = new FeedManager();
let botManager = new BotManager(token);
botManager.startListen(feed);
let updater = new Updater();
updater.run(botManager, feed);
console.log("listening....");


