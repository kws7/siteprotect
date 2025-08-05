const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const app = express();
const port = process.env.PORT || 3000;

const redisClient = redis.createClient({
  socket: {
    host: 'redis',
    port: 6379
  }
});

redisClient.connect().catch(console.error);

app.use(bodyParser.json());

app.post('/__fp', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const { visitorId, timestamp } = req.body;

    const key = `fp:${visitorId}:ip:${ip}`;

    try {
        const count = await redisClient.incr(key);
        console.log(`[FP] ${timestamp} - ${visitorId} from IP ${ip} (seen ${count} times)`);
        res.status(200).send(`seen ${count} times`);
    } catch (err) {
        console.error('Redis error:', err);
        res.status(500).send('Redis error');
    }
});

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
