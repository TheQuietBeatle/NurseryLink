import express from "express";
import cors from "cors";

import accountRoutes from "./routes/accountRoutes";
import privilegeRoutes from "./routes/privilegeRoutes";
import classRoutes from "./routes/classRoutes";
import childRoutes from "./routes/childRoutes";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/", accountRoutes);
app.use("/", privilegeRoutes);
app.use("/", classRoutes);
app.use("/", childRoutes);

export default app;