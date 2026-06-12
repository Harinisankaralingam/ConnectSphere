# ConnectSphere 🌐

> A professional full-stack social media platform built with Node.js, Express, MongoDB, and vanilla JavaScript.

![ConnectSphere](https://img.shields.io/badge/ConnectSphere-v1.0.0-4F46E5?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?style=for-the-badge&logo=mongodb)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 JWT Auth | Secure registration & login with bcrypt password hashing |
| 👤 User Profiles | Avatar, cover photo, bio, website, location |
| 📝 Posts | Create, edit, delete posts with up to 5 images |
| ❤️ Likes | Like/unlike posts and comments |
| 💬 Comments | Threaded comments with likes |
| 👥 Follow System | Follow/unfollow users, followers & following counts |
| 🔔 Notifications | Real-time badge for likes, comments, follows |
| 🔍 Search | Search users, posts, and hashtags |
| 🔖 Saved Posts | Bookmark posts to read later |
| 📖 Stories | 24-hour photo stories |
| 📊 Analytics | Profile views, likes, engagement stats |
| 🌙 Dark Mode | Full dark/light theme toggle |
| 📱 Responsive | Mobile, tablet, and desktop layouts |

---

## 🗂 Project Structure

```
connectsphere/
├── backend/
│   ├── config/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   ├── commentController.js
│   │   ├── notificationController.js
│   │   ├── storyController.js
│   │   └── searchController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   ├── Follower.js
│   │   ├── Notification.js
│   │   └── Story.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── posts.js
│   │   ├── comments.js
│   │   ├── notifications.js
│   │   ├── stories.js
│   │   └── search.js
│   ├── uploads/          ← auto-created on first run
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── config.js
    │   ├── utils.js
    │   ├── api.js
    │   ├── auth.js
    │   ├── components.js
    │   ├── pages.js
    │   ├── router.js
    │   └── app.js
    └── index.html
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local) or a MongoDB Atlas account
- npm or yarn

### 1. Clone / Download the project

```bash
git clone https://github.com/yourname/connectsphere.git
cd connectsphere
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/connectsphere
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5000
```

### 4. (Optional) Seed demo data

```bash
node seed.js
```

This creates a demo account:
- **Email:** `demo@connectsphere.app`
- **Password:** `demo123`

### 5. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Open **http://localhost:5000** — the backend serves the frontend automatically.

---

## 🌐 Deploy to Render (Free)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourname/connectsphere.git
git push -u origin main
```

### Step 2 — Create MongoDB Atlas cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. Add a database user (username + password)
4. Add `0.0.0.0/0` to IP Access List
5. Copy your connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/connectsphere
   ```

### Step 3 — Deploy on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Add Environment Variables:
   ```
   MONGODB_URI   = mongodb+srv://...your Atlas URI...
   JWT_SECRET    = your_super_secret_key_here
   NODE_ENV      = production
   FRONTEND_URL  = https://your-app.onrender.com
   ```
5. Click **Create Web Service**

Render auto-deploys on every git push.

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/users/:username` | Get profile |
| PUT  | `/api/users/profile/update` | Update profile |
| POST | `/api/users/profile/avatar` | Upload avatar |
| POST | `/api/users/profile/cover` | Upload cover |
| POST | `/api/users/:id/follow` | Follow/unfollow |
| GET  | `/api/users/:username/followers` | Get followers |
| GET  | `/api/users/:username/following` | Get following |
| GET  | `/api/users/suggested` | Suggested users |
| GET  | `/api/users/analytics` | Profile analytics |
| GET  | `/api/users/saved` | Saved posts |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/posts/feed` | Home feed |
| GET  | `/api/posts/explore` | Public posts |
| GET  | `/api/posts/trending` | Trending hashtags |
| GET  | `/api/posts/user/:username` | User's posts |
| POST | `/api/posts` | Create post |
| PUT  | `/api/posts/:id` | Edit post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Like/unlike |
| POST | `/api/posts/:id/save` | Save/unsave |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/comments/:postId` | Get comments |
| POST | `/api/comments/:postId` | Add comment |
| DELETE | `/api/comments/:id` | Delete comment |
| POST | `/api/comments/:id/like` | Like comment |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/notifications` | Get all |
| GET  | `/api/notifications/unread-count` | Unread count |
| PUT  | `/api/notifications/mark-all-read` | Mark all read |

### Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/stories/feed` | Stories feed |
| POST | `/api/stories` | Create story |
| POST | `/api/stories/:id/view` | Mark viewed |
| DELETE | `/api/stories/:id` | Delete story |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/search?q=term` | Search all |

---

## 🛠 Tech Stack

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT + bcryptjs
- Multer (image uploads)
- Helmet + CORS + Rate Limiting

**Frontend**
- Vanilla JavaScript (SPA with custom router)
- CSS3 (custom design system, glassmorphism, dark mode)
- Font Awesome icons
- Google Fonts (Inter)

---

## 📄 License

MIT © 2024 ConnectSphere
