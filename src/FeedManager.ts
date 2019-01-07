import Nedb from "./AsyncNeDB"
import { DatebaseValue } from "./Interface";

class FeedManager {
    private db: Nedb;
    public constructor(filename: string = '../data/test.db') {
        this.db = new Nedb({ filename, autoload: true });
    }
    public async add(userId: number, url: string
    , authorUpdateTime: string, updateTime: number = Date.now()) {
        let addValue = { userId, url, updateTime, 
            authorUpdateTime: new Date(authorUpdateTime).getTime() };
        let findValue = { userId, url };
        if(!(await this.db.findOneAsync(findValue))) {
            await this.db.insertAsync(addValue);
            return true;
        }
        return false;
    }
    public async remove(userId: number, url: string) {
        let removeValue = { userId, url };
        let value = await this.db.findOneAsync(removeValue);
        if(value) {
            this.db.removeAsync(value, { multi: false }); 
            return true;
        }
        return false;
    }
    public async updateQuery(needUpdateQuery: DatebaseValue, updateQuery: any) {
        let value = await this.db.findOneAsync(needUpdateQuery);
        if(value) {
            try {
                this.db.updateAsync(value, updateQuery, {});
                return true;
            }
            catch { return false; }
        }
        return false;
    }
    public async getFeedsByUserName(userId: number) {
        let findValue = { userId };
        let list = await this.db.findAsync(findValue) as DatebaseValue[];
        let res: string[] = [];
        for(let index of list) {
            res.push(index.url);
        }
        return res;
    }

    public async getUpdateList() {
        let findValue = {updateTime: { $lte: Date.now() - 3600 }};
        return this.db.findAsync(findValue);
    }

    public async getFeedsUserNameByUrl(url: string) {
        let findValue = { url };
        return this.db.findAsync(findValue);
    }
}

export default FeedManager;