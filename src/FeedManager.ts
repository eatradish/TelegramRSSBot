import Nedb from "./AsyncNeDB";
import { DatebaseValue } from "./Interface";

class FeedManager {
    private db: Nedb;
    private map: Map<string, DatebaseValue>;
    public constructor(filename = './data/test.db') {
        this.db = new Nedb({ filename, autoload: true });
        this.map = new Map();
    }
    public getMap(): Map<string, DatebaseValue> {
        return this.map;
    }
    public setMap(needSet: DatebaseValue): void {
        this.map.set(needSet.url, needSet);
    }
    public async init(): Promise<FeedManager> {
        this.map = await this.toHashMap();
        return this;
    }
    public add(
        userId: number,
        url: string,
        title: string,
        authorUpdateTime: string,
        updateTime: number = Date.now()):
        Promise<void | Error> {
        return new Promise((resolve, reject): void | Error => {
            const value = this.map.get(url) as DatebaseValue;
            if (value === undefined) {
                const addValue = {
                    url, updateTime, title,
                    users: [userId],
                    authorUpdateTime: new Date(authorUpdateTime).getTime(),
                    msgids: [],
                };
                this.db.insertAsync(addValue);
                this.map.set(url, addValue as DatebaseValue);
                resolve();
            }
            else if (value.users && value.users.indexOf(userId) === -1) {
                const newValue = JSON.parse(JSON.stringify(value)) as DatebaseValue;
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
    public remove(userId: number, url: string): Promise<void> {
        return new Promise((resolve, reject): void | Error => {
            const value = this.map.get(url) as DatebaseValue;
            if (value !== undefined) {
                const newValue = JSON.parse(JSON.stringify(value)) as DatebaseValue;
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
    public async updateQuery(needUpdateQuery: DatebaseValue, updateQuery: any): Promise<any | Error> {
        const value = await this.db.findOneAsync(needUpdateQuery);
        if (value) return await this.db.updateAsync(value, updateQuery, {});
        else throw new Error("value is null");
    }
    public getFeedsByUserName(userId: number): string[] {
        const list = [];
        for (const [key, value] of this.map) {
            if (value.users.indexOf(userId) !== -1) {
                list.push(value.title + ': ' + key);
            }
        }
        return list;
    }

    public getUpdateList(): DatebaseValue[] {
        const list = [];
        for (const value of this.map.values()) {
            if (Date.now() - value.updateTime > 3600) {
                list.push(value);
            }
        }
        return list;
    }

    public getFeedsUserNameByUrl(url: string): number[] | undefined {
        if (this.map.get(url) !== undefined) {
            return (this.map.get(url) as DatebaseValue).users;
        }
    }

    private async toHashMap(): Promise<Map<string, DatebaseValue>> {
        const list = await this.db.findAsync({}) as DatebaseValue[];
        for (const index of list) {
            this.map.set(index.url, index);
        }
        return this.map;
    }
}

export default FeedManager;
