import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Achievement from '../models/Achievement.js';
import UserStats from '../models/UserStats.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ideastockexchange';

async function initializeMonetization() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // 1. Initialize achievements
    console.log('\n=== Initializing Achievements ===');
    const achievements = await Achievement.initializeAchievements();
    console.log(`✓ Initialized ${achievements.length} achievements`);

    // 2. Create user stats for existing users without them
    console.log('\n=== Initializing User Stats ===');
    const users = await User.find({});
    let statsCreated = 0;

    for (const user of users) {
      const existingStats = await UserStats.findOne({ user: user._id });
      if (!existingStats) {
        await UserStats.create({ user: user._id });
        statsCreated++;
      }

      // Create free subscription if none exists
      const existingSubscription = await Subscription.findOne({ user: user._id });
      if (!existingSubscription) {
        const subscription = await Subscription.createFreeSubscription(user._id);
        user.subscription = subscription._id;
        await user.save();
      }
    }
    console.log(`✓ Created stats for ${statsCreated} users`);
    console.log(`✓ All ${users.length} users have subscriptions`);

    // 3. Update leaderboards
    console.log('\n=== Updating Leaderboards ===');
    await UserStats.updateLeaderboards();
    console.log('✓ Leaderboards updated');

    // 4. Display statistics
    console.log('\n=== Platform Statistics ===');
    const totalUsers = await User.countDocuments();
    const totalAchievements = await Achievement.countDocuments({ isActive: true });
    const totalSubscriptions = await Subscription.countDocuments();

    console.log(`Total Users: ${totalUsers}`);
    console.log(`Total Achievements: ${totalAchievements}`);
    console.log(`Total Subscriptions: ${totalSubscriptions}`);

    // Achievement breakdown
    const achievementsByCategory = await Achievement.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('\nAchievements by Category:');
    achievementsByCategory.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count}`);
    });

    // Subscription breakdown
    const subscriptionsByPlan = await Subscription.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('\nSubscriptions by Plan:');
    subscriptionsByPlan.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count}`);
    });

    console.log('\n✅ Monetization features initialized successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up Stripe account and add API keys to .env');
    console.log('2. Create subscription products in Stripe Dashboard');
    console.log('3. Update STRIPE_PREMIUM_PRICE_ID and STRIPE_ENTERPRISE_PRICE_ID in .env');
    console.log('4. Test the platform with virtual currency investing');
    console.log('5. Check user achievements and gamification features');

  } catch (error) {
    console.error('Error initializing monetization:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeMonetization();
}

export default initializeMonetization;
