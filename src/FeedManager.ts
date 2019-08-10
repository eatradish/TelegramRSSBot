import Nedb from "./AsyncNeDB";
import { IDatebaseValue } from "./Interface";

class FeedManager {
    private db: Nedb;
    private map: Map<string, IDatebaseValue>;
    public constructor(filename: string = './data/test.db') {
        this.db = new Nedb({ filename, autoload: true });
        this.map = new Map();
    }
    public getMap() {
        return this.map;
    }
    public setMap(needSet: IDatebaseValue) {
        this.map.set(needSet.url, needSet);
    }
    public async init() {
        this.map = await this.toHashMap();
        return this;
    }
    public add(
        userId: number,
        url: string,
        title: string,
        authorUpdateTime: string,
        updateTime: number = Date.now()):
        Promise<void> {
        return new Promise((resolve, reject) => {
            const value = this.map.get(url) as IDatebaseValue;
            if (value === undefined) {
                const addValue = {
                    url, updateTime, title,
                    users: [userId],
                    authorUpdateTime: new Date(authorUpdateTime).getTime(),
                    msgids: [],
                };
                this.db.insertAsync(addValue);
                this.map.set(url, addValue as IDatebaseValue);
                resolve();
            }
            else if (value.users && value.users.indexOf(userId) === -1) {
                const newValue = JSON.parse(JSON.stringify(value)) as IDatebaseValue;
                const newUserArrays = value.users.slice();
                newUserArrays.push(userId);
                newValue.users = newUserArrays;
                this.updateQuery(value, { $set: { users: newUserArrays } });
                this.map.set(url, newValue);
                resolve();
            }
            reject(new Error('item already exist'));
        });
    }
    public remove(userId: number, url: string) {
        return new Promise((resolve, reject) => {
            const value = this.map.get(url) as IDatebaseValue;
            if (value !== undefined) {
                const newValue = JSON.parse(JSON.stringify(value)) as IDatebaseValue;
                const users = value.users.slice();
                users.splice(users.indexOf(userId), 1);
                if (users.length === 0) {
                    this.db.removeAsync(value, { multi: false });
                    this.map.delete(url);
                }
                else {
                    newValue.users = users;
                    this.map.set(url, newValue);
                    this.updateQuery(value, { $set: { users } });
                }
                resolve();
            }
            reject(new Error('item does not exist'));
        });
    }
    public async updateQuery(needUpdateQuery: IDatebaseValue, updateQuery: any) {
        const value = await this.db.findOneAsync(needUpdateQuery);
        if (value) return await this.db.updateAsync(value, updateQuery, {});
        else throw new Error("value is null");
    }
    public getFeedsByUserName(userId: number) {
        const list = [];
        for (const [key, value] of this.map) {
            if (value.users.indexOf(userId) !== -1) {
                list.push(value.title + ': ' + key);
            }
        }
        return list;
    }

    public getUpdateList() {
        const list = [];
        for (const value of this.map.values()) {
            if (Date.now() - value.updateTime > 3600) {
                list.push(value);
            }
        }
        return list;
    }

    public getFeedsUserNameByUrl(url: string) {
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
