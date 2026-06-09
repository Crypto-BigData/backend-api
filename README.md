# Crypto Analytics Backend API

A high-performance Backend API serving a Crypto Market Analytics Dashboard (Big Data Project), designed to process and analyze massive volumes of market data through **ClickHouse**.

Built with **NestJS**, the project features a fully decoupled architecture separating the Read pipeline (API Server) and Write pipeline (Data Crawler Worker), ensuring modularity, scalability, and seamless integration with the Data Team's infrastructure.

---

## Architecture

The system consists of two independent processes sharing the same database:

1. **API Server (Port 3000):** **Read-only**. Handles requests from the Frontend, queries ClickHouse, performs complex application-layer calculations (e.g., Technical Indicators), and returns results. Leverages `cache-manager` with Redis for high-speed response caching.
2. **Worker Service (Port 3002):** **Write-only** (Crawler). Fetches data from Binance (Market Data) and CoinDesk (News), then ingests it into ClickHouse. Utilizes Redis Distributed Locks to prevent duplicate cron jobs when scaled.
   > **Note:** If the Data Team already has a robust Data Pipeline (e.g., Spark/Kafka/Airflow) handling ClickHouse ingestion, **you do not need to run this Worker Service**.

---

## Key Modules

*   **Market Data (`/kline`)**: Retrieves candlestick (OHLCV) data with the ability to dynamically aggregate 5-minute candles into higher timeframes directly via SQL.
*   **News (`/news`)**: Provides high-speed paginated market news using parallel count and fetch queries.
*   **Overview (`/overview`)**: Dashboard aggregates including Market Summary, Top Gainers/Losers, and Volume Spike anomaly detection.
*   **Indicators (`/indicators`)**: Blazing-fast in-memory calculation engine for technical indicators (SMA, EMA, Wilder's RSI, Bollinger Bands) entirely independent of DB-native functions.
*   **News Impact (`/news-impact`)**: Analyzes the impact of news on price action using a highly optimized **2-phase querying strategy** (equality lookup) to prevent timeouts caused by distributed range JOINs in ClickHouse.
*   **Chatbot (`/chatbot`)**: AI-powered chatbot using **OpenAI Function Calling**. Queries internal APIs (kline, news, time-now) to answer natural language questions about crypto markets. Multi-round tool loop with 10s AbortController timeout.
*   **Signals (`/signals`)**: Read-only endpoint serving pre-calculated trading alerts from the Worker.

---

## Tech Stack

*   **Framework:** NestJS (Node.js 18+ / TypeScript)
*   **Primary Database (OLAP):** ClickHouse (via `@clickhouse/client`)
*   **Cache & Locking (In-memory):** Redis
*   **Design Patterns:** Repository Pattern, Dependency Injection

---

## Local Setup

### 1. Prerequisites
*   Node.js v18+
*   NPM or Yarn
*   (Optional) ClickHouse & Redis via Docker if you wish to test with real data pipelines.

---

### 🌟 Frontend Team Quickstart (No Database Required)
If you are a Frontend Developer building the UI, you **do not** need to install ClickHouse or Redis. The API can run entirely in-memory using Mock Data.

1. Clone the repo and run `npm install`.
2. Copy the environment file: `cp .env.example .env`.
3. Open `.env` and ensure `USE_MOCK=true` is set.
4. Run the server: `npm run start:dev`.
5. Open your browser and go to **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)** to view the interactive API Documentation (Swagger).

---

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy the example file and configure it:
```bash
cp .env.example .env
```

**Crucial Variables:**
*   `USE_MOCK=true`: Runs the entire system using Mock Repositories (dummy data). Bypasses the need for ClickHouse or Redis. **Highly recommended for the Frontend Team during UI development.**
*   `USE_MOCK=false`: Connects to the real ClickHouse database.
*   `CLICKHOUSE_URL`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`: Production database credentials.
*   `REDIS_URL`: Redis Cache connection string.
*   `OPENAI_API_KEY`: *(Optional)* OpenAI API key for the Chatbot module. Without it, the chatbot endpoint returns `503`.
*   `OPENAI_BASE_URL`: *(Optional)* Custom API base URL (e.g., to use Groq, Nvidia NIM, or Gemini instead of OpenAI).
*   `OPENAI_MODEL`: *(Optional)* Model to use, defaults to `gpt-4o-mini`.
### 4. Run Commands

**Start the API Server (For Devs & Frontend):**
```bash
# Development mode (watch mode)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

**Start the Crawler Worker (Run ONLY if the Data Team is not providing data):**
```bash
npm run start:worker
# Or on production:
npm run build:worker
npm run start:worker:prod
```

### 5. Run with Docker (For Deployment)

If you want to deploy the complete stack (API, Worker, ClickHouse, Redis) using Docker, or if you want to integrate this Backend into the larger Big Data project network:

```bash
# Start all services (API, Worker, DB, Cache) in the background
docker-compose up -d --build

# View logs to verify services are running
docker-compose logs -f api
docker-compose logs -f worker

# Stop all services
docker-compose down
```

> **Note:** 
> The `docker-compose.yml` is pre-configured with a network called `bigdata_net`. To attach these backend containers to the master Big Data Docker Compose network, simply set `external: true` in the `networks` block.

---

## 📘 API Contract & Conventions

*   **Time Units:** All time-based communication between Frontend and Backend utilizes **Epoch Milliseconds** (e.g., `1700292900000`). The backend automatically handles conversions to the respective database schema types.
*   **Decimals:** All currency values, percentages, and floating-point technical indicators are returned as **Strings** (e.g., `"65432.12"`) to prevent IEEE-754 precision loss in JavaScript.
*   **Null Handling:** In the event of historical data gaps (missing candles at specific timestamps), the corresponding computed values will return `null` instead of throwing an error. The Frontend should map this to `"-"` or `"N/A"`.

---

## Authors & Contribution

Developed as part of a Big Data academic project. 
The Data Team is responsible for Data Ingestion and Database Schema. The Backend API Team handles high-performance querying and dashboard data aggregation.
