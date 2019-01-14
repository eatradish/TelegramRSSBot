import token from "../settings"
import BotManager from "./BotManager";
import Updater from "./Updater"
import FeedManager from "./FeedManager";

let feedManager = new FeedManager();
let botManager = new BotManager(token);
botManager.startListen(feedManager);
let updater = new Updater();
updater.run(botManager, feedManager);
console.log("listening....");


