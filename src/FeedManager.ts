import Nedb from "./AsyncNeDB";
import { IDatebaseValue } from "./Interface";

class FeedManager {
    private db: Nedb;
    public constructor(filename: string = '../data/test.db') {
        this.db = new Nedb({ filename, autoload: true });
    }
    public add(
        userId: number,
        url: string,
        authorUpdateTime: string,
        updateTime: number = Date.now()): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const addValue = {
                userId, url, updateTime,
                authorUpdateTime: new Date(authorUpdateTime).getTime(),
            };
            const findValue = { userId, url };
            if (!(await this.db.findOneAsync(findValue))) {
                await this.db.insertAsync(addValue);
                resolve();
            }
            reject(new Error('Already eXist'));
        });

    }
    public remove(userId: number, url: string) {
        return new Promise(async (resolve, reject) => {
            const removeValue = { userId, url };
            const value = await this.db.findOneAsync(removeValue);
            if (value) {
                await this.db.removeAsync(value, { multi: false });
                resolve();
            }
            reject(new Error('Does not exist'));
        });
    }
    public async updateQuery(needUpdateQuery: IDatebaseValue, updateQuery: any) {
        return new Promise(async (resolve, reject) => {
            const value = await this.db.findOneAsync(needUpdateQuery);
            if (value) {
                await this.db.updateAsync(value, updateQuery, {});
                resolve();
            }
            reject(new Error());
        });
    }
    public async getFeedsByUserName(userId: number) {
        const findValue = { userId };
        const list = await this.db.findAsync(findValue) as IDatebaseValue[];
        const res: string[] = [];
        for (const index of list) {
            res.push(index.url);
        }
        return res;
    }

    public async getUpdateList() {
        const findValue = { updateTime: { $lte: Date.now() - 3600 } };
        return this.db.findAsync(findValue);
    }

    public async getFeedsUserNameByUrl(url: string) {
        const findValue = { url };
        return this.db.findAsync(findValue);
    }
}

export default FeedManager;
