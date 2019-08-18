import NeDB from 'nedb';

class AsyncNeDB extends NeDB {
    public findAsync(query: any): any {
        return new Promise((resolve, reject): any => {
            this.find(query, (err: Error, docs: any) => {
                if (err) reject(err);
                else resolve(docs);
            });
        });
    }

    public findOneAsync(query: any): any {
        return new Promise((resolve, reject): any => {
            this.findOne(query, (err, doc: {}) => {
                if (err) reject(err);
                else resolve(doc);
            });
        });
    }

    public insertAsync(doc: any): any {
        return new Promise((resolve, reject): any => {
            this.insert(doc, (err, newDoc) => {
                if (err) reject(err);
                else resolve(newDoc);
            });
        });
    }

    public removeAsync(query: any, options: NeDB.RemoveOptions): any {
        return new Promise((resolve, reject): any => {
            this.remove(query, options, (err, numRemoved) => {
                if (err) reject(err);
                else resolve(numRemoved);
            });
        });
    }

    public updateAsync(query: any, update: any, options: NeDB.UpdateOptions): any {
        return new Promise((resolve, reject): any => {
            this.update(query, update, options, (err, numReplaced) => {
                if (err) reject(err);
                else resolve(numReplaced);
            });
        });
    }
}

export default AsyncNeDB;
