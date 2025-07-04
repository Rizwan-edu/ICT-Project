import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const testDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    console.log('Database name:', mongoose.connection.name);

    // Test creating a user
    console.log('\nTesting user creation...');
    
    // Clean up test user if exists
    await User.deleteOne({ email: 'test@example.com' });
    
    const testUser = new User({
      email: 'test@example.com',
      password: 'test123',
      isAdmin: false
    });

    const savedUser = await testUser.save();
    console.log('✅ Test user created:', savedUser._id);

    // Test login
    const foundUser = await User.findOne({ email: 'test@example.com' });
    const isPasswordValid = await foundUser.comparePassword('test123');
    console.log('✅ Password validation:', isPasswordValid);

    // Clean up
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ Test user cleaned up');

    console.log('\n🎉 Database test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
};

testDatabase();