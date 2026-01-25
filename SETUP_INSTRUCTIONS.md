# Blog CRUD Application Setup

## Prerequisites

This application requires:
- Node.js 16+
- MongoDB Atlas account (for MongoDB connection)
- Cloudinary account (for image storage)

## Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

### MongoDB Configuration
\`\`\`
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blog?retryWrites=true&w=majority
\`\`\`

### Cloudinary Configuration
\`\`\`
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
\`\`\`

## Getting Environment Variables

### MongoDB
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new account or login
3. Create a new cluster
4. Get the connection string from "Connect" button
5. Replace username and password with your credentials

### Cloudinary
1. Go to [Cloudinary](https://cloudinary.com)
2. Sign up for a free account
3. Go to Dashboard
4. Copy your:
   - Cloud Name
   - API Key
   - API Secret

## Admin Credentials

Default admin login:
- Email: `admin@gmail.com`
- Password: `admin123`

> Note: These are hardcoded. To change, edit `/app/api/auth/login/route.ts`

## Installation & Running

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Visit http://localhost:3000
\`\`\`

## Features

- Admin authentication with hardcoded credentials
- Create blogs with title, description, tags, and content
- Rich text editor for blog content
- Image upload to Cloudinary
- Edit existing blogs
- Delete blogs
- View all blogs on public page
- Full CRUD operations with MongoDB

## Project Structure

\`\`\`
app/
├── admin/
│   ├── login/          # Admin login page
│   ├── dashboard/      # Blog listing page
│   ├── create/         # Create new blog
│   └── edit/[id]/      # Edit existing blog
├── api/
│   ├── auth/           # Authentication endpoints
│   ├── blogs/          # Blog CRUD endpoints
│   └── upload/         # Image upload endpoint
└── page.tsx            # Public blog listing

components/
├── admin-guard.tsx     # Auth protection wrapper
├── blog-card.tsx       # Blog card component
├── image-upload.tsx    # Image upload component
└── rich-text-editor.tsx # Rich text editor

lib/
├── mongodb.ts          # MongoDB connection
├── cloudinary.ts       # Cloudinary setup
└── models/
    └── Blog.ts         # Blog schema
\`\`\`

## Troubleshooting

### Images not uploading
- Verify Cloudinary environment variables are correct
- Check that the API key has upload permissions

### MongoDB connection failed
- Verify connection string in `.env.local`
- Ensure IP address is whitelisted in MongoDB Atlas
- Check username and password

### Admin login not working
- Verify email is exactly `admin@gmail.com` and password is `admin123`
- Check browser cookies are enabled
