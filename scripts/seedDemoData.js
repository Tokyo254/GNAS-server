const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');

const demoBlogPosts = [
  {
    headline: "The Future of AI in Public Relations: How Machine Learning is Transforming Media Outreach",
    summary: "Explore how artificial intelligence is revolutionizing PR strategies, from media monitoring to personalized pitching and crisis management.",
    fullContent: `Artificial intelligence is no longer a futuristic concept—it's actively reshaping the public relations landscape. From automated media monitoring to AI-driven sentiment analysis, machine learning algorithms are helping PR professionals identify opportunities and threats in real-time. These tools can analyze thousands of media outlets simultaneously, flag relevant journalists, and even suggest optimal pitching times based on historical engagement data. The result? More targeted outreach, higher success rates, and measurable ROI on PR campaigns. As AI continues to evolve, we're seeing the emergence of predictive analytics that can forecast media trends and identify emerging story angles before they become mainstream.`,
    categories: ["Technology", "AI", "Digital PR"],
    tags: ["artificial intelligence", "machine learning", "media relations", "digital transformation"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      altText: "AI and machine learning concept with neural networks visualization",
      caption: "AI is transforming how PR professionals analyze media and engage with audiences"
    },
    readTime: "4 min read",
    status: "published",
    views: 1247,
    shares: 23,
    keywords: ["AI", "machine learning", "media monitoring", "predictive analytics"],
    popularScore: 87
  },
  {
    headline: "Crisis Communication in the Digital Age: Strategies for Managing Brand Reputation",
    summary: "Learn essential crisis communication strategies that protect your brand's reputation when facing public scrutiny and media backlash.",
    fullContent: `In today's hyper-connected world, a brand crisis can escalate from zero to viral in minutes. The key to effective crisis management lies in preparation, speed, and transparency. Establish a crisis communication plan before you need it, including designated spokespeople, pre-approved messaging templates, and a clear chain of command. When crisis strikes, respond quickly but thoughtfully—acknowledge the situation within the first hour, even if you don't have all the answers. Use social media to provide regular updates and correct misinformation. Remember that authenticity matters more than perfection; consumers can spot corporate-speak from miles away.`,
    categories: ["Crisis Management", "Reputation", "Strategy"],
    tags: ["crisis communication", "brand reputation", "media relations", "public relations"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1531058385699-d2d8c39bc8cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      altText: "Crisis management team in a strategic meeting",
      caption: "Effective crisis communication requires preparation and rapid response"
    },
    readTime: "5 min read",
    status: "published",
    views: 1893,
    shares: 45,
    keywords: ["crisis management", "reputation", "brand protection", "communication strategy"],
    popularScore: 92
  },
  {
    headline: "Beyond the Press Release: Creating Compelling Content That Journalists Actually Want",
    summary: "Discover how to move beyond traditional press releases and create content that captures media attention and drives meaningful coverage.",
    fullContent: `The traditional press release is no longer enough to capture media attention in today's crowded digital landscape. Journalists receive hundreds of pitches daily, so standing out requires creativity and value. Instead of generic announcements, consider creating data-driven reports, original research, or compelling visual content. Develop relationships with journalists by understanding their beats and providing exclusive angles. Multimedia elements like infographics, videos, and interactive tools can make your story more appealing. Remember that journalists are looking for stories that will engage their audience, not just promote your brand.`,
    categories: ["Content Strategy", "Media Relations", "Storytelling"],
    tags: ["content creation", "journalist outreach", "media pitching", "storytelling"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1586232702178-f044c5f4d4b7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      altText: "Journalist working on a laptop with notebook and coffee",
      caption: "Create content that resonates with journalists and their audiences"
    },
    readTime: "3 min read",
    status: "published",
    views: 956,
    shares: 18,
    keywords: ["content strategy", "media pitching", "journalist relations", "storytelling"],
    popularScore: 76
  },
  {
    headline: "Measuring PR Success: Moving Beyond Media Mentions to Meaningful Metrics",
    summary: "Learn how to demonstrate PR's impact on business objectives with actionable metrics that matter to executives and stakeholders.",
    fullContent: `For too long, PR success has been measured by vanity metrics like ad value equivalency and media mentions. While these have their place, modern PR professionals need to connect their efforts to business outcomes. Start by aligning PR goals with organizational objectives—whether that's brand awareness, lead generation, or reputation management. Track metrics like share of voice against competitors, message pull-through in coverage, and website traffic from earned media. Use tools that can attribute leads and conversions to specific PR activities. Most importantly, create regular reports that tell a compelling story about how PR is driving business value.`,
    categories: ["Analytics", "Measurement", "Strategy"],
    tags: ["PR metrics", "analytics", "ROI", "measurement"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      altText: "Data analytics dashboard showing PR metrics and performance",
      caption: "Measure what matters - connect PR efforts to business outcomes"
    },
    readTime: "4 min read",
    status: "published",
    views: 1123,
    shares: 32,
    keywords: ["PR measurement", "analytics", "ROI", "performance metrics"],
    popularScore: 81
  },
  {
    headline: "The Power of Thought Leadership: Building Authority in Your Industry",
    summary: "Discover how to position your executives and brand as industry thought leaders to attract opportunities and build credibility.",
    fullContent: `Thought leadership isn't just about being quoted in articles—it's about shaping conversations and driving innovation in your industry. Start by identifying your unique perspective and areas of expertise where you can offer genuine value. Develop a content strategy that includes bylined articles, speaking engagements, and social media presence. Focus on educating rather than selling, and be willing to address controversial topics or challenge conventional wisdom. The most effective thought leaders combine deep industry knowledge with forward-thinking insights that help their audience navigate complex challenges.`,
    categories: ["Thought Leadership", "Content Strategy", "Brand Building"],
    tags: ["thought leadership", "executive presence", "industry authority", "content marketing"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      altText: "Executive speaking at industry conference as thought leader",
      caption: "Build authority by sharing valuable insights and unique perspectives"
    },
    readTime: "5 min read",
    status: "published",
    views: 1456,
    shares: 41,
    keywords: ["thought leadership", "industry authority", "executive branding", "content strategy"],
    popularScore: 89
  },
  {
    headline: "Social Media PR: Leveraging Platforms for Brand Storytelling and Engagement",
    summary: "Explore how to integrate social media into your PR strategy for real-time engagement and authentic brand storytelling.",
    fullContent: `Social media has blurred the lines between PR, marketing, and customer service, creating both challenges and opportunities. Use social listening tools to monitor conversations about your brand and industry in real-time. Develop a content calendar that balances promotional messages with value-added content and engagement. When crisis hits, social media becomes your first line of defense—respond quickly, authentically, and consistently across platforms. Don't just broadcast; create opportunities for two-way conversations that humanize your brand and build community.`,
    categories: ["Social Media", "Digital PR", "Engagement"],
    tags: ["social media", "community management", "brand storytelling", "digital engagement"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1611605698335-8b1569810432?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      altText: "Multiple social media icons and interfaces on digital screens",
      caption: "Social media platforms offer powerful tools for real-time brand storytelling"
    },
    readTime: "4 min read",
    status: "published",
    views: 1321,
    shares: 28,
    keywords: ["social media PR", "digital engagement", "brand storytelling", "community management"],
    popularScore: 84
  },
  {
    headline: "Building Media Relationships That Last: Beyond the Transactional Pitch",
    summary: "Learn the art of cultivating genuine relationships with journalists that lead to better coverage and exclusive opportunities.",
    fullContent: `The best media relationships are built on mutual respect and understanding, not just transactional pitching. Take time to research journalists' beats, interests, and preferred communication methods. Engage with their content on social media before you need anything from them. When you do pitch, make it personalized and relevant to their recent work. Offer exclusive angles or data that align with their audience's interests. Remember that relationships take time to build—focus on being a helpful resource rather than just another PR person asking for coverage.`,
    categories: ["Media Relations", "Networking", "Pitching"],
    tags: ["media relationships", "journalist outreach", "networking", "pitching strategies"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      altText: "Two professionals building relationships through conversation",
      caption: "Genuine media relationships are built on trust and mutual value"
    },
    readTime: "3 min read",
    status: "published",
    views: 876,
    shares: 15,
    keywords: ["media relations", "journalist relationships", "networking", "pitching"],
    popularScore: 72
  },
  {
    headline: "The Evolution of Press Releases: Modern Formats for Maximum Impact",
    summary: "Discover how to transform traditional press releases into multimedia-rich content that captures attention and drives action.",
    fullContent: `Press releases have evolved from text-heavy documents to dynamic, multimedia experiences. Modern press releases should include high-quality images, video embeds, social media-friendly quotes, and interactive elements. Consider creating dedicated landing pages for major announcements with additional resources for journalists. Optimize your releases for search with relevant keywords and clear calls-to-action. Most importantly, ensure your news is actually newsworthy—announcements that demonstrate innovation, impact, or human interest tend to perform best.`,
    categories: ["Content Creation", "Media Relations", "Digital PR"],
    tags: ["press releases", "content format", "multimedia", "announcements"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1551836026-d5c8c2a223d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      altText: "Modern press release displayed across multiple digital devices",
      caption: "Modern press releases incorporate multimedia elements for greater impact"
    },
    readTime: "4 min read",
    status: "published",
    views: 987,
    shares: 22,
    keywords: ["press releases", "multimedia content", "announcements", "digital PR"],
    popularScore: 78
  },
  {
    headline: "Global PR Strategies: Navigating Cultural Differences in International Markets",
    summary: "Learn how to adapt your PR approach for different cultures and markets while maintaining consistent brand messaging.",
    fullContent: `Expanding your PR efforts internationally requires more than just translating content—it demands cultural intelligence and local expertise. Research cultural norms around communication styles, business etiquette, and media consumption in each target market. Partner with local agencies or consultants who understand the media landscape and can provide cultural context. Adapt your messaging to resonate with local values while maintaining core brand elements. Be prepared to adjust your timing, as news cycles and business hours vary globally. Most importantly, listen more than you speak when entering new markets.`,
    categories: ["International PR", "Strategy", "Global Marketing"],
    tags: ["global PR", "international markets", "cultural intelligence", "localization"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      altText: "World map with global connections and network lines",
      caption: "Global PR success requires cultural intelligence and localized strategies"
    },
    readTime: "6 min read",
    status: "published",
    views: 765,
    shares: 19,
    keywords: ["global PR", "international markets", "cultural intelligence", "localization"],
    popularScore: 69
  },
  {
    headline: "Integrating PR and Marketing: Creating a Unified Brand Voice Across Channels",
    summary: "Discover strategies for breaking down silos between PR and marketing to create cohesive brand experiences for your audience.",
    fullContent: `When PR and marketing teams work in isolation, they create inconsistent messaging and missed opportunities. Start by establishing shared goals and metrics that align both teams. Create integrated campaigns where earned, owned, and paid media work together to tell a cohesive story. Develop brand guidelines that cover messaging, tone, and visual identity across all touchpoints. Use regular cross-functional meetings to share insights and coordinate timing. The most successful organizations treat PR and marketing as two sides of the same coin, working together to build brand reputation and drive business growth.`,
    categories: ["Integrated Marketing", "Strategy", "Brand Management"],
    tags: ["PR integration", "marketing alignment", "brand voice", "cross-functional teams"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      altText: "Team collaboration between PR and marketing departments",
      caption: "Integrated PR and marketing creates consistent brand experiences"
    },
    readTime: "5 min read",
    status: "published",
    views: 1342,
    shares: 36,
    keywords: ["PR integration", "marketing alignment", "brand voice", "cross-functional collaboration"],
    popularScore: 85
  }
];

