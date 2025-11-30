# Deployment Guide: Making Your Experiment Accessible Online

## The Problem

**Localhost (`http://localhost:5173`) only works on YOUR computer!**

Participants can't access `localhost` from their own devices. You need to deploy the app to a public URL first.

## Solution: Deploy to a Free Hosting Service

### Option 1: Vercel (Recommended - Easiest)

**Why Vercel:**
- ✅ Free tier (perfect for research)
- ✅ Automatic deployments from GitHub
- ✅ HTTPS included
- ✅ Custom domain support
- ✅ Environment variables support (for EmailJS)

**Steps:**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy from root directory:**
   ```bash
   # From the project root (not app/)
   vercel
   ```
   - Follow prompts (first time: login, link to GitHub)
   - When asked for project settings:
     - **Root Directory:** Set to `app` (this is critical!)
     - Framework Preset: Vite
     - Build Command: `npm run build` (or leave default)
     - Output Directory: `dist` (or leave default)

3. **OR configure in Vercel Dashboard:**
   - After first deployment, go to Vercel Dashboard
   - Project Settings → General
   - Set **Root Directory** to `app`
   - Save and redeploy

4. **Add Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `VITE_EMAILJS_SERVICE_ID=service_h4zb8rt`
     - `VITE_EMAILJS_TEMPLATE_ID=template_buqj89i`
     - `VITE_EMAILJS_PUBLIC_KEY=ueBtRU6s8iM8n3fM7`
   - Redeploy

5. **Get Your URL:**
   - Vercel gives you: `https://your-project.vercel.app`
   - This is your **production URL**

6. **Generate Links:**
   ```bash
   python scripts/generate_participant_links.py \
     --base-url "https://your-project.vercel.app" \
     --participants 25 \
     --sessions 3
   ```

### Option 2: Netlify (Alternative)

**Steps:**

1. **Build the app:**
   ```bash
   cd app
   npm run build
   ```

2. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

3. **Deploy:**
   ```bash
   cd app
   netlify deploy --prod --dir=dist
   ```
   - First time: login and authorize
   - Follow prompts

4. **Add Environment Variables:**
   - Netlify Dashboard → Site Settings → Environment Variables
   - Add the same EmailJS variables as above

5. **Get Your URL:**
   - Netlify gives you: `https://your-project.netlify.app`

### Option 3: GitHub Pages (Free but More Setup)

**Steps:**

1. **Update `vite.config.ts`:**
   ```typescript
   export default defineConfig({
     base: '/xr-adaptive-modality-2025/', // Your repo name
     // ... rest of config
   })
   ```

2. **Build:**
   ```bash
   cd app
   npm run build
   ```

3. **Deploy to GitHub Pages:**
   - Go to GitHub repo → Settings → Pages
   - Source: `app/dist` folder
   - Or use GitHub Actions (more complex)

4. **URL:** `https://yourusername.github.io/xr-adaptive-modality-2025/`

## After Deployment

### Step 1: Get Your Production URL

After deploying, you'll get a URL like:
- `https://your-project.vercel.app` (Vercel)
- `https://your-project.netlify.app` (Netlify)
- `https://yourusername.github.io/xr-adaptive-modality-2025/` (GitHub Pages)

### Step 2: Generate Participant Links

```bash
python scripts/generate_participant_links.py \
  --base-url "https://your-project.vercel.app" \
  --participants 25 \
  --sessions 3 \
  --output participant_links.csv
```

This creates links like:
- `https://your-project.vercel.app/?pid=P001&session=1`
- `https://your-project.vercel.app/?pid=P001&session=2`
- etc.

### Step 3: Share Links with Participants

- Send Session 1 link: `https://your-project.vercel.app/?pid=P001&session=1`
- After they complete Session 1, send Session 2 link
- And so on...

## Important: Environment Variables

**Don't forget to add EmailJS credentials to your hosting platform!**

**Vercel:**
1. Dashboard → Project → Settings → Environment Variables
2. Add all three `VITE_EMAILJS_*` variables
3. Redeploy

**Netlify:**
1. Site Settings → Environment Variables
2. Add all three `VITE_EMAILJS_*` variables
3. Redeploy

## Testing Deployment

1. **Deploy the app** (Vercel/Netlify)
2. **Visit your production URL** in a browser
3. **Test with a participant link:**
   - `https://your-project.vercel.app/?pid=P001&session=1`
4. **Verify:**
   - App loads correctly
   - Participant ID is detected
   - Session tracking works
   - Email submission works (test with "End Session")

## Alternative: In-Person Data Collection

If you prefer to collect data in-person:

1. **Bring your laptop** to the lab
2. **Run `npm run dev`** on your laptop
3. **Participants use your laptop** to complete the experiment
4. **No deployment needed** - use localhost
5. **Data collection happens on your machine**

**Pros:**
- No deployment needed
- Full control over environment
- No internet required

**Cons:**
- Participants must come to lab
- You need to be present
- Can't run remotely

## Recommendation

**For Remote Data Collection:**
- Deploy to Vercel (easiest)
- Generate links with production URL
- Share links with participants
- They complete on their own devices

**For In-Person Data Collection:**
- Use localhost on your laptop
- Participants use your laptop
- No deployment needed

Choose based on your study design!

