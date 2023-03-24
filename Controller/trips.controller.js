// const express = require('express');
// const mongoose = require('mongoose');

// const app = express();

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost/trips', { useNewUrlParser: true });

// // Trip Schema
// const tripSchema = new mongoose.Schema({
//   source: String,
//   destination: String,
//   fare: Number,
//   passengerName: String
// });

// // Create a model from the schema
// const Trip = mongoose.model('Trip', tripSchema);

// app.use(express.json());

// // Endpoint to create a new trip
// app.post('/trips', (req, res) => {
//   const { source, destination, fare, passengerName } = req.body;
//   const trip = new Trip({ source, destination, fare, passengerName });
//   trip.save((err, trip) => {
//     if (err) return res.status(500).send(err);
//     return res.status(201).send(trip);
//   });
// });

// // Endpoint to get all trips
// app.get('/trips', (req, res) => {
//   Trip.find({}, (err, trips) => {
//     if (err) return res.status(500).send(err);
//     return res.send(trips);
//   });
// });

// app.listen(3000, () => {
//   console.log('API running on port 3000');
// });

const model = require("../Model/index");
const Trips = model.trip;

// Create and Save a new trip
exports.create = (req, res) => {
  // Validate request
  if (!req.body.passengers || req.body.passengers.length == 0) {
    return res.status(400).send({
      message: "trip passengers can not be empty",
    });
  }

  // Create a trip
  const trip = new Trips({
    passengers: req.body.passengers,
    tripDate: req.body.tripDate,
    source: req.body.source,
    destination: req.body.destination,
    tripCost: req.body.tripCost,
  });

  // Save trip in the database
  trip
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the trip.",
      });
    });
};

// Retrieve and return all trips from the database.
exports.findAll = (req, res) => {
  Trips.find()
    .then((trips) => {
      res.send(trips);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving trips.",
      });
    });
};

// Find a single trip with a tripId
exports.findOne = (req, res) => {
  Trips.findById(req.params.tripId)
    .then((trip) => {
      if (!trip) {
        return res.status(404).send({
          message: "trip not found with id " + req.params.tripId,
        });
      }
      res.send(trip);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "trip not found with id " + req.params.tripId,
        });
      }
      return res.status(500).send({
        message: "Error retrieving trip with id " + req.params.tripId,
      });
    });
};

// RefundAmount = totalfare - pax.cancellationCharges (this will be of selected pax)
// Update a trip to mark one or more passenger cancels the trip returning refund amount as response
exports.getIfCancelledDetails = (req, res) => {
  // Validate Request
 
  if (!req.body.tripId) {
    return res.status(400).send({
      message: "tripId can not be empty",
    });
  }

  // Validate Request if passengerEmailId list is empty
  if (!req.body.passengerEmailIds || req.body.passengerEmailIds.length == 0) {
    return res.status(400).send({
      message: "passengerEmailIds can not be empty",
    });
  }
  // cancellation charges for each passenger is 50% of the individual fare

  // Find trip and send cancellation charges for each passenger
  Trips.findById(req.body.tripId)
    .then((trip) => {
      if (!trip) {
        return res.status(404).send({
          message: "trip not found with id " + req.params.tripId,
        });
      }
      var passengerList = [];
      var totalFare = trip.tripCost;
      var totalCancellationCharges = 0;
      var totalRefundAmount = 0;
      var passengerEmailIds = req.body.passengerEmailIds;
      var passengerEmailIdsLength = passengerEmailIds.length;
      const passengerRefundDetails = [];
      for (var i = 0; i < passengerEmailIdsLength; i++) {
        var passengerEmailId = passengerEmailIds[i];

        var passenger = trip.passengers.find(
          (passenger) => passenger.passengerEmail === passengerEmailId
        );
        if (passenger) {
          var passengerFare = passenger.fare;
          var passengerCancellationCharges = passengerFare * 0.5;
          passengerRefundDetails.push({
            passengerName: passenger.passengerName,
            passengerEmailId: passengerEmailId,
            passengerFare: passengerFare,
            passengerCancellationCharges: passengerCancellationCharges,
          });
          totalRefundAmount =
            totalRefundAmount + passengerFare - passengerCancellationCharges;
          totalCancellationCharges += passengerCancellationCharges;
        }
      }
      // totalRefundAmount = totalFare - totalCancellationCharges;
      res.send({
        totalFare: totalFare,
        totalCancellationCharges: totalCancellationCharges,
        totalRefundAmount: totalRefundAmount,
        passengerRefundDetails: passengerRefundDetails,
      });
    })
    .catch((err) => {
      return res.status(500).send({
        message: "Error retrieving trip with id " + req.params.tripId,
      });
    });
};

