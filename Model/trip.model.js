const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  passengers: [
    {
      passengerName: {
        type: String,
        required: true,
      },
      passengerEmail: {
        type: String,
        required: true,
      },
      fare: {
        type: Number,
        required: true,
      },
        cancelled: {
        type: Boolean,
        required: true,
        default: false,
        }
    },
  ],
  tripDate: {
    type: Date,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  tripCost: {
    type: Number,
    required: true,
  },
});

// create a model

module.exports = mongoose.model("Trip", tripSchema);
