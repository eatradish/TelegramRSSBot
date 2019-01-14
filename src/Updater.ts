import FeedManager from './FeedManager';
import BotManager from './BotManager';
import RssParser from 'rss-parser';
import { IDatebaseValue } from "./Interface";

class Updater {
    private time: number;
    public constructor(time = 60000) {
        this.time = time;
    }
    public async run(botManager: BotManager, feedManager: FeedManager) {
        while (true) {
            this.update(botManager, feedManager);
            console.log("Updateing...");
            await this.sleep();
        }
    }
    private sleep() {
        return new Promise(resolve => setTimeout(resolve, this.time));
    }
    private async update(botManager: BotManager, feedManager: FeedManager) {
        const parser = new RssParser();
        const list = await feedManager.getUpdateList() as IDatebaseValue[];
        console.log(list);
        for (const index of list) {
            const rssIndex = await parser.parseURL(index.url);
            const newIndexTime = new Date(rssIndex.items[0].pubDate).getTime();
            if (newIndexTime > index.authorUpdateTime) {
                const authorUpdateTime = newIndexTime;
                const updateTime = Date.now();
                const updateValue = { $set: { updateTime, authorUpdateTime } };
                try {
                    await feedManager.updateQuery(index, updateValue);
                }
                catch (err){
                    console.log(err);
                }
                const value = (await
                    feedManager.getFeedsUserNameByUrl(index.url)) as IDatebaseValue[];
                for (const i of value) {
                    botManager.send(i.userId,
                        rssIndex.items[0].title + '\n' + rssIndex.items[0].link);
                }
            }
        }
    }
}

export default Updater;
