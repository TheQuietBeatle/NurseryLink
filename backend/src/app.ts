import express from "express";
import cors from "cors";

import accountRoutes from "./routes/accountRoutes";
import privilegeRoutes from "./routes/privilegeRoutes";
import classRoutes from "./routes/classRoutes";
import childRoutes from "./routes/childRoutes";
import teacherManagingRoutes from "./routes/teacher_managingRoutes";
import parentLinkageRoutes from "./routes/parent_childLink";
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

// Routes with proper prefixes to avoid conflicts
app.use("/api/account", accountRoutes);
app.use("/api/privilege", privilegeRoutes);
app.use("/api/class", classRoutes);
app.use("/api/teacher-managing", teacherManagingRoutes);
app.use("/api/child", childRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/temperature", temperatureRoutes);
app.use("/api/incident", incidentRoutes);
app.use("/api/meal", mealRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/supply", supplyRoutes);
app.use("/api/toilet", toiletRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/parent", parentLinkageRoutes);
app.use("/api/notification", notificationRoutes);

export default app;