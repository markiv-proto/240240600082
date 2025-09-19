import React, { useState } from "react";
import axios from "axios";
import { logEvent } from "./utils/logProxy";

function App() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!longUrl) {
      logEvent("warn", "Tried to shorten empty URL");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/shorten", {
        longUrl,
      });

      setShortUrl(res.data.shortUrl);
      logEvent("info", `Short URL generated: ${res.data.shortUrl}`);
    } catch (err) {
      console.error(err);
      logEvent("error", `Error while shortening URL: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>URL Shortener</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter a long URL"
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          style={{ width: "400px", padding: "10px" }}
        />
        <button type="submit" style={{ marginLeft: "10px", padding: "10px" }}>
          Shorten
        </button>
      </form>

      {shortUrl && (
        <p style={{ marginTop: "20px" }}>
          Shortened URL:{" "}
          <a href={shortUrl} target="_blank" rel="noopener noreferrer">
            {shortUrl}
          </a>
        </p>
      )}
    </div>
  );
}

export default App;
