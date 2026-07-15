const { getSitePayload } = require("../data/siteData");

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(getSitePayload());
};
