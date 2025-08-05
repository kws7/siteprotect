# SiteProtect - Reverse Proxy with Browser Fingerprinting

A reverse proxy that forwards requests to www.gortna.com while collecting browser fingerprints and IP addresses, storing the data in Redis and displaying statistics on an admin page.

## Features

- **Reverse Proxy**: Forwards all requests to www.gortna.com
- **Browser Fingerprinting**: Collects detailed browser fingerprint data using FingerprintJS
- **IP Tracking**: Records visitor IP addresses and visit counts
- **Redis Storage**: Stores all fingerprint and IP data in Redis
- **Admin Dashboard**: Beautiful admin interface at `/admin` showing visitor statistics
- **Real-time Updates**: Auto-refreshing admin dashboard with live data

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│    Nginx    │───▶│   Backend   │───▶│    Redis    │
│             │    │   Proxy     │    │   (Node.js)  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │www.gortna.com│
                   └─────────────┘
```

## Components

### Nginx Proxy
- Proxies requests to www.gortna.com
- Injects fingerprinting JavaScript into HTML responses
- Routes admin and API requests to the backend

### Backend (Node.js)
- Handles fingerprint data collection
- Stores data in Redis
- Serves admin dashboard
- Provides API endpoints for statistics

### Redis
- Stores visitor fingerprints
- Tracks IP address statistics
- Maintains visit counts and timestamps

## Quick Start

1. **Start the services**:
   ```bash
   docker-compose up -d
   ```

2. **Access the proxy**:
   - Main site: http://localhost:8080
   - Admin dashboard: http://localhost:8080/admin

3. **View statistics**:
   - Visit the admin page to see real-time visitor data
   - Data auto-refreshes every 30 seconds

## How It Works

1. **Request Flow**:
   - Client requests any page
   - Nginx proxies to www.gortna.com
   - HTML response is modified to include fingerprinting script
   - Script collects browser fingerprint and sends to backend
   - Backend stores data in Redis

2. **Fingerprinting**:
   - Uses FingerprintJS library for reliable browser identification
   - Collects screen resolution, user agent, timezone, and more
   - Tracks IP addresses and visit counts
   - Stores first and last seen timestamps

3. **Data Storage**:
   - Visitor fingerprints stored with unique IDs
   - IP statistics tracked separately
   - Visit counts incremented for each fingerprint/IP combination

## Admin Dashboard

The admin dashboard at `/admin` provides:

- **Summary Statistics**: Total visitors, unique IPs, total hits
- **Visitor Fingerprints**: Detailed table of all visitor data
- **IP Statistics**: IP address visit counts and last seen times
- **Real-time Updates**: Auto-refreshing data every 30 seconds
- **Beautiful UI**: Modern, responsive design

## API Endpoints

- `POST /__fp` - Submit fingerprint data
- `GET /admin/` - Admin dashboard HTML
- `GET /admin/api/stats` - JSON statistics API
- `GET /fingerprint.js` - Fingerprinting script

## Data Structure

### Redis Keys

- `fingerprint:{visitorId}` - Detailed visitor fingerprint data
- `fp:{visitorId}:ip:{ip}` - Visit count for fingerprint/IP combination
- `stats:{ip}` - IP address statistics

### Fingerprint Data

```json
{
  "visitorId": "unique_fingerprint_id",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "visitCount": 5,
  "firstSeen": "2024-01-01T00:00:00.000Z",
  "lastSeen": "2024-01-01T12:00:00.000Z",
  "fingerprint": {
    "screen": { "width": 1920, "height": 1080, ... },
    "navigator": { "language": "en-US", ... },
    "timezone": "America/New_York"
  }
}
```

## Development

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)

### Local Development
1. Clone the repository
2. Run `docker-compose up -d`
3. Access at http://localhost:8080

### Customization
- Modify `nginx/default.conf` to change proxy settings
- Update `backend/index.js` to add new data collection
- Customize `backend/admin.html` for different UI

## Security Notes

- This system collects detailed browser information
- IP addresses are stored and displayed
- Consider privacy implications and GDPR compliance
- Admin access should be protected in production

## Troubleshooting

1. **Redis connection errors**: Ensure Redis container is running
2. **Fingerprint not working**: Check browser console for JavaScript errors
3. **Admin page not loading**: Verify backend is running on port 3000
4. **Proxy not working**: Check nginx logs for configuration errors

## License

MIT License - see LICENSE file for details.
