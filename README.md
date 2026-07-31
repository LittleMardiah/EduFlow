# EduFlow Backend

All-in-One EdTech Platform for Assessment & Learning Analytics.

## Tech Stack
- Node.js 18+ (LTS)
- TypeScript 5.3+
- Express.js 4.18+
- PostgreSQL 14+ (Supabase)
- Prisma 5+
- JWT Authentication (HS256)
- Bcrypt (12 rounds)
- Jest + Supertest (testing)
- ESLint + Prettier + Husky

## Setup
1. Clone repo
2. `pnpm install`
3. Copy `.env.example` to `.env` and fill in values
4. `pnpm run migrate:dev`
5. `pnpm run dev`

## Environment Variables
See `.env.example` for all required variables.

## Scripts
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Run production build
- `pnpm run lint` - Lint code
- `pnpm run test` - Run tests
- `pnpm run migrate:dev` - Run Prisma migrations
