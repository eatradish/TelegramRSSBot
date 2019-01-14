import NeDB from 'nedb';

class AsyncNeDB extends NeDB {
    public findAsync(query: any) {
        return new Promise((resolve, reject) => {
            this.find(query, (err: Error, docs: any) => {
                if (err) reject(err);
                else resolve(docs);
            });
        });
    }

    public findOneAsync(query: any) {
        return new Promise((resolve, reject) => {
            this.findOne(query, (err, doc: {}) => {
                if (err) reject(err);
                else resolve(doc);
            });
        });
    }

    public insertAsync(doc: any) {
        return new Promise((resolve, reject) => {
            this.insert(doc, (err, newDoc) => {
                if (err) reject(err);
                else resolve(newDoc);
            });
        });
    }

    public removeAsync(query: any, options: NeDB.RemoveOptions) {
        return new Promise((resolve, reject) => {
            this.remove(query, options, (err, numRemoved) => {
                if (err) reject(err);
                else resolve(numRemoved);
            });
        });
    }

    public updateAsync(query: any, update: any, options: NeDB.UpdateOptions) {
        return new Promise((resolve, reject) => {
            this.update(query, update, options, (err, numReplaced) => {
                if (err) reject(err);
                else resolve(numReplaced);
            });
        });
    }
}

export default AsyncNeDB;
