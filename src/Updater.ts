import FeedManager from './FeedManager';
import BotManager from './BotManager';
import RssParser from 'rss-parser';
import { DatebaseValue } from "./Interface";

class Updater {
    private time: number;
    private feedManager: FeedManager;
    private readonly botManager: BotManager;
    private parser: RssParser;
    public constructor(feedManager: FeedManager, botManager: BotManager, parser: RssParser, time = 60000) {
        this.time = time;
        this.feedManager = feedManager;
        this.botManager = botManager;
        this.parser = parser;
    }
    public async run(): Promise<void> {
        const sleep = ((time: number): Promise<NodeJS.Timeout> => {
            return new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, time));
        });
        while (true) {
            this.update();
            console.log("Updateing...");
            await sleep(this.time);
        }
    }
    private async update(): Promise<void | undefined> {
        const list = await this.feedManager.getUpdateList();
        console.log(list);
        let newIndexTime;
        for (const index of list) {
            const rssIndex = await this.parser.parseURL(index.url);
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
                    msgids: index.msgids,
                } as DatebaseValue;
                try {
                    this.feedManager.updateQuery(index, updateValue);
                    this.feedManager.setMap(newIndex);
                }
                catch (err) {
                    console.log(err);
                }
                const users = await this.feedManager.getFeedsUserNameByUrl(index.url);
                let item;
                let msgids: number[];
                if (users) {
                    item = this.feedManager.getMap().get(index.url) as DatebaseValue;
                    const newItem = JSON.parse(JSON.stringify(item));
                    if (item !== undefined) msgids = item.msgids.slice();
                    else return;
                    for (const user of users) {
                        const res = await this.botManager.send(user,
                            rssIndex.items[0].title + '\n' + rssIndex.items[0].link);
                        console.log(res);
                        if (msgids !== undefined) {
                            msgids.push(res.message_id);
                            newItem.msgids = msgids;
                            this.feedManager.updateQuery(item, { $set: { msgids: msgids } });
                            this.feedManager.setMap(newItem);
                        }
                    }
                }
            }
        }
    }
}

export default Updater;
