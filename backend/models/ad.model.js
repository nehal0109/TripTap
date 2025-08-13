const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String 
    },
    imageUrl: { 
      type: String 
    },
    businessName: { 
      type: String, 
      required: true 
    },
    city: { 
      type: String, 
      required: true, // Ensure that every ad is associated with a city
      set: (value) => value.toUpperCase()
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Admin' 
    }
  }, 
  { timestamps: true }
);

module.exports = mongoose.model('Ad', AdSchema);
