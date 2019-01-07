import Telebot from 'telebot'
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
    public startListen() {
        let feedManager = new FeedManager();
        this.bot.on(['/start', '/hello'], (msg) => msg.reply.text('Welcome!'));
        this.bot.on(/^\/add (.+)$/, async(msg, props) => {
            console.log(msg);
            const text = props.match[1];
            if(text) {
                let parser = new RssParser();
                try {
                    let rss = await parser.parseURL(text);
                    let authorUpdateTime = rss.items[0].pubDate;
                    let url = text;
                    let userId = msg.from.id;
                    let success = await feedManager.add(userId, url, authorUpdateTime);
                    if (success) return this.bot.sendMessage(userId, 'Subscription success');
                }
                catch {
                    return this.bot.sendMessage(msg.from.id, 
                        'The subscription failed. Are you sure this URL is an RSS URL?');
                }
            }
        });
        this.bot.on(/^\/remove (.+)$/, async(msg, props) => {
            console.log(msg);
            const text = props.match[1];
            if(text) {
                let url = text;
                let userId = msg.from.id;
                let success = await feedManager.remove(userId, url);
                if (success) return this.bot.sendMessage(userId, 'Remove successful');
            }
        });
        this.bot.on('/all', async(msg) => {
            console.log(msg);
            const chatId = msg.from.id; 
            let list = await feedManager.getFeedsByUserName(chatId);
            if(list.length != 0) {
                let res = list.join('\n');
                return this.bot.sendMessage(chatId, res);
            }
            else return this.bot.sendMessage(chatId,
                 'Are you sure you subscribed to RSS on this bot?');
        });
        this.bot.start();
    }
}

export default BotManager;