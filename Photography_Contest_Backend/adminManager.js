const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const adminManager = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/photography_contest';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const command = process.argv[2];
    const email = process.argv[3];
    const username = process.argv[4];
    const password = process.argv[5];

    switch (command) {
      case 'create':
        await createAdmin(email, username, password);
        break;
      case 'list':
        await listAdmins();
        break;
      case 'delete':
        await deleteAdmin(email);
        break;
      case 'reset':
        await resetAdminPassword(email, password);
        break;
      default:
        console.log('📋 Admin Manager Commands:');
        console.log('');
        console.log('Create admin:');
        console.log('  node adminManager.js create <email> <username> <password>');
        console.log('');
        console.log('List all admins:');
        console.log('  node adminManager.js list');
        console.log('');
        console.log('Delete admin:');
        console.log('  node adminManager.js delete <email>');
        console.log('');
        console.log('Reset admin password:');
        console.log('  node adminManager.js reset <email> <new_password>');
        console.log('');
        console.log('Examples:');
        console.log('  node adminManager.js create admin@example.com admin admin123');
        console.log('  node adminManager.js list');
        console.log('  node adminManager.js delete admin@example.com');
        console.log('  node adminManager.js reset admin@example.com newpassword123');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
};

const createAdmin = async (email, username, password) => {
  if (!email || !username || !password) {
    console.log('❌ Please provide email, username, and password');
    console.log('Usage: node adminManager.js create <email> <username> <password>');
    return;
  }

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('⚠️  Admin already exists with email:', email);
      console.log('Username:', existingAdmin.username);
      return;
    }

    const admin = new Admin({ email, username, password });
    await admin.save();

    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Username:', admin.username);
    console.log('🔑 Password:', password);
    console.log('🆔 Admin ID:', admin._id);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
};

const listAdmins = async () => {
  try {
    const admins = await Admin.find({}).select('-password -passwordHistory');
    console.log('📋 All Admins:');
    console.log('');
    if (admins.length === 0) {
      console.log('No admins found.');
      return;
    }
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing admins:', error.message);
  }
};

const deleteAdmin = async (email) => {
  if (!email) {
    console.log('❌ Please provide email');
    console.log('Usage: node adminManager.js delete <email>');
    return;
  }

  try {
    const admin = await Admin.findOneAndDelete({ email });
    if (admin) {
      console.log('✅ Admin deleted successfully!');
      console.log('📧 Email:', admin.email);
      console.log('👤 Username:', admin.username);
    } else {
      console.log('❌ Admin not found with email:', email);
    }
  } catch (error) {
    console.error('❌ Error deleting admin:', error.message);
  }
};

const resetAdminPassword = async (email, newPassword) => {
  if (!email || !newPassword) {
    console.log('❌ Please provide email and new password');
    console.log('Usage: node adminManager.js reset <email> <new_password>');
    return;
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log('❌ Admin not found with email:', email);
      return;
    }

    admin.password = newPassword; // Will be hashed by pre-save middleware
    await admin.save();

    console.log('✅ Admin password reset successfully!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Username:', admin.username);
    console.log('🔑 New Password:', newPassword);
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  }
};

adminManager();

