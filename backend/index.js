const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

console.log('Starting SiteProtect backend...');

const redisClient = redis.createClient({
  socket: {
    host: 'redis',
    port: 6379
  }
});

console.log('Connecting to Redis...');
redisClient.connect().then(() => {
  console.log('Successfully connected to Redis');
}).catch((err) => {
  console.error('Failed to connect to Redis:', err);
});

app.use(bodyParser.json());

// Enhanced fingerprinting endpoint
app.post('/__fp', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { visitorId, timestamp, fingerprint } = req.body;

    const key = `fp:${visitorId}:ip:${ip}`;
    const statsKey = `stats:${ip}`;
    const fingerprintKey = `fingerprint:${visitorId}`;

    try {
        // Increment visit count for this fingerprint/IP combination
        const count = await redisClient.incr(key);
        
        // Store detailed fingerprint data
        await redisClient.hSet(fingerprintKey, {
            ip: ip,
            userAgent: userAgent,
            fingerprint: JSON.stringify(fingerprint),
            firstSeen: timestamp,
            lastSeen: timestamp,
            visitCount: count
        });
        
        // Update last seen timestamp
        await redisClient.hSet(fingerprintKey, 'lastSeen', timestamp);
        
        // Store IP statistics
        await redisClient.hIncrBy(statsKey, 'totalHits', 1);
        await redisClient.hSet(statsKey, 'lastSeen', timestamp);
        
        console.log(`[FP] ${new Date(timestamp).toISOString()} - ${visitorId} from IP ${ip} (seen ${count} times)`);
        res.status(200).send(`seen ${count} times`);
    } catch (err) {
        console.error('Redis error:', err);
        res.status(500).send('Redis error');
    }
});

// Serve fingerprint.js script
app.get('/fingerprint.js', (req, res) => {
    const scriptPath = path.join(__dirname, 'fingerprint.js');
    if (fs.existsSync(scriptPath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(scriptPath);
    } else {
        res.status(404).send('Fingerprint script not found');
    }
});

// Admin page endpoint
app.get('/admin/', (req, res) => {
    const adminPath = path.join(__dirname, 'admin.html');
    if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
    } else {
        res.status(404).send('Admin page not found');
    }
});

// Admin API endpoint to get statistics
app.get('/admin/api/stats', async (req, res) => {
    try {
        // Get all fingerprint keys
        const fingerprintKeys = await redisClient.keys('fingerprint:*');
        const statsKeys = await redisClient.keys('stats:*');
        
        const fingerprints = [];
        const ipStats = [];
        
        // Get fingerprint data
        for (const key of fingerprintKeys) {
            const data = await redisClient.hGetAll(key);
            if (data.ip) {
                fingerprints.push({
                    visitorId: key.replace('fingerprint:', ''),
                    ip: data.ip,
                    userAgent: data.userAgent,
                    visitCount: parseInt(data.visitCount) || 0,
                    firstSeen: new Date(parseInt(data.firstSeen)).toISOString(),
                    lastSeen: new Date(parseInt(data.lastSeen)).toISOString()
                });
            }
        }
        
        // Get IP statistics
        for (const key of statsKeys) {
            const data = await redisClient.hGetAll(key);
            if (data.totalHits) {
                ipStats.push({
                    ip: key.replace('stats:', ''),
                    totalHits: parseInt(data.totalHits),
                    lastSeen: new Date(parseInt(data.lastSeen)).toISOString()
                });
            }
        }
        
        // Sort by visit count (descending)
        fingerprints.sort((a, b) => b.visitCount - a.visitCount);
        ipStats.sort((a, b) => b.totalHits - a.totalHits);
        
        res.json({
            fingerprints,
            ipStats,
            totalVisitors: fingerprints.length,
            totalIPs: ipStats.length
        });
    } catch (err) {
        console.error('Error getting admin data:', err);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`✅ Backend listening on port ${port}`);
    console.log(`📊 Admin dashboard: http://localhost:${port}/admin/`);
    console.log(`🔍 Health check: http://localhost:${port}/health`);
});
