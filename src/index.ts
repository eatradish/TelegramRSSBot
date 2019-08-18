import token from "../settings";
import BotManager from "./BotManager";
import Updater from "./Updater";
import FeedManager from "./FeedManager";
import RssParser from 'rss-parser';

const main = (async (): Promise<void> => {
    const feedManager = await new FeedManager().init();
    const parser = new RssParser();
    const botManager = new BotManager(token, feedManager, parser);
    botManager.startListen();
    const updater = new Updater(feedManager, botManager, parser);
    updater.run();
    console.log("listening....");
});

main();
