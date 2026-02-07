import Achievement from '../models/Achievement.js';
import UserStats from '../models/UserStats.js';
import User from '../models/User.js';

// Get all achievements
export const getAllAchievements = async (req, res) => {
  try {
    const {
      category = null,
      tier = null,
      isActive = true
    } = req.query;

    const query = { isActive };
    if (category) query.category = category;
    if (tier) query.tier = tier;

    const achievements = await Achievement.find(query)
      .sort({ tier: 1, category: 1 });

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user's achievements
export const getUserAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('achievements.achievement');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const achievements = user.achievements || [];

    // Separate unlocked and locked
    const unlocked = achievements.filter(a => a.isUnlocked);
    const locked = achievements.filter(a => !a.isUnlocked);

    res.json({
      success: true,
      data: {
        unlocked,
        locked,
        totalUnlocked: unlocked.length,
        totalAchievements: await Achievement.countDocuments({ isActive: true })
      }
    });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Check and award achievements
export const checkAchievements = async (req, res) => {
  try {
    const userStats = await UserStats.getOrCreate(req.user.id);

    // Build stats object for checking
    const stats = {
      // Contributions
      beliefs_created: userStats.contributions.beliefs_created,
      arguments_created: userStats.contributions.arguments_created,
      evidence_submitted: userStats.contributions.evidence_submitted,
      verified_evidence_count: userStats.contributions.verified_evidence_count,
      votes_cast: userStats.contributions.votes_cast,
      highest_argument_score: userStats.contributions.highest_argument_score,

      // Investments
      investments_made: userStats.investing.investments_made,
      total_investment_profit: userStats.investing.total_investment_profit,
      best_trade_percentage: userStats.investing.best_trade_percentage,
      longest_profitable_hold: userStats.investing.longest_profitable_hold,
      longest_hold_profit: userStats.investing.longest_hold_profit,

      // Community
      debates_participated: userStats.community.debates_participated,
      conflicts_resolved: userStats.community.conflicts_resolved,

      // Engagement
      login_streak: userStats.engagement.login_streak,
      currentStreak: userStats.engagement.login_streak
    };

    const newUnlocks = await Achievement.checkUserAchievements(req.user.id, stats);

    res.json({
      success: true,
      data: {
        newUnlocks,
        message: newUnlocks.length > 0
          ? `Congratulations! You unlocked ${newUnlocks.length} new achievement(s)!`
          : 'No new achievements unlocked'
      }
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Pin/unpin achievement
export const togglePinAchievement = async (req, res) => {
  try {
    const { achievementId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userAchievement = user.achievements?.find(
      a => a.achievement.toString() === achievementId
    );

    if (!userAchievement) {
      return res.status(404).json({
        success: false,
        error: 'Achievement not found in user profile'
      });
    }

    if (!userAchievement.isUnlocked) {
      return res.status(400).json({
        success: false,
        error: 'Cannot pin locked achievement'
      });
    }

    userAchievement.isPinned = !userAchievement.isPinned;
    await user.save();

    res.json({
      success: true,
      data: userAchievement,
      message: userAchievement.isPinned ? 'Achievement pinned' : 'Achievement unpinned'
    });
  } catch (error) {
    console.error('Toggle pin achievement error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Initialize default achievements (admin only)
export const initializeAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.initializeAchievements();

    res.json({
      success: true,
      data: achievements,
      message: `Initialized ${achievements.length} achievements`
    });
  } catch (error) {
    console.error('Initialize achievements error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
