# MongoDB Setup for Fleet Management

## Prerequisites

1. **Install MongoDB** on your system:
   - **macOS**: `brew install mongodb-community`
   - **Ubuntu/Debian**: `sudo apt-get install mongodb`
   - **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

## Quick Start

### 1. Start MongoDB Service

**macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
net start MongoDB
```

### 2. Verify MongoDB is Running

```bash
mongosh
```

You should see the MongoDB shell. Type `exit` to quit.

### 3. Start the Fleet Management Server

```bash
cd server
npm run dev
```

The server will automatically connect to MongoDB at `mongodb://localhost:27017/fleet-management`.

## Database Structure

### Collections

1. **locationlogs** - Stores all location data from devices
2. **devices** - Stores device information and statistics

### Sample Data

Once you start receiving location data from your Android app, you'll see:

```javascript
// locationlogs collection
{
  _id: ObjectId("..."),
  deviceId: "SAMSUNG_GALAXY_S21_13_12345678",
  latitude: 44.7866,
  longitude: 20.4489,
  accuracy: 5.0,
  timestamp: ISODate("2024-01-15T10:30:00.000Z"),
  speed: 15.5,
  bearing: 45.0,
  altitude: 120.0,
  createdAt: ISODate("2024-01-15T10:30:00.000Z"),
  updatedAt: ISODate("2024-01-15T10:30:00.000Z")
}

// devices collection
{
  _id: ObjectId("..."),
  deviceId: "SAMSUNG_GALAXY_S21_13_12345678",
  deviceFingerprint: "SAMSUNG_GALAXY_S21_13_12345678",
  manufacturer: "Samsung",
  model: "Galaxy S21",
  androidVersion: "13",
  imei: "123456789012345",
  firstSeen: ISODate("2024-01-15T10:00:00.000Z"),
  lastSeen: ISODate("2024-01-15T10:30:00.000Z"),
  totalLocations: 150,
  isActive: true,
  createdAt: ISODate("2024-01-15T10:00:00.000Z"),
  updatedAt: ISODate("2024-01-15T10:30:00.000Z")
}
```

## API Endpoints

### Location Data
- `POST /api/location` - Receive location data from Android app
- `GET /api/location/devices` - Get all devices
- `GET /api/location/devices/:deviceId/stats` - Get device statistics
- `GET /api/location/routes/device/:deviceId?date=2024-01-15` - Get daily routes

### Example Usage

```bash
# Get all devices
curl http://localhost:3001/api/location/devices

# Get device statistics
curl http://localhost:3001/api/location/devices/SAMSUNG_GALAXY_S21_13_12345678/stats

# Get daily routes
curl http://localhost:3001/api/location/routes/device/SAMSUNG_GALAXY_S21_13_12345678?date=2024-01-15
```

## Troubleshooting

### MongoDB Connection Issues

1. **Check if MongoDB is running:**
   ```bash
   ps aux | grep mongod
   ```

2. **Check MongoDB logs:**
   ```bash
   tail -f /usr/local/var/log/mongodb/mongo.log
   ```

3. **Test connection:**
   ```bash
   mongosh --eval "db.runCommand('ping')"
   ```

### Server Issues

1. **Check server logs** for MongoDB connection errors
2. **Verify environment variables** in your `.env` file
3. **Ensure MongoDB is accessible** on the default port 27017

## Production Considerations

For production deployment:

1. **Use MongoDB Atlas** (cloud) or **MongoDB Enterprise**
2. **Set up authentication** and **authorization**
3. **Configure SSL/TLS** for secure connections
4. **Set up backup** and **monitoring**
5. **Use environment variables** for connection strings

## Environment Variables

Create a `.env` file in the server directory:

```env
MONGODB_URI=mongodb://localhost:27017/fleet-management
PORT=3001
NODE_ENV=development
```
