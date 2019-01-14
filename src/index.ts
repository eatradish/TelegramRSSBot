import token from "../settings";
import BotManager from "./BotManager";
import Updater from "./Updater";
import FeedManager from "./FeedManager";

const feedManager = new FeedManager();
const botManager = new BotManager(token, feedManager);
botManager.startListen();
const updater = new Updater(feedManager, botManager);
updater.run();
console.log("listening....");
