# Dynamic API Dashboard

A Next.js dashboard for monitoring and managing API endpoints with dynamic base URL configuration.

## Features

- 📊 **Dashboard Statistics** - View total users, sessions, messages, and analytics
- 👥 **User Management** - Browse users, view detailed profiles, and manage user data
- 🔄 **Active Sessions** - Monitor real-time user sessions
- 📈 **Analytics** - Daily analytics with interactive charts
- 🧪 **API Testing** - Built-in endpoint testing tools
- 🔧 **Dynamic Configuration** - Configure API base URL and prefix on the fly

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A running API server (FastAPI or similar)

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/dynamic-api-dashboard.git
cd dynamic-api-dashboard
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

1. When you first open the app, you'll be prompted to enter your API base URL
2. Enter your API server URL (e.g., `http://51.38.234.197:8000`)
3. Optionally configure the API prefix (default: `/api/v1/chat`)

## API Requirements

Your API server should have the following endpoints:

- `GET /dashboard/stats` - Dashboard statistics
- `GET /dashboard/users` - User list with pagination
- `GET /dashboard/sessions/active` - Active sessions
- `GET /dashboard/analytics/daily` - Daily analytics
- `GET /user/{id}` - User details
- `GET /history/{id}` - User conversation history

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── test/             # Testing utilities
│   └── page.tsx          # Home page with URL configuration
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── dashboard-*.tsx  # Dashboard-specific components
│   └── *.tsx           # Other components
├── lib/                 # Utilities and services
│   ├── api-service.ts   # API service with CORS handling
│   └── utils.ts        # Utility functions
└── public/             # Static assets
\`\`\`

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms
- **Railway**: Connect GitHub repo and deploy
- **Netlify**: Connect GitHub repo and deploy
- **Render**: Connect GitHub repo and deploy

## CORS and HTTPS Issues

If you encounter CORS or mixed content issues:

1. **Run locally**: Use `npm run dev` for development
2. **Enable HTTPS on your API server**: Use SSL certificates
3. **Use a reverse proxy**: nginx with SSL
4. **Deploy both to HTTPS**: Use platforms that provide HTTPS

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.
