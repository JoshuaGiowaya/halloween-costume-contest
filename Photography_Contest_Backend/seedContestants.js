const mongoose = require('mongoose');
const User = require('./models/User');
const allowlist = require('./utils/allowlist');
require('dotenv').config();

// Creates one account per employee on the roster, so nobody has to register
// on contest day - they just log in with their Yardstik email and the
// shared password. Safe to re-run: existing accounts are left alone, which
// means you can add a late arrival to the roster and run it again.
const seedContestants = async () => {
  try {
    const sharedPassword = process.env.FIXED_USER_PASSWORD;
    if (!sharedPassword) {
      console.error('❌ FIXED_USER_PASSWORD is not set. Set it before seeding.');
      process.exitCode = 1;
      return;
    }

    const roster = allowlist.loadRoster();
    if (!roster) {
      console.error('❌ EMPLOYEE_ALLOWLIST_FILE is not set. Set it before seeding.');
      process.exitCode = 1;
      return;
    }

    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/photography_contest';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const [email, name] of roster) {
      const existing = await User.findOne({ email });
      if (existing) {
        skipped += 1;
        continue;
      }

      // The pre-save hook hashes the password.
      await User.create({ username: name, email, password: sharedPassword });
      created += 1;
    }

    console.log('');
    console.log(`✅ Contestants seeded: ${created} created, ${skipped} already existed.`);
    console.log(`👥 Roster size: ${roster.size}`);
    console.log(`🔑 Everyone logs in with their Yardstik email and: ${sharedPassword}`);
  } catch (error) {
    console.error('❌ Error seeding contestants:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
};

seedContestants();
