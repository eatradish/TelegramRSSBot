import FeedManager from './FeedManager';
import BotManager from './BotManager';
import RssParser from 'rss-parser';
import { IDatebaseValue } from "./Interface";

class Updater {
    private time: number;
    private feedManager: FeedManager;
    private readonly botManager: BotManager;
    public constructor(feedManager: FeedManager, botManager: BotManager, time = 60000) {
        this.time = time;
        this.feedManager = feedManager;
        this.botManager = botManager;
    }
    public async run() {
        while (true) {
            this.update();
            console.log("Updateing...");
            await this.sleep();
        }
    }
    private sleep() {
        return new Promise(resolve => setTimeout(resolve, this.time));
    }
    private async update() {
        const parser = new RssParser();
        const list = await this.feedManager.getUpdateList() as IDatebaseValue[];
        console.log(list);
        for (const index of list) {
            const rssIndex = await parser.parseURL(index.url);
            const newIndexTime = new Date(rssIndex.items[0].pubDate).getTime();
            if (newIndexTime > index.authorUpdateTime) {
                const authorUpdateTime = newIndexTime;
                const updateTime = Date.now();
                const updateValue = { $set: { updateTime, authorUpdateTime } };
                try {
                    await this.feedManager.updateQuery(index, updateValue);
                }
                catch (err){
                    console.log(err);
                }
                const value = (await
                    this.feedManager.getFeedsUserNameByUrl(index.url)) as IDatebaseValue[];
                for (const i of value) {
                    this.botManager.send(i.userId,
                        rssIndex.items[0].title + '\n' + rssIndex.items[0].link);
                }
            }
        }
    }
}

export default Updater;
