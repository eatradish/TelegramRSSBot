import Telebot from 'telebot';
import FeedManager from './FeedManager';
import RssParser from "rss-parser";
import { IBotManager } from './Interface';

class BotManager {
    private readonly bot: Telebot;
    private feedManager: FeedManager;
    public constructor(token: string, feedManager: FeedManager) {
        this.bot = new Telebot(token);
        this.feedManager = feedManager;
    }
    public send(chatId: number, text: string) {
        return this.bot.sendMessage(chatId, text);
    }
    public startListen() {
        this.bot.on(['/start', '/hello'], (msg) => msg.reply.text('Welcome!'));
        this.bot.on(/^\/add (.+)$/, async (botValue) => {
            return this.add(botValue);
        });
        this.bot.on(/^\/remove (.+)$/, async (botValue) => {
            return this.remove(botValue);
        });
        this.bot.on('/all', async (msg) => {
            return this.all(msg);
        });
        this.bot.start();
    }
    public async add(botValue: IBotManager) {
        console.log(botValue.msg);
        const text = botValue.props.match[1];
        if (text) {
            let rss;
            const parser = new RssParser();
            try {
                rss = await parser.parseURL(text);
            }
            catch (err) {
                return this.bot.sendMessage(botValue.msg.from.id, err);
            }
            const authorUpdateTime = rss.items[0].pubDate;
            const url = text;
            const userId = botValue.msg.from.id;
            try {
                await this.feedManager.add(userId, url, authorUpdateTime);
            }
            catch (err) {
                return this.bot.sendMessage(botValue.msg.from.id, err);
            }
            return this.bot.sendMessage(userId, 'Subscribed successfully');
        }
    }
    public async remove(botValue: IBotManager) {
        console.log(botValue.msg);
        const text = botValue.props.match[1];
        if (text) {
            const url = text;
            const userId = botValue.msg.from.id;
            try {
                await this.feedManager.remove(userId, url);
            }
            catch (err){
                return this.bot.sendMessage(botValue.msg.from.id, err);
            }
            return this.bot.sendMessage(userId, 'Remove successful');
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
             'Are you sure you subscribed to RSS on this bot?');
    }
}

export default BotManager;