const seedDemoData = async (adminUserId) => {
  try {
    console.log('🌱 Starting demo data seeding...');

    // Clear existing demo posts
    await BlogPost.deleteMany({});
    
    // Add admin user as author to all posts with proper schema
    const postsWithAuthor = demoBlogPosts.map(post => ({
      ...post,
      author: adminUserId,
      publicationDate: new Date(),
      likes: [], // Empty array - will be populated by real user interactions
      galleryImages: [], // Empty array as per schema
      attachments: [], // Empty array as per schema
      // Ensure proper array formatting
      categories: Array.isArray(post.categories) ? post.categories : [post.categories],
      tags: Array.isArray(post.tags) ? post.tags : [post.tags],
      keywords: Array.isArray(post.keywords) ? post.keywords : [post.keywords],
      // Ensure numbers are properly typed
      views: Number(post.views),
      shares: Number(post.shares),
      popularScore: Number(post.popularScore)
    }));

    // Insert demo posts
    const result = await BlogPost.insertMany(postsWithAuthor);
    
    console.log(`✅ Successfully seeded ${result.length} demo blog posts`);
    return {
      success: true,
      message: `Successfully seeded ${result.length} demo blog posts`,
      posts: result
    };
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    return {
      success: false,
      message: 'Error seeding demo data',
      error: error.message
    };
  }
};

module.exports = { seedDemoData };