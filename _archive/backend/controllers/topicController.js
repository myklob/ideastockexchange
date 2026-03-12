import { Topic, Belief } from '../models/index.js';

/**
 * Get all topics
 * @route GET /api/topics
 */
export const getAllTopics = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      featured,
      trending,
      sort = '-statistics.totalBeliefs',
      search,
    } = req.query;

    // Build query
    const query = { status: 'active' };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (trending === 'true') {
      query.trending = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const topics = await Topic.find(query)
      .populate('parentTopic', 'name slug')
      .populate('subTopics', 'name slug statistics')
      .populate('createdBy', 'username')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Topic.countDocuments(query);

    res.json({
      topics,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({
      message: 'Error fetching topics',
      error: error.message,
    });
  }
};

/**
 * Get topic by ID or slug
 * @route GET /api/topics/:idOrSlug
 */
export const getTopicByIdOrSlug = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Try to find by ID first, then by slug
    let topic = await Topic.findById(idOrSlug)
      .populate('parentTopic', 'name slug')
      .populate('subTopics', 'name slug statistics')
      .populate('relatedTopics.topicId', 'name slug statistics')
      .populate('createdBy', 'username');

    if (!topic) {
      topic = await Topic.findOne({ slug: idOrSlug })
        .populate('parentTopic', 'name slug')
        .populate('subTopics', 'name slug statistics')
        .populate('relatedTopics.topicId', 'name slug statistics')
        .populate('createdBy', 'username');
    }

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Get hierarchy
    const hierarchy = await topic.getHierarchy();

    res.json({
      topic,
      hierarchy,
    });
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({
      message: 'Error fetching topic',
      error: error.message,
    });
  }
};

/**
 * Get beliefs for a topic with filters
 * @route GET /api/topics/:idOrSlug/beliefs
 */
export const getTopicBeliefs = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const {
      minSpecificity,
      maxSpecificity,
      minStrength,
      maxStrength,
      minSentiment,
      maxSentiment,
      sort = '-createdAt',
      page = 1,
      limit = 20,
    } = req.query;

    // Find topic
    let topic = await Topic.findById(idOrSlug);
    if (!topic) {
      topic = await Topic.findOne({ slug: idOrSlug });
    }

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Build filters
    const filters = { sort };

    if (minSpecificity !== undefined) filters.minSpecificity = parseFloat(minSpecificity);
    if (maxSpecificity !== undefined) filters.maxSpecificity = parseFloat(maxSpecificity);
    if (minStrength !== undefined) filters.minStrength = parseFloat(minStrength);
    if (maxStrength !== undefined) filters.maxStrength = parseFloat(maxStrength);
    if (minSentiment !== undefined) filters.minSentiment = parseFloat(minSentiment);
    if (maxSentiment !== undefined) filters.maxSentiment = parseFloat(maxSentiment);

    // Get beliefs
    const allBeliefs = await topic.getBeliefs(filters);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedBeliefs = allBeliefs.slice(startIndex, endIndex);

    res.json({
      beliefs: paginatedBeliefs,
      total: allBeliefs.length,
      totalPages: Math.ceil(allBeliefs.length / limit),
      currentPage: page,
      topic: {
        _id: topic._id,
        name: topic.name,
        slug: topic.slug,
      },
    });
  } catch (error) {
    console.error('Error fetching topic beliefs:', error);
    res.status(500).json({
      message: 'Error fetching topic beliefs',
      error: error.message,
    });
  }
};

/**
 * Create a new topic
 * @route POST /api/topics
 */
export const createTopic = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      parentTopic,
      tags,
    } = req.body;

    // Check if topic already exists
    const existing = await Topic.findOne({ name });
    if (existing) {
      return res.status(400).json({
        message: 'A topic with this name already exists',
      });
    }

    const topic = await Topic.create({
      name,
      description,
      category,
      parentTopic,
      tags,
      createdBy: req.user?._id,
    });

    // If has parent, add to parent's subTopics
    if (parentTopic) {
      await Topic.findByIdAndUpdate(parentTopic, {
        $push: { subTopics: topic._id },
      });
    }

    res.status(201).json({
      message: 'Topic created successfully',
      topic,
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({
      message: 'Error creating topic',
      error: error.message,
    });
  }
};

/**
 * Update topic
 * @route PUT /api/topics/:id
 */
export const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const topic = await Topic.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json({
      message: 'Topic updated successfully',
      topic,
    });
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({
      message: 'Error updating topic',
      error: error.message,
    });
  }
};

/**
 * Update topic statistics
 * @route POST /api/topics/:id/update-statistics
 */
export const updateTopicStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    await topic.updateStatistics();

    res.json({
      message: 'Topic statistics updated successfully',
      statistics: topic.statistics,
    });
  } catch (error) {
    console.error('Error updating topic statistics:', error);
    res.status(500).json({
      message: 'Error updating topic statistics',
      error: error.message,
    });
  }
};

/**
 * Delete topic
 * @route DELETE /api/topics/:id
 */
export const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Check if topic has beliefs
    const beliefCount = await Belief.countDocuments({ topicId: id });
    if (beliefCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete topic with existing beliefs. Please reassign or delete beliefs first.',
        beliefCount,
      });
    }

    // Remove from parent's subTopics if applicable
    if (topic.parentTopic) {
      await Topic.findByIdAndUpdate(topic.parentTopic, {
        $pull: { subTopics: id },
      });
    }

    await Topic.findByIdAndDelete(id);

    res.json({
      message: 'Topic deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({
      message: 'Error deleting topic',
      error: error.message,
    });
  }
};

export default {
  getAllTopics,
  getTopicByIdOrSlug,
  getTopicBeliefs,
  createTopic,
  updateTopic,
  updateTopicStatistics,
  deleteTopic,
};
