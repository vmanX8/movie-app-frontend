# Movie App Frontend

React frontend for the Movie App with dark theme and JWT authentication.

## Features

- Modern React with TypeScript
- Dark theme UI with Tailwind CSS
- JWT authentication
- Movie CRUD operations
- Responsive design
- Form validation

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + SCSS
- **HTTP Client**: Fetch API
- **Deployment**: Vercel

## Environment Variables

Create a `.env` file with:

```env
VITE_API_BASE=https://your-render-backend-url.onrender.com
```

## Local Development

```bash
npm install
npm run dev
```

## Deployment to Vercel

1. **Connect Repository**:
   - Import your GitHub repository to Vercel
   - Vercel will automatically detect it as a Vite project

2. **Environment Variables**:
   - Add `VITE_API_BASE` with your Render backend URL
   - Example: `https://movie-app-backend.onrender.com`

3. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**:
   - Vercel will automatically deploy on every push to main branch

## API Integration

The frontend communicates with the backend API for:
- User authentication (login/register)
- Movie management (CRUD operations)
- JWT token handling for protected routes

## CORS

Ensure your backend allows requests from your Vercel domain. Update the CORS configuration in the backend if needed.