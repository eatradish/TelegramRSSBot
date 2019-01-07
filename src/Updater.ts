import FeedManager from './FeedManager';
import BotManager from './BotManager';
import RssParser from 'rss-parser';
import { DatebaseValue } from "./Interface";

class Updater {
    private time: number;
    public constructor(time = 300000) {
        this.time = time;
    }
    private async update(manager: BotManager) {
        let feed = new FeedManager();
        let parser = new RssParser();
        let list = await feed.getUpdateList() as DatebaseValue[];
        console.log(list);
        for(let index of list) {
            let rssIndex = await parser.parseURL(index.url);
            let indexTime = new Date(rssIndex.items[0].pubDate).getTime();
            if(indexTime > index.authorUpdateTime) {
                let authorUpdateTime = indexTime;
                let updateTime = Date.now();
                let updateValue = { $set: { updateTime, authorUpdateTime } }
                let success = await feed.updateQuery(index, updateValue);
                if(success) {
                    let value = (await 
                        feed.getFeedsUserNameByUrl(index.url)) as DatebaseValue[];
                    for (let index of value) {
                        manager.send(index.userId, 
                            rssIndex.items[0].title + '\n' + rssIndex.items[0].link);
                    }
                }
            }
        }
    }
    private sleep() {
        return new Promise(resolve => setTimeout(resolve, this.time));
    }
    public async run(manager: BotManager) {
        while(true) {
            this.update(manager);
            console.log("Updateing...");
            await this.sleep();
        }
    }
}

export default Updater;