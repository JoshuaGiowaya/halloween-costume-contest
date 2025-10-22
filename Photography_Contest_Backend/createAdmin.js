const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/photography_contest';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'joshuagiowaya@gmail.com' });
    if (existingAdmin) {
      console.log('Admin already exists with email: joshuagiowaya@gmail.com');
      console.log('Username:', existingAdmin.username);
      console.log('Admin ID:', existingAdmin._id);
      return;
    }

    // Create new admin
    const adminData = {
      username: 'admin',
      email: 'joshuagiowaya@gmail.com',
      password: 'admin123' // This will be hashed automatically by the pre-save middleware
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Username:', admin.username);
    console.log('🔑 Password: admin123');
    console.log('🆔 Admin ID:', admin._id);
    console.log('');
    console.log('You can now login with these credentials in your admin panel.');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.log('💡 Admin with this email already exists. Try running the script again to see existing admin details.');
    }
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
};

createAdmin();
