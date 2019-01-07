## FeedsManager

### FeedsManager(db)

- `db`: 数据库

说明： 此为 FeedsManager 的构造方法

### add(userId, url)

- `userId`:  目标用户 ID

- `url`:  目标 rssurl

返回值: 无

说明: 用于保存订阅

### getFeeds(time)

- `time`: 更新时间

返回值: 无

说明: 获取需要更新的 feed

### update(url，time)

- `url`:  目标 rssurl

- `time`: 更新时间

返回值: 无

说明:设置最后更新时间

### remove(userId, url)

- `userId`:  用户 ID

- `url`: 目标 rssurl

返回值: 无

说明: 用于删除订阅

### getFeedsByUserName(userId)

- `userId`:  用户 ID

返回值:  该用户订阅的 rssurl 列表

说明：获取一个用户订阅的所有 rssurl 列表
