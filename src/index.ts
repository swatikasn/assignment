import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import taskRoutes from "./routes/taskRoutes";
import { authenticateToken } from "./middleware/auth";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Assignment Application");
});

app.use("/auth", authRoutes);
app.use("/tasks", authenticateToken, taskRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server is running on port 3000");
});
