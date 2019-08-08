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
        return new Promise(async (resolve, reject) => {
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
                const newUserArrays = value.users;
                newUserArrays.push(userId);
                value.users = newUserArrays;
                this.updateQuery(value, { $set: { users: newUserArrays }});
                this.map.set(url, value);
            }
            reject(new Error('Already exist'));
        });
    }
    public remove(userId: number, url: string) {
        return new Promise(async (resolve, reject) => {
            const value = this.map.get(url) as IDatebaseValue;
            if (value !== undefined) {
                const users = value.users;
                users.splice(users.indexOf(userId), 1);
                if (users.length === 0) {
                    this.db.removeAsync(value, { multi: false });
                    this.map.delete(url);
                }
                else {
                    value.users = users;
                    this.map.set(url, value);
                    this.updateQuery( value, { $set: {users} } );
                }
                resolve();
            }
            reject(new Error('Does not exist'));
        });
    }
    public updateQuery(needUpdateQuery: IDatebaseValue, updateQuery: any) {
        return new Promise(async (resolve, reject) => {
            const value = await this.db.findOneAsync(needUpdateQuery);
            if (value) {
                const res = await this.db.updateAsync(value, updateQuery, {});
                resolve(res);
            }
            reject(new Error());
        });
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
