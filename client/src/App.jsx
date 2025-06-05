import React, { useEffect, useState } from "react";
import CanvasJSReact from "@canvasjs/react-charts";
import "./App.css";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

function App() {
  const [cryptoData, setCryptoData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd");
      const json = await res.json();
      setCryptoData(json);

      const chosen = json.filter((x) => {
        return x.id === "bitcoin" || x.id === "ethereum" || x.id === "dogecoin";
      });

      // save to database
      await fetch("http://localhost:5050/logData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chosen),
      });
    } catch (err) {
      console.log("Error fetching:", err);
    }
  };

  const onlySelected = cryptoData.filter(
    (x) => x.id === "bitcoin" || x.id === "ethereum" || x.id === "dogecoin"
  );

  function makeData(price) {
    const d = [];
    const n = new Date();
    for (let i = 22; i >= 0; i -= 2) {
      const t = new Date(n);
      t.setHours(n.getHours() - i);
      t.setMinutes(0);
      const label = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const y = price + (Math.random() - 0.5) * 20; 
      d.push({ label, y });
    }
    return d;
  }

  const chartStuff = (id, base) => {
    return {
      animationEnabled: true,
      theme: "light2",
      title: {
        text: id.charAt(0).toUpperCase() + id.slice(1) + " Price Data (Last 24 Hours)",
      },
      axisX: {
        title: "Time",
        labelAngle: -30,
      },
      axisY: {
        title: "Price (USD)",
        includeZero: false,
      },
      data: [
        {
          type: "line",
          dataPoints: makeData(base),
        },
      ],
    };
  };

  return (
    <div className="container">
      <h1 className="heading">Khaybars Crypto Data</h1>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Crypto Currency</th>
              <th className="th">Price</th>
              <th className="th">Market Cap</th>
              <th className="th">Price Change (24h)</th>
            </tr>
          </thead>
          <tbody>
            {onlySelected.map((coin) => {
              return (
                <tr key={coin.id} className="tr">
                  <td className="td">
                    <div className="crypto-info">
                      <img src={coin.image} alt={coin.name} className="crypto-image" />
                      <div>
                        <p className="crypto-name">{coin.name}</p>
                        <p className="crypto-symbol">{coin.symbol.toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td">${coin.current_price.toLocaleString()}</td>
                  <td className="td">${coin.market_cap.toLocaleString()}</td>
                  <td className="td">
                    <span
                      className={
                        "price-change " +
                        (coin.price_change_percentage_24h > 0 ? "positive" : "negative")
                      }
                    >
                      {coin.price_change_percentage_24h.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="charts">
        {onlySelected.map((c) => {
          return (
            <div key={c.id} style={{ marginTop: "30px" }}>
              <CanvasJSChart options={chartStuff(c.id, c.current_price)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
