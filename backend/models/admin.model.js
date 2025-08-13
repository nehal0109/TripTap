const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const db = require('../db/db'); // Import the existing DB connection

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Hash the password before saving
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password for login
AdminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', AdminSchema);

// Add a dummy admin
(async () => {
  try {
    const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      const dummyAdmin = new Admin({
        email: 'admin@example.com',
        password: 'Admin@123', // Will be hashed before saving
      });
      await dummyAdmin.save();
      console.log('Dummy admin created');
    } else {
      console.log('Admin already exists');
    }
  } catch (err) {
    console.error('Error creating admin:', err);
  }
})();

module.exports = Admin;
