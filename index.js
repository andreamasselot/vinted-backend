const mongoose = require("mongoose");
require("dotenv").config();
mongoose.connect(process.env.MONGODB_URI);
const cors = require("cors");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const express = require("express");
const app = express();
app.use(express.json());
app.use(cors());
//Import des routes 
const usersRoute = require("./routes/users");
const offersRoute = require("./routes/offers");

//Demande au serveur de les utiliser 
app.use(usersRoute);
app.use(offersRoute);

app.all("*", (req, res) => {
  res.status(404).json({ error: error.message });
});

app.listen(process.env.PORT, () => console.log("Server started"));

//