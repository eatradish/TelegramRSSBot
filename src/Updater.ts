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
        const list = await this.feedManager.getUpdateList();
        console.log(list);
        let newIndexTime;
        for (const index of list) {
            const rssIndex = await parser.parseURL(index.url);
            if (rssIndex.items !== undefined && rssIndex.items[0].pubDate !== undefined) {
                newIndexTime = new Date(rssIndex.items[0].pubDate).getTime();
            }
            else return;
            if (newIndexTime > index.authorUpdateTime) {
                const authorUpdateTime = newIndexTime;
                const updateTime = Date.now();
                const updateValue = { $set: { updateTime, authorUpdateTime } };
                const newIndex = {
                    authorUpdateTime,
                    updateTime,
                    url: index.url,
                    users: index.users,
                } as IDatebaseValue;
                try {
                    await this.feedManager.updateQuery(index, updateValue);
                    this.feedManager.setMap(newIndex);
                }
                catch (err) {
                    console.log(err);
                }
                const users = await this.feedManager.getFeedsUserNameByUrl(index.url);
                if (users) {
                    for (const user of users) {
                        this.botManager.send(user,
                            rssIndex.items[0].title + '\n' + rssIndex.items[0].link);
                    }
                }
            }
        }
    }
}

export default Updater;
