# Vercel Deployment Guide

This guide will help you deploy your Broad backend API to Vercel with Supabase cloud.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Cloud Account**: Sign up at [supabase.com](https://supabase.com)
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Set up Supabase Cloud

1. **Create a new project** in Supabase dashboard
2. **Note down your project credentials**:
   - Project URL (e.g., `https://your-project.supabase.co`)
   - Anon/Public Key
   - Service Role Key (for server-side operations)

3. **Apply your migrations** to the cloud database:
   ```bash
   # Link your local project to the cloud project
   npx supabase link --project-ref your-project-ref
   
   # Push your migrations
   npx supabase db push
   ```

4. **Configure Authentication** in Supabase dashboard:
   - Go to Authentication > Settings
   - Enable Email and Phone providers
   - Configure your site URL and redirect URLs

## Step 2: Environment Variables

Create these environment variables in Vercel dashboard (or use `.env` file locally):

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Server Configuration
NODE_ENV=production
PORT=3000

# CORS Configuration (optional)
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the configuration from `vercel.json`
5. Add your environment variables in the "Environment Variables" section
6. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## Step 4: Configure Environment Variables in Vercel

1. Go to your project dashboard in Vercel
2. Navigate to "Settings" > "Environment Variables"
3. Add all the environment variables listed in Step 2
4. Make sure to set them for "Production", "Preview", and "Development" environments

## Step 5: Test Your Deployment

1. **Health Check**: Visit `https://your-app.vercel.app/health`
2. **API Documentation**: Visit `https://your-app.vercel.app/docs`
3. **Test Authentication**: Try the `/auth/signup` and `/auth/login` endpoints

## Important Considerations

### Limitations

1. **Execution Time**: Vercel functions have a 30-second timeout (configurable in `vercel.json`)
2. **Cold Starts**: First request after inactivity may be slower
3. **Stateless**: Each request is handled independently (no persistent connections)

### Database Connections

- Supabase handles connection pooling automatically
- No need to worry about connection limits with Supabase cloud

### File Structure

Your deployed structure will be:
```
/
├── api/
│   └── index.js          # Serverless function entry point
├── dist/                 # Compiled TypeScript
├── vercel.json          # Vercel configuration
└── package.json         # Dependencies and scripts
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Ensure all dependencies are in `package.json`
   - Check TypeScript compilation errors
   - Verify environment variables are set

2. **Runtime Errors**:
   - Check Vercel function logs in dashboard
   - Verify Supabase credentials
   - Ensure CORS is properly configured

3. **Database Connection Issues**:
   - Verify Supabase URL and keys
   - Check if migrations were applied to cloud database
   - Ensure RLS policies are correctly set

### Debugging

1. **View Logs**: Check Vercel dashboard > Functions > View Function Logs
2. **Local Testing**: Use `vercel dev` to test locally
3. **Environment Check**: Verify all environment variables are set correctly

## Performance Optimization

1. **Enable Edge Caching**: Add appropriate cache headers
2. **Optimize Bundle Size**: Remove unused dependencies
3. **Use Edge Functions**: Consider Vercel Edge Functions for better performance

## Security Checklist

- [ ] All sensitive data is in environment variables
- [ ] CORS is properly configured
- [ ] JWT secrets are secure and unique
- [ ] Supabase RLS policies are enabled
- [ ] API rate limiting is configured (if needed)

## Next Steps

After successful deployment:

1. **Set up monitoring** with Vercel Analytics
2. **Configure custom domain** if needed
3. **Set up CI/CD** for automatic deployments
4. **Monitor performance** and optimize as needed

Your backend API is now ready for production use with Vercel and Supabase cloud!