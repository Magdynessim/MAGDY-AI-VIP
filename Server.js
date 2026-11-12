
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cors());

app.use("/api/", rateLimit({
  windowMs: 60000,
  limit: 20
}));

app.get("/", (req, res) => {
  res.json({
    name: "MAGDY AI VIP",
    status: "online"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "API key is not configured"
      });
    }

    const messages = req.body.messages;

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({
        error: "Messages are required"
      });
    }

    const safeMessages = messages
      .filter(m =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-20)
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 12000)
      }));

    const result = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: "You are MAGDY AI VIP, a helpful Arabic and English AI assistant specialized in programming, applications and games."
            },
            ...safeMessages
          ],
          max_completion_tokens: 4096
        })
      }
    );

    const data = await result.json();

    if (!result.ok) {
      return res.status(result.status).json({
        error: data.error?.message || "AI service error"
      });
    }

    res.json({
      reply: data.choices?.[0]?.message?.content || ""
    });

  } catch (error) {
    res.status(500).json({
      error: "Connection error"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("MAGDY AI VIP server started on " + PORT);
});
