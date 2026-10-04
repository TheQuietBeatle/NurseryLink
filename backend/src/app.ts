import express from "express";
import cors from "cors";

import accountRoutes from "./routes/accountRoutes";
import privilegeRoutes from "./routes/privilegeRoutes";
import classRoutes from "./routes/classRoutes";
import childRoutes from "./routes/childRoutes";
import teacherManagingRoutes from "./routes/teacher_managingRoutes";
import emailRoutes from "./routes/emailRoutes";

import temperatureRoutes from "./routes/temperatureRoutes";
import incidentRoutes from "./routes/incidentRoutes";
import mealRoutes from "./routes/mealRoutes";
import teacherRoutes from "./routes/teacherRoutes";
import supplyRoutes from "./routes/supplyRoutes";
import toiletRoutes from "./routes/toiletRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import notificationRoutes from "./routes/notificationRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: any, res: any) => {
    res.send('Hello World!');
});

// Routes
app.use("/", accountRoutes);
app.use("/", privilegeRoutes);
app.use("/", classRoutes);
app.use("/", teacherManagingRoutes);
app.use("/", childRoutes);
app.use("/", emailRoutes);
app.use("/", temperatureRoutes);
app.use("/", incidentRoutes);
app.use("/", mealRoutes);
app.use("/", teacherRoutes);
app.use("/", supplyRoutes);
app.use("/", toiletRoutes);
app.use("/", attendanceRoutes);
app.use("/", notificationRoutes);

export default app;