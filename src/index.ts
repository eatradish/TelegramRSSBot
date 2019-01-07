import token from "../settings"
import BotManager from "./BotManager";
import Updater from "./Updater"


let botManager = new BotManager(token);
botManager.startListen();
let updater = new Updater();
updater.run(botManager);
console.log("listening....");


