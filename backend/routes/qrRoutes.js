const express = require("express");
const router = express.Router();

const { generateQR, scanQR } = require("../controllers/qrController");

router.post("/generate", generateQR);
router.post("/scan", scanQR);

module.exports = router;