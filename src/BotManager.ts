import Telebot from 'telebot';
import FeedManager from './FeedManager';
import RssParser from "rss-parser";
import { IDatebaseValue } from "./Interface";

class BotManager {
    private readonly bot: Telebot;
    private feedManager: FeedManager;
    public constructor(token: string, feedManager: FeedManager) {
        this.bot = new Telebot(token);
        this.feedManager = feedManager;
    }
    public async send(chatId: number, text: string) {
        console.log(chatId + text);
        return await this.bot.sendMessage(chatId, text);
    }
    public startListen() {
        this.bot.on('*', (msg) => {
            return this.quickRemove(msg);
        });
        this.bot.on(['/start', '/hello'], (msg) => {
            msg.reply.text('咸鱼叫，咸鱼叫，咸鱼被吃掉！');
        });
        this.bot.on(/^\/add (.+)$/, async (msg, props) => {
            return this.add(msg, props);
        });
        this.bot.on(/^\/remove (.+)$/, async (msg, props) => {
            return this.remove(msg, props);
        });
        this.bot.on('/all', async (msg) => {
            return this.all(msg);
        });
        this.bot.start();
    }
    public async add(msg: any, props: any) {
        let authorUpdateTime: string;
        console.log(msg);
        const text = props.match[1];
        let title: string;
        if (text) {
            let rss;
            const parser = new RssParser();
            try {
                rss = await parser.parseURL(text);
            }
            catch (err) {
                return this.bot.sendMessage(msg.from.id, err);
            }
            if (rss.title !== undefined && rss.items !== undefined && rss.items[0].pubDate !== undefined) {
                authorUpdateTime = rss.items[0].pubDate;
                title = rss.title
            }
            else return;
            const url = text;
            const userId = msg.from.id;
            try {
                await this.feedManager.add(userId, url, title, authorUpdateTime);
            }
            catch (err) {
                return this.bot.sendMessage(msg.from.id, err);
            }
            const result = await this.bot.sendMessage(userId, title + ' 订阅成功');
            const items = this.feedManager.getMap();
            let item;
            let msgids;
            if (rss.feedUrl !== undefined && items.get(rss.feedUrl) !== undefined) {
               item = items.get(rss.feedUrl) as IDatebaseValue;
               if (item !== undefined) msgids = item.msgids;
               else return;
               msgids.push(result.message_id);
               item.msgids = msgids;
               this.feedManager.updateQuery(item, { $set: { msgids: msgids }});
               this.feedManager.setMap(item);
            }
        }
        return;
    }
    public async remove(msg: any, props: any) {
        console.log(msg);
        let title: string;
        const text = props.match[1];
        const url = text;
        const userId = msg.from.id;
        const rss = this.feedManager.getMap().get(url)
        if (rss !== undefined) {
            title = rss.title;
        }
        else return;
        if (text) {
            try {
                await this.feedManager.remove(userId, url);
            }
            catch (err){
                return this.bot.sendMessage(msg.from.id, err);
            }
            return this.bot.sendMessage(userId, title + ' 取消订阅成功');
        }
    }
    public async all(msg: any) {
        console.log(msg);
        const chatId = msg.from.id;
        const list = await this.feedManager.getFeedsByUserName(chatId);
        if (list.length !== 0) {
            const res = list.join('\n');
            return this.bot.sendMessage(chatId, res);
        }
        else return this.bot.sendMessage(chatId,
             '你确定你在这个 Bot 订阅过 RSS 吗？');
    }
    public async quickRemove(msg: any) {
        if (msg.text !== '/quick_remove') return;
        console.log(msg);
        const chatId = msg.from.id;
        const rtm = msg.reply_to_message;
        let rssURL;
        let title;
        if (rtm !== undefined && rtm.from.id === 683463769) {
            const m = this.feedManager.getMap();
            for (const [key, value] of m) {
                if (value.msgids.indexOf(rtm.message_id) !== -1) {
                    rssURL = key;
                    title = value.title;
                }
            }
            if (rssURL !== undefined && title !== undefined) {
                this.feedManager.remove(chatId, rssURL);
                return this.bot.sendMessage(chatId, title + " 取消订阅成功");
            }
        }
    }
}

export default BotManager;
