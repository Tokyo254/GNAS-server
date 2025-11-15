const BlogPost = require('../models/BlogPost');
const PressRelease = require('../models/PressRelease');

// Get all published posts with enhanced like handling
exports.getPublishedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'published';

    // Get blog posts with likes populated
    const blogPosts = await BlogPost.find({ status })
      .populate('author', 'firstName lastName name title company avatar verified bio')
      .populate('likes', 'firstName lastName avatar') // Populate likes with basic user info
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get press releases
    const pressReleases = await PressRelease.find({ status: 'Published' })
      .populate('author', 'firstName lastName name title company avatar verified')
      .sort({ publicationDate: -1 })
      .skip(skip)
      .limit(limit);

    // Enhanced transform function with proper like handling
    const transformPost = (post, type = 'article') => {
      const postObj = post.toObject ? post.toObject() : post;
      const userId = req.user?._id?.toString();
      
      // Handle likes - check if current user liked the post
      let userLiked = false;
      let likesCount = 0;
      
      if (postObj.likes && Array.isArray(postObj.likes)) {
        likesCount = postObj.likes.length;
        if (userId) {
          userLiked = postObj.likes.some(like => 
            like && like._id && like._id.toString() === userId
          );
        }
      }

      return {
        _id: postObj._id,
        headline: postObj.headline,
        summary: postObj.summary,
        fullContent: postObj.fullContent,
        authorDetails: {
          _id: postObj.author?._id,
          name: postObj.author?.name || `${postObj.author?.firstName} ${postObj.author?.lastName}`,
          title: postObj.author?.title || '',
          company: postObj.author?.company || postObj.author?.orgName || '',
          avatar: postObj.author?.avatar || '',
          verified: postObj.author?.verified || false,
          bio: postObj.author?.bio || ''
        },
        publicationDate: postObj.publicationDate || postObj.createdAt,
        readTime: postObj.readTime || '5 min read',
        categories: postObj.categories || [],
        tags: postObj.tags || [],
        featuredImage: postObj.featuredImage?.url ? { url: postObj.featuredImage.url } : undefined,
        views: postObj.views || 0,
        likes: postObj.likes || [],
        likesCount: likesCount,
        userLiked: userLiked, // Add user like status
        shares: postObj.shares || 0,
        slug: postObj.slug || postObj._id.toString(),
        type: type
      };
    };

    const allPosts = [
      ...blogPosts.map(post => transformPost(post, 'article')),
      ...pressReleases.map(release => transformPost(release, 'press-release'))
    ];

    // Sort by publication date (newest first)
    allPosts.sort((a, b) => new Date(b.publicationDate) - new Date(a.publicationDate));

    const totalPosts = allPosts.length;

    res.json({
      success: true,
      data: allPosts.slice(0, limit),
      total: totalPosts,
      pagination: {
        current: page,
        pages: Math.ceil(totalPosts / limit),
        total: totalPosts
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts'
    });
  }
};

// Get single post by ID with enhanced like handling
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching post by ID:', id);

    // Try to find as blog post first with likes populated
    let post = await BlogPost.findById(id)
      .populate('author', 'firstName lastName name title company avatar verified bio socialLinks')
      .populate('likes', 'firstName lastName avatar'); // Populate likes

    let type = 'article';

    // If not found as blog post, try as press release
    if (!post) {
      post = await PressRelease.findById(id)
        .populate('author', 'firstName lastName name title company avatar verified bio socialLinks');
      type = 'press-release';
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    // Transform post with like status
    const postObj = post.toObject();
    const userId = req.user?._id?.toString();
    
    let userLiked = false;
    let likesCount = 0;
    
    if (postObj.likes && Array.isArray(postObj.likes)) {
      likesCount = postObj.likes.length;
      if (userId) {
        userLiked = postObj.likes.some(like => 
          like && like._id && like._id.toString() === userId
        );
      }
    }

    const transformedPost = {
      _id: postObj._id,
      headline: postObj.headline,
      summary: postObj.summary,
      fullContent: postObj.fullContent,
      authorDetails: {
        _id: postObj.author?._id,
        name: postObj.author?.name || `${postObj.author?.firstName} ${postObj.author?.lastName}`,
        title: postObj.author?.title || '',
        company: postObj.author?.company || postObj.author?.orgName || '',
        avatar: postObj.author?.avatar || '',
        verified: postObj.author?.verified || false,
        bio: postObj.author?.bio || ''
      },
      publicationDate: postObj.publicationDate || postObj.createdAt,
      readTime: postObj.readTime || '5 min read',
      categories: postObj.categories || [],
      tags: postObj.tags || [],
      featuredImage: postObj.featuredImage?.url ? { url: postObj.featuredImage.url } : undefined,
      views: postObj.views || 0,
      likes: postObj.likes || [],
      likesCount: likesCount,
      userLiked: userLiked, // Add user like status
      shares: postObj.shares || 0,
      slug: postObj.slug || postObj._id.toString(),
      type: type
    };

    res.json({
      success: true,
      data: transformedPost
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post'
    });
  }
};

// Like/Unlike a post - Production ready
exports.likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const hasLiked = post.likes.some(likeId => likeId.toString() === userId.toString());
    
    let update;
    if (hasLiked) {
      // Unlike - remove user from likes array
      update = { $pull: { likes: userId } };
    } else {
      // Like - add user to likes array
      update = { $addToSet: { likes: userId } };
    }

    const updatedPost = await BlogPost.findByIdAndUpdate(
      id,
      update,
      { new: true }
    ).populate('author', 'firstName lastName avatar')
     .populate('likes', 'firstName lastName avatar');

    res.json({
      success: true,
      data: {
        likesCount: updatedPost.likes.length,
        userLiked: !hasLiked,
        post: {
          _id: updatedPost._id,
          likesCount: updatedPost.likes.length
        }
      }
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating like'
    });
  }
};