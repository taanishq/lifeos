# LifeOS — Personal Operating System

A full-stack personal dashboard built to manage all major areas of life from a single web application. LifeOS combines goal tracking, nutrition logging, fitness tracking, finance management, career development, and journaling — with AI features powered by Google Gemini throughout.

**Live:** [lifeos-mu-nine.vercel.app](https://lifeos-mu-nine.vercel.app)

---

## Tech Stack

- **React 18** with Vite
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Router DOM** for client-side routing
- **Supabase** for database and authentication
- **Google Gemini API** (via backend) for AI features
- **xlsx** for Excel file parsing

---

## Features

### Dashboard
- Daily snapshot of goals, calories, protein, workout status, spending, and My Money balance
- Weekly performance score calculated from goals, nutrition, and fitness
- Real nutrition trend chart from actual meal data
- Today's meal plan widget with logged status
- Finance skills progress overview

### Goals Module
- Create daily goals with title, category, priority, due date, and notes
- Mark goals complete with one click
- Filter by today, all, completed, or pending
- **AI Verification** — upload a photo or describe your proof, Gemini analyzes and returns Verified / Likely Completed / Insufficient Evidence

### Nutrition Module
- **Today tab** — log meals in plain English, AI estimates calories, protein, carbs, and fat automatically
- **Meal Plan tab** — import a 3-week Excel meal plan, browse by week and day, tick meals as eaten to auto-log macros
- **Favorites tab** — save frequent meals (e.g. protein shake), one-click log to today
- Macro progress rings with custom daily targets
- Real weekly bar chart from actual meal logs

### Fitness Module
- Log workouts by category: Push, Pull, Legs, Abs, Running, Sports, Other
- Quick-add exercise suggestions per category
- lbs ↔ kg toggle for all weights
- Edit existing workouts — change exercises, sets, weights, reps
- **Calendar tab** — monthly view showing workout types by day
- **Strength tab** — progression chart filterable by exercise
- **Running tab** — log distance, duration, pace with its own progression chart
- **AI Recommendation** — suggests today's workout based on recent history

### Career Tracker
- **Skills** — track progress on DCF Modeling, LBO, Accounting, Excel, and more
- **Applications** — full job pipeline from Applied → Offer Received, update status inline
- **Email Import** — paste a confirmation email, AI extracts company, role, date, and notes automatically
- **Networking** — contact CRM with follow-up dates
- **Certifications** — track Bloomberg Market Concepts, FMVA, Wall Street Prep, and custom certs

### Finance Module
- **Overview** — monthly spending summary, pie chart by category, monthly trend bar chart
- **Transactions** — manual entry or bulk CSV import (Capital One, Discover, any bank)
- **Import CSV** — paste bank statement, AI auto-categorizes every transaction
- **My Money** — separate balance tracking for earned income, paycheck history, spending breakdown
- **Rent** — dedicated rent payment tracker with yearly history

### Journal Module
- Daily prompts: what went well, what could be better, what you learned, what you're grateful for
- Free-form notes
- Search all entries by keyword
- **AI Weekly Summary** — Gemini reads your last 7 entries and generates a personalized reflection

---

## Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx         # Navigation sidebar with sign out
│   └── CustomSelect.jsx    # Portal-based dropdown (fixes z-index issues)
├── context/
│   └── AppContext.jsx      # Global state + all Supabase operations
├── pages/
│   ├── Dashboard.jsx
│   ├── Goals.jsx
│   ├── Nutrition.jsx
│   ├── Fitness.jsx
│   ├── CareerTracker.jsx
│   ├── Finance.jsx
│   ├── Journal.jsx
│   └── Login.jsx
├── api.js                  # Backend API helper functions
├── supabase.js             # Supabase client initialization
├── App.jsx                 # Auth guard + routing
└── main.jsx
```

---

## Getting Started

### Prerequisites
- Node.js v22+
- A Supabase project
- The LifeOS backend running (see backend README)

### Installation

```bash
git clone https://github.com/taanishq/lifeos.git
cd lifeos
npm install
```

### Environment Variables

Create a `.env` file in the root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_backend_url
```

### Run Locally

```bash
npm run dev
```

App runs at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

---

## Database Setup

Run the following SQL in your Supabase SQL Editor to create all required tables:

```sql
create table goals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  title text, category text, priority text,
  date text, completed boolean default false, notes text
);

create table meals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  date text, meal text, foods text,
  calories numeric, protein numeric, carbs numeric, fat numeric
);

create table workouts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  date text, category text, notes text, exercises jsonb
);

create table transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  date text, description text, amount numeric,
  category text, used_my_money boolean default false
);

create table rent_history (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  date text, amount numeric, notes text
);

create table applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  company text, role text, location text,
  date_applied text, status text,
  interview_dates text, notes text
);

create table contacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text, company text, position text,
  date_contacted text, follow_up text, notes text
);

create table skills (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text, progress integer default 0, hours integer default 0,
  notes text, resources text
);

create table certifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text, progress integer default 0, completed boolean default false
);

create table journal_entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  date text, went_well text, could_be_better text,
  learned text, grateful text, free_form text
);

create table meal_plans (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  week_number integer, day_number integer, meal_type text,
  foods text, calories numeric, protein numeric,
  carbs numeric, fat numeric, logged boolean default false, log_date text
);

create table favorite_meals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text, foods text, calories numeric,
  protein numeric, carbs numeric, fat numeric
);
```

Disable RLS on all tables (single-user setup):
```sql
alter table goals disable row level security;
alter table meals disable row level security;
alter table workouts disable row level security;
alter table transactions disable row level security;
alter table rent_history disable row level security;
alter table applications disable row level security;
alter table contacts disable row level security;
alter table skills disable row level security;
alter table certifications disable row level security;
alter table journal_entries disable row level security;
alter table meal_plans disable row level security;
alter table favorite_meals disable row level security;
```

---

## Deployment

Deployed on **Vercel** with automatic CI/CD — every push to `main` triggers a new deployment.

Set environment variables in Vercel dashboard under **Settings → Environment Variables**.

---

## Excel Meal Plan Format

To import a meal plan, create an Excel file with these exact column headers:

| Week | Day | Meal | Foods | Calories | Protein | Carbs | Fat |
|------|-----|------|-------|----------|---------|-------|-----|
| 1 | 1 | Breakfast | Oats with banana | 450 | 12 | 80 | 8 |
| 1 | 1 | Lunch | Chicken rice bowl | 650 | 48 | 55 | 12 |

- Week: 1, 2, or 3
- Day: 1 (Monday) through 7 (Sunday)
- Meal: Breakfast, Lunch, Dinner, Snack, Pre-Bed, etc.
