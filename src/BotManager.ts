import Telebot from 'telebot';
import FeedManager from './FeedManager';
import RssParser from "rss-parser";

class BotManager {
    private readonly bot: Telebot;
    public constructor(token: string) {
        this.bot = new Telebot(token);
    }
    public send(chatId: number, text: string) {
        return this.bot.sendMessage(chatId, text);
    }
    public startListen(feedManager: FeedManager) {
        this.bot.on(['/start', '/hello'], (msg) => msg.reply.text('Welcome!'));
        this.bot.on(/^\/add (.+)$/, async (msg, props) => {
            console.log(msg);
            const text = props.match[1];
            if (text) {
                let rss;
                const parser = new RssParser();
                try {
                    rss = await parser.parseURL(text);
                } catch (err) {
                    return this.bot.sendMessage(msg.from.id, err);
                }
                const authorUpdateTime = rss.items[0].pubDate;
                const url = text;
                const userId = msg.from.id;
                try {
                    await feedManager.add(userId, url, authorUpdateTime);
                }
                catch (err) {
                    return this.bot.sendMessage(msg.from.id, err);
                }
                return this.bot.sendMessage(userId, 'Subscribed successfully');
            }
        });
        this.bot.on(/^\/remove (.+)$/, async (msg, props) => {
            console.log(msg);
            const text = props.match[1];
            if (text) {
                const url = text;
                const userId = msg.from.id;
                try {
                    await feedManager.remove(userId, url);
                }
                catch (err){
                    return this.bot.sendMessage(msg.from.id, err);
                }
                return this.bot.sendMessage(userId, 'Remove successful');
            }
        });
        this.bot.on('/all', async (msg) => {
            console.log(msg);
            const chatId = msg.from.id;
            const list = await feedManager.getFeedsByUserName(chatId);
            if (list.length !== 0) {
                const res = list.join('\n');
                return this.bot.sendMessage(chatId, res);
            }
            else return this.bot.sendMessage(chatId,
                 'Are you sure you subscribed to RSS on this bot?');
        });
        this.bot.start();
    }
}

export default BotManager;
