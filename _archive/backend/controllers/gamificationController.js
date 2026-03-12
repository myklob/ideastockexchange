import UserStats from '../models/UserStats.js';
import User from '../models/User.js';

// Get user's character stats
export const getCharacterStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.id;

    const userStats = await UserStats.getOrCreate(targetUserId);

    res.json({
      success: true,
      data: {
        character: userStats.character,
        level: userStats.character.level,
        experience: userStats.character.experience,
        strength: userStats.character.strength,
        stats: {
          intelligence: userStats.character.intelligence,
          wisdom: userStats.character.wisdom,
          charisma: userStats.character.charisma,
          logicalProwess: userStats.character.logicalProwess,
          researchSkill: userStats.character.researchSkill,
          strategicThinking: userStats.character.strategicThinking,
          persuasion: userStats.character.persuasion
        }
      }
    });
  } catch (error) {
    console.error('Get character stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get full user stats
export const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.id;

    const userStats = await UserStats.findOne({ user: targetUserId });

    if (!userStats) {
      return res.status(404).json({
        success: false,
        error: 'User stats not found'
      });
    }

    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get leaderboards
export const getLeaderboards = async (req, res) => {
  try {
    const {
      category = 'overall',
      limit = 100
    } = req.query;

    const leaderboard = await UserStats.getLeaderboard(category, parseInt(limit));

    res.json({
      success: true,
      data: {
        category,
        leaderboard
      }
    });
  } catch (error) {
    console.error('Get leaderboards error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update leaderboards (admin/cron job)
export const updateLeaderboards = async (req, res) => {
  try {
    await UserStats.updateLeaderboards();

    res.json({
      success: true,
      message: 'Leaderboards updated successfully'
    });
  } catch (error) {
    console.error('Update leaderboards error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Record login (for streak tracking and daily bonuses)
export const recordLogin = async (req, res) => {
  try {
    const userStats = await UserStats.getOrCreate(req.user.id);
    await userStats.recordLogin();

    res.json({
      success: true,
      data: {
        loginStreak: userStats.engagement.login_streak,
        bestStreak: userStats.engagement.best_login_streak,
        totalLogins: userStats.engagement.total_logins
      }
    });
  } catch (error) {
    console.error('Record login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user rankings
export const getUserRankings = async (req, res) => {
  try {
    const userStats = await UserStats.findOne({ user: req.user.id });

    if (!userStats) {
      return res.status(404).json({
        success: false,
        error: 'User stats not found'
      });
    }

    res.json({
      success: true,
      data: {
        rankings: userStats.rankings,
        lastUpdated: userStats.rankings.last_updated
      }
    });
  } catch (error) {
    console.error('Get user rankings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get gamification dashboard data
export const getDashboard = async (req, res) => {
  try {
    const userStats = await UserStats.getOrCreate(req.user.id);
    const user = await User.findById(req.user.id)
      .populate('achievements.achievement');

    // Get recent unlocked achievements
    const recentAchievements = user.achievements
      ?.filter(a => a.isUnlocked)
      .sort((a, b) => b.unlockedAt - a.unlockedAt)
      .slice(0, 5) || [];

    // Get progress towards next level
    const currentLevel = userStats.character.level;
    const experienceForNextLevel = (currentLevel * currentLevel) * 1000;
    const currentExperience = userStats.character.experience;
    const progressToNextLevel = ((currentExperience % experienceForNextLevel) / experienceForNextLevel) * 100;

    res.json({
      success: true,
      data: {
        character: userStats.character,
        progressToNextLevel,
        experienceForNextLevel,
        contributions: userStats.contributions,
        investing: userStats.investing,
        community: userStats.community,
        engagement: userStats.engagement,
        currency: userStats.currency,
        rankings: userStats.rankings,
        recentAchievements
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
