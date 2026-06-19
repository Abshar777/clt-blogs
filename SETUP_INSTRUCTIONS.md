# Blog CRUD Application Setup

## Prerequisites

This application requires:
- Node.js 18+
- MongoDB Atlas account (for MongoDB connection)
- Cloudflare R2 bucket (for image storage)

## Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

### MongoDB Configuration
\`\`\`
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/blog?retryWrites=true&w=majority
\`\`\`

### Cloudflare R2 Configuration
\`\`\`
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=your-r2-bucket-name
# Public URL for the bucket (R2.dev domain or custom domain), no trailing slash
R2_PUBLIC_BASE_URL=https://pub-xxxxxxxx.r2.dev
\`\`\`

## Getting Environment Variables

### MongoDB
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new account or login
3. Create a new cluster
4. Get the connection string from "Connect" button
5. Replace username and password with your credentials

### Cloudflare R2
1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com) → R2
2. Create a bucket
3. Under **Settings → Public access**, enable an R2.dev public URL (or attach a
   custom domain) and use it as `R2_PUBLIC_BASE_URL`
4. Under **Manage R2 API Tokens**, create an API token with Object Read & Write
   and copy the Access Key ID and Secret Access Key
5. Your Account ID is shown in the R2 overview page

## Admin Credentials

Default admin login:
- Username: `admin_root`
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
- Image upload to Cloudflare R2
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
├── r2.ts               # Cloudflare R2 (S3-compatible) client
└── models/
    └── Blog.ts         # Blog schema

scripts/
└── migrate-media-to-r2.mjs  # Backfill existing images into R2
\`\`\`

## Migrating Existing Images to R2

If you already have blogs with images hosted elsewhere (e.g. Cloudinary), copy
them into R2 and rewrite the stored URLs:

\`\`\`bash
# Dry run — shows what would be migrated, changes nothing
npm run migrate:media

# Apply — uploads to R2 and updates the database
node scripts/migrate-media-to-r2.mjs --apply
\`\`\`

The script is idempotent: blogs whose `photo` already points at
`R2_PUBLIC_BASE_URL` are skipped.

## Troubleshooting

### Images not uploading
- Verify the `R2_*` environment variables are correct
- Ensure the R2 API token has Object Read & Write permission
- Confirm `R2_PUBLIC_BASE_URL` is the bucket's public URL with no trailing slash

### MongoDB connection failed
- Verify connection string in `.env`
- Ensure IP address is whitelisted in MongoDB Atlas
- Check username and password

### Admin login not working
- Verify username is exactly `admin_root` and password is `admin123`
- Check browser cookies are enabled