// cancel trip for one or more passenger
exports.cancelTrip = (req, res) => {
  // Validate Request
  if (!req.body.tripId) {
    return res.status(400).send({
      message: "tripIds can not be empty",
    });
  }

  // Validate Request if passengerEmailId list is empty
  if (!req.body.passengerEmailIds || req.body.passengerEmailIds.length == 0) {
    return res.status(400).send({
      message: "passengerEmailIds can not be empty",
    });
  }

  // Find passenger whose trip is cancelled using passengerEmailId and then update the trip status as cancelled

  Trips.findById(req.body.tripId)
    .then((trip) => {
      if (!trip) {
        return res.status(404).send({
          message: "trip not found with id " + req.params.tripId,
        });
      }
      var passengerList = [];
      var totalFare = trip.tripCost;
      var totalCancellationCharges = 0;
      var totalRefundAmount = 0;
      var passengerEmailIds = req.body.passengerEmailIds;
      var passengerEmailIdsLength = passengerEmailIds.length;
      const passengerRefundDetails = [];

      for (var i = 0; i < passengerEmailIdsLength; i++) {
        var passengerEmailId = passengerEmailIds[i];

        var passenger = trip.passengers.find(
          (passenger) => passenger.passengerEmail === passengerEmailId
        );

        if (passenger) {
          passenger.tripStatus = "cancelled";
          passengerList.push(passenger);
          var passengerFare = passenger.fare;
          var passengerCancellationCharges = passengerFare * 0.5;
          totalFare = totalFare - passengerFare;
          passengerRefundDetails.push({
            passengerName: passenger.passengerName,
            passengerEmailId: passengerEmailId,
            passengerFare: passengerFare,
            passengerCancellationCharges: passengerCancellationCharges,
          });
          totalRefundAmount =
            totalRefundAmount + passengerFare - passengerCancellationCharges;
          totalCancellationCharges += passengerCancellationCharges;
        }
      }
      // get remaining passengers
      const remainingPassengers = trip.passengers.filter(
        (passenger) => !passengerEmailIds.includes(passenger.passengerEmail)
      );
      // trip.passengers = remainingPassengers;
     
      trip.passengers = remainingPassengers;
      trip.tripCost = totalFare;
      // update trip status as cancelled if all passengers are cancelled
      if (trip.passengers.length == 0) {
        trip.tripStatus = "cancelled";
      }
      // update fare

      trip
        .save()
        .then((data) => {
          res.send({
            totalFare: totalFare,
            totalCancellationCharges: totalCancellationCharges,
            totalRefundAmount: totalRefundAmount,
            passengerRefundDetails: passengerRefundDetails,
          });
        })
        .catch((err) => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while updating the trip.",
          });
        });
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "trip not found with id " + req.params.tripId,
        });
      }
      return res.status(500).send({
        message: "Error retrieving trip with id " + req.params.tripId,
      });
    });
};

exports.generateRandomTrips=(req,res)=>{
  var tripList = [];
  
  var tripCost = 0;
  var tripStatus = "booked";
  const sourceList = ["Delhi", "Mumbai", "Chennai", "Kolkata", "Bangalore"];
  const destinationList = ["Delhi", "Mumbai", "Chennai", "Kolkata", "Bangalore"];
  const passengerNameList = ["Rahul", "Raj", "Ravi", "Ramesh", "Rajesh"];
  const passengerEmailList = ["rahul.hh@gmail.com", "raj.ll@gmail.com", "ravi.sbfj@gmail.com", "ramesh.gdb@gmail.com", "rajesh.ghghgh@gmail.com"];
  
  const randomNumberOfPassengers = Math.floor(Math.random() * 3) + 1;
  for (var i = 0; i < randomNumberOfPassengers; i++) {
    var passenger = {
      passengerName: passengerNameList[Math.floor(Math.random() * 5)],
      passengerEmail: passengerEmailList[Math.floor(Math.random() * 5)],
      fare: Math.floor(Math.random() * 1000),
      tripStatus: tripStatus,
    };
    tripCost += passenger.fare;
    tripList.push(passenger);
  }
  const trip = new Trips({
    source: sourceList[Math.floor(Math.random() * 5)],
    destination: destinationList[Math.floor(Math.random() * 5)],
    tripCost: tripCost,
    tripStatus: tripStatus,
    passengers: tripList,
    tripDate: new Date(Date.now() + Math.random()*10*24 * 60 * 60 * 1000),
  });
  trip.save()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the trip.",
      });
    });
}

