const express = require("express");
const app = express();
const port = 3000;

//mencoba koneksi ke database serta menyambung model ke db
const db = require("./models");
const methodOverride = require('method-override');

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const branchRoutes = require('./routes/branch.routes')
const roomRoutes = require('./routes/room.routes')
const facilityRoutes = require('./routes/facility.routes')
const bookingRoutes = require('./routes/booking.routes')
const paymentRoutes = require("./routes/payment.routes")

const {checkToken} = require('./middlewares/auth')

db.sequelize
  .authenticate()
  .then(() => console.log("Database berhasil tersambung"))
  .catch((err) => console.error(err));

app.use(express.json())
app.use(methodOverride('_method'))
app.use('/uploads', express.static('uploads'))

app.use("/", authRoutes)

app.use("/users", checkToken, userRoutes);
app.use("/branches", checkToken, branchRoutes);
app.use("/rooms", checkToken, roomRoutes);
app.use("/facilities", checkToken, facilityRoutes);
app.use("/bookings", checkToken, bookingRoutes);
app.use("/payments", checkToken, paymentRoutes)

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`); 
});
