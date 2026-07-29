# 💎 Buffy.com - Production Investment & Wealth Management Platform

**Tagline**: *"Grow Your Wealth. Secure Your Future."*

Buffy.com is a production-grade fintech investment web platform built with a high-end dark blue, gold, and white aesthetic system, powered by **Supabase Cloud Database & Authentication**, **Chart.js** financial visualizations, and a **Node.js** HTTP web server.

---

## 🌟 Key Platform Features

### 🏛️ Public Marketing Portal
- **Hero Section**: Tagline, headline, CTA buttons, SEC/FINRA regulatory badges, and floating asset returns card.
- **Live Market Data Ticker**: Real-time asset price feeds (S&P 500, NASDAQ, Gold, Bitcoin, Ethereum, Tech ETFs).
- **Animated Statistics**: Counter animations for Managed Assets ($14.2B+), Active Investors (250K+), Experience (15 Yrs), and Satisfaction (99.4%).
- **Interactive Investment Growth Forecast**: Compound growth calculator with live sliders for Initial Deposit, Monthly Contribution, Time Horizon, and Estimated Growth Strategy.
- **Filterable Multi-Asset Market Catalog**: Explore Stocks, ETFs, Mutual Funds, Bonds, Real Estate, Commodities, and Crypto.
- **FAQ System**: Accordion questions with live keyword search filtering.
- **Contact & Inquiry System**: Dynamic contact form with automatic Supabase database persistence.

### 💼 Interactive User Dashboard UI
- **Portfolio Metrics**: Live calculation of total valuation, cash liquidity, cumulative returns, and risk profile score.
- **Interactive Financial Charts**: Real-time line graph with `1D`, `1W`, `1M`, `1Y`, `ALL` timeframe controls, and asset allocation donut chart.
- **Recent Transactions & Dividends**: Real-time transaction history powered by Supabase `user_transactions` table.
- **Quick Deposits & Withdrawals**: Interactive modals that log real transaction rows to PostgreSQL.

### 🔐 Supabase Cloud Authentication & Database
- **Supabase Auth**: Complete sign up, log in, 2FA verification code, and session listener (`onAuthStateChange`).
- **Database Schema**:
  - `user_profiles`: User profile data (name, email, investment tier, balance).
  - `user_transactions`: Deposits, withdrawals, and asset purchase records.
  - `contact_inquiries`: Platform inquiries submitted by users.
  - `newsletter_subscribers`: Weekly market digest subscribers.

---

## 🚀 Quick Start & Deployment

### 1. Requirements
- Node.js (v16+) or PowerShell environment.

### 2. Running Locally
- Execute via Node.js:
  ```bash
  npm start
  ```
- Or execute via PowerShell:
  ```powershell
  powershell -ExecutionPolicy Bypass -File server.ps1
  ```

### 3. Open in Browser
Navigate to:
```
http://localhost:8080/
```

---

## 🔑 Supabase Configuration

- **Project URL**: `https://ypuhbckmzatuzheavjec.supabase.co`
- **Database Tables**: Provisioned and governed by Row Level Security (RLS) policies.

---

## 🛡️ License
Copyright © 2026 Buffy.com Financial Technologies Inc. All rights reserved.
