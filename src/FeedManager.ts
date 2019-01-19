import Nedb from "./AsyncNeDB";
import { IDatebaseValue } from "./Interface";

class FeedManager {
    public db: Nedb;
    public map: Map<string, IDatebaseValue>;
    public constructor(filename: string = '../data/test.db') {
        this.db = new Nedb({ filename, autoload: true });
        this.map = new Map();
    }
    public async init() {
        this.map = await this.toHashMap();
        return this;
    }
    public add(
        userId: number,
        url: string,
        authorUpdateTime: string,
        updateTime: number = Date.now()): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const value = this.map.get(url) as IDatebaseValue;
            if (!value) {
                const addValue = {
                    url, updateTime,
                    users: [userId],
                    authorUpdateTime: new Date(authorUpdateTime).getTime(),
                };
                await this.db.insertAsync(addValue);
                this.map.set(url, addValue as IDatebaseValue);
                resolve();
            }
            if (value.users && value.users.indexOf(userId) === -1) {
                const newUserArrays = value.users;
                newUserArrays.push(userId);
                value.users = newUserArrays;
                await this.updateQuery(value, { $set: { users: newUserArrays }});
                this.map.set(url, value);
            }
            reject(new Error('Already exist'));
        });

    }
    public remove(userId: number, url: string) {
        return new Promise(async (resolve, reject) => {
            const value = this.map.get(url) as IDatebaseValue;
            if (value) {
                const users = value.users;
                users.splice(users.indexOf(userId), 1);
                if (users.length === 0) {
                    await this.db.removeAsync(value, { multi: false });
                    this.map.delete(url);
                }
                else {
                    value.users = users;
                    this.map.set(url, value);
                    await this.updateQuery( value, { $set: {users} } );
                }
                resolve();
            }
            reject(new Error('Does not exist'));
        });
    }
    public async updateQuery(needUpdateQuery: IDatebaseValue, updateQuery: any) {
        return new Promise(async (resolve, reject) => {
            const value = await this.db.findOneAsync(needUpdateQuery);
            if (value) {
                const res = await this.db.updateAsync(value, updateQuery, {});
                resolve(res);
            }
            reject(new Error());
        });
    }
    public async getFeedsByUserName(userId: number) {
        const list = [];
        for (const [key, value] of this.map) {
            if (value.users.indexOf(userId) !== -1) {
                list.push(key);
            }
        }
        return list;
    }

    public async getUpdateList() {
        const list = [];
        for (const value of this.map.values()) {
            if (Date.now() - value.updateTime > 3600) {
                list.push(value);
            }
        }
        return list;
    }

    public async getFeedsUserNameByUrl(url: string) {
        if (this.map.get(url) !== undefined) {
            return (this.map.get(url) as IDatebaseValue).users;
        }
    }

    private async toHashMap() {
        const list = await this.db.findAsync({}) as IDatebaseValue[];
        for (const index of list) {
            this.map.set(index.url, index);
        }
        return this.map;
    }
}

export default FeedManager;
