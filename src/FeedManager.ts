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
                url, updateTime,
                users: [userId],
                authorUpdateTime: new Date(authorUpdateTime).getTime(),
            };
            const findValue = { url };
            const value = await this.db.findOneAsync(findValue) as IDatebaseValue;
            if (!value) {
                await this.db.insertAsync(addValue);
                resolve();
            }
            if (value.users && value.users.indexOf(userId) === -1) {
                const newUserArrays = value.users;
                newUserArrays.push(userId);
                await this.updateQuery(value, { $set: { users: newUserArrays }});
            }
            reject(new Error('Already exist'));
        });

    }
    public remove(userId: number, url: string) {
        return new Promise(async (resolve, reject) => {
            const removeValue = { userId, url };
            const value = await this.db.findOneAsync(removeValue) as IDatebaseValue;
            if (value) {
                const users = value.users;
                users.splice(users.indexOf(userId), 1);
                if (users.length === 0) await this.db.removeAsync(value, { multi: false });
                else await this.updateQuery( value, { $set: {users} } );
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

    private async toHashMap() {
        const map = new Map();
        let n = 0;
        const list = await this.db.findAsync({}) as IDatebaseValue[];
        for (const index of list) {
            map.set(index, n);
            n += 1;
        }
        return map;
    }
}

export default FeedManager;
