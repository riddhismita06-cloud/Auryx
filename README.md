# Auryx — Your Money. Your Intelligence.

**A smart, AI-powered personal finance management application designed to help you track expenses, manage budgets, plan savings, and make better financial decisions.**

Auryx combines personal finance tracking with an AI-powered assistant to turn transaction data into meaningful insights and make everyday money management simpler.

---

## ✨ Features

- **Personal Dashboard** — Overview of your financial activity, spending, and key insights.
- **Transaction Management** — Add, view, and manage personal transactions.
- **Budget Management** — Set category-wise budgets and monitor your spending.
- **Savings Goals** — Create savings targets, track progress, and manage your goals.
- **AI Financial Assistant** — Ask questions about your spending and receive contextual, AI-generated responses.
- **AI-Powered Insights** — Understand spending patterns and identify areas that may need attention.
- **Secure Authentication** — User registration, login, and JWT-based authentication.
- **Personalized Data** — Financial data is associated with individual user accounts.
- **Responsive Interface** — A modern interface designed for convenient financial management.

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- Node.js
- Express.js
- TypeScript
- REST API

### Database & Authentication
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)

### AI Integration
- Groq API
- `openai/gpt-oss-20b`

---

## 🤖 AI Financial Assistant

Auryx includes an AI-powered assistant that can answer questions about your financial activity using your recent transaction data.

It can help with:

- Understanding spending patterns
- Identifying major expense categories
- Reviewing recent transactions
- Answering natural-language questions about your expenses

The assistant uses available transaction data as context and is designed not to invent financial figures. Its analysis may be limited by the amount of transaction data available.

---

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- MongoDB Atlas account (or a MongoDB connection)
- Groq API key

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/Auryx.git
cd Auryx
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local `.env` file from the example:

**Windows CMD:**

```cmd
copy .env.example .env
```

Open `.env` and configure the required values:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GROQ_API_KEY=your_groq_api_key
```

Configure the remaining variables if required by your local setup.

- MongoDB connection string: [MongoDB Atlas](https://www.mongodb.com/atlas)
- Groq API key: [Groq Console](https://console.groq.com/keys)

> Never commit your actual `.env` file, API keys, database credentials, or JWT secrets.

### 4. Run the application

```bash
npm run dev
```

Follow the terminal output to access the application locally.

---

## 📁 Project Structure

```text
Auryx/
├── public/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── services/
