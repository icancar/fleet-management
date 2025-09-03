# MongoDB Atlas Setup (Cloud Database)

## Why Use MongoDB Atlas?

- ✅ **No local installation required**
- ✅ **Free tier available** (512MB storage)
- ✅ **Automatic backups**
- ✅ **Global availability**
- ✅ **Easy scaling**

## Step-by-Step Setup

### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free"
3. Sign up with your email or Google account

### 2. Create a Free Cluster

1. **Choose "M0 Sandbox"** (Free tier)
2. **Select a cloud provider** (AWS, Google Cloud, or Azure)
3. **Choose a region** closest to you
4. **Name your cluster** (e.g., "fleet-management")
5. Click "Create Cluster"

### 3. Set Up Database Access

1. Go to **Database Access** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Create a username and password (save these!)
5. Set privileges to **"Read and write to any database"**
6. Click **"Add User"**

### 4. Set Up Network Access

1. Go to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
4. Click **"Confirm"**

### 5. Get Your Connection String

1. Go to **Clusters** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"4.1 or later"**
5. Copy the connection string

### 6. Update Your Server Configuration

Create a `.env` file in your server directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/fleet-management?retryWrites=true&w=majority

# Client Configuration
CLIENT_URL=http://localhost:3000
```

**Replace:**

- `your-username` with your database username
- `your-password` with your database password
- `cluster0.xxxxx` with your actual cluster URL

### 7. Test the Connection

```bash
cd server
npm run dev
```

You should see:

```
✅ Connected to MongoDB successfully
🗄️ MongoDB connected and ready
```

## Troubleshooting

### Connection Issues

1. **Check your connection string** - make sure username/password are correct
2. **Verify network access** - ensure "Allow Access from Anywhere" is set
3. **Check cluster status** - make sure your cluster is running

### Common Errors

**"Authentication failed"**

- Double-check username and password
- Make sure the user has read/write permissions

**"Network timeout"**

- Check your internet connection
- Verify the cluster is in a region close to you

**"Invalid connection string"**

- Make sure the connection string is properly formatted
- Check for special characters in password (may need URL encoding)

## Benefits of Atlas vs Local MongoDB

| Feature      | Local MongoDB  | MongoDB Atlas       |
| ------------ | -------------- | ------------------- |
| Setup        | Complex        | Simple              |
| Maintenance  | Manual         | Automatic           |
| Backups      | Manual         | Automatic           |
| Scaling      | Manual         | Easy                |
| Cost         | Free           | Free tier available |
| Availability | Single machine | Global              |

## Next Steps

Once you have Atlas set up:

1. **Start your server** with `npm run dev`
2. **Test with your Android app** - location data will be saved to Atlas
3. **View your data** in the Atlas web interface
4. **Monitor usage** in the Atlas dashboard

Your fleet management system will now have a cloud database that's always available! 🚀
