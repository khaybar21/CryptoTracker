import express from "express"
import sqlite3 from "sqlite3"
import bodyParser from "body-parser"
import cors from "cors"
import path from "path"

const app = express()
const PORT = 5050

const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.options("*", cors(corsOptions))
app.use(bodyParser.json())

const dbPath = path.resolve("./database.db")

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log("Problem opening db:", err.message)
  } else {
    console.log("Connected to db")
    db.run(`
    CREATE TABLE IF NOT EXISTS crypto_data (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      current_price REAL NOT NULL,
      market_cap REAL NOT NULL,
      price_change_percentage_24h REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.log("Table error:", err.message)
      } else {
        console.log("Table is fine")
      }
    })
  }
})

app.post("/logData", (req, res) => {
  const coins = req.body

  const query = `
    INSERT INTO crypto_data (id, name, symbol, current_price, market_cap, price_change_percentage_24h)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      current_price = excluded.current_price,
      market_cap = excluded.market_cap,
      price_change_percentage_24h = excluded.price_change_percentage_24h,
      timestamp = CURRENT_TIMESTAMP
  `

  coins.forEach(c => {
    db.run(query, [
      c.id,
      c.name,
      c.symbol,
      c.current_price,
      c.market_cap,
      c.price_change_percentage_24h
    ], (err) => {
      if (err) {
        console.log("Insert err:", err.message)
      }
    })
  })

  res.status(200).send("Logged.")
})


// returns all or some history
app.get("/history", (req, res) => {
  const id = req.query.id

  let q = "SELECT * FROM crypto_data"
  const args = []

  if (id) {
    q += " WHERE id = ?"
    args.push(id)
  }

  q += " ORDER BY timestamp DESC"

  db.all(q, args, (err, rows) => {
    if (err) {
      console.log("History error:", err.message)
      res.status(500).json({ error: "Something went wrong" })
    } else {
      res.json(rows)
    }
  })
})

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT)
})
