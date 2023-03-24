const controller = require("../Controller/trips.controller.js");





module.exports = function(app) {
    app.use(function(req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, Content-Type, Accept"
      );
      next();
    });

    // Create a new trip
    app.post("/trips", controller.create);

    // Retrieve all trips
    app.get("/trips", controller.findAll);
    // get cancellation details
    app.post("/trips/cancellation", controller.getIfCancelledDetails);

    app.post("/trips/finalcancellation", controller.cancelTrip);
    app.post("/trips/generateRandom", controller.generateRandomTrips);
    

};
