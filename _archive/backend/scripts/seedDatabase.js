import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User, Belief, Argument, Evidence } from '../models/index.js';
import connectDB from '../config/database.js';

dotenv.config();

// Sample data
const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@ideastockexchange.org',
    password: 'admin123',
    role: 'admin',
    reputation: 100
  },
  {
    username: 'scientist_sarah',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'user',
    reputation: 85
  },
  {
    username: 'philosopher_phil',
    email: 'phil@example.com',
    password: 'password123',
    role: 'moderator',
    reputation: 92
  },
  {
    username: 'tech_tom',
    email: 'tom@example.com',
    password: 'password123',
    role: 'user',
    reputation: 67
  },
  {
    username: 'economist_emma',
    email: 'emma@example.com',
    password: 'password123',
    role: 'user',
    reputation: 78
  },
  {
    username: 'debater_dan',
    email: 'dan@example.com',
    password: 'password123',
    role: 'user',
    reputation: 45
  }
];

const sampleBeliefs = [
  {
    statement: 'Renewable energy can fully replace fossil fuels by 2050',
    description: 'With current technological trends and policy commitments, renewable energy sources (solar, wind, hydro, etc.) can completely replace fossil fuels for global energy needs by 2050.',
    category: 'science',
    tags: ['climate', 'energy', 'sustainability', 'technology'],
    status: 'active',
    trending: true
  },
  {
    statement: 'Universal Basic Income would reduce poverty more effectively than current welfare systems',
    description: 'Implementing a Universal Basic Income (UBI) where all citizens receive a regular, unconditional sum of money would be more effective at reducing poverty and inequality than current means-tested welfare programs.',
    category: 'economics',
    tags: ['UBI', 'poverty', 'welfare', 'economics', 'policy'],
    status: 'active',
    trending: true
  },
  {
    statement: 'Artificial Intelligence will create more jobs than it destroys',
    description: 'While AI automation will displace workers in certain sectors, it will simultaneously create new job categories and opportunities, resulting in a net increase in employment.',
    category: 'technology',
    tags: ['AI', 'employment', 'automation', 'future-of-work'],
    status: 'active',
    trending: false
  },
  {
    statement: 'Free will is an illusion created by deterministic brain processes',
    description: 'What we experience as "free will" is actually the result of deterministic neurological processes, and our choices are predetermined by prior causes including genetics, environment, and brain chemistry.',
    category: 'philosophy',
    tags: ['free-will', 'determinism', 'consciousness', 'neuroscience'],
    status: 'active',
    trending: false
  },
  {
    statement: 'Social media has a net negative impact on democracy',
    description: 'Despite some benefits for political organization and information sharing, social media platforms overall harm democratic processes through misinformation spread, polarization, and manipulation.',
    category: 'social',
    tags: ['social-media', 'democracy', 'misinformation', 'politics'],
    status: 'active',
    trending: true
  },
  {
    statement: 'Space exploration should be a higher priority than deep ocean exploration',
    description: 'Given limited resources, humanity should prioritize exploring and colonizing space over exploring the deep oceans, as space offers more potential for resource acquisition, scientific discovery, and species survival.',
    category: 'science',
    tags: ['space', 'ocean', 'exploration', 'priorities'],
    status: 'active',
    trending: false
  }
];

const sampleArguments = {
  renewable: {
    supporting: [
      {
        content: 'Solar and wind energy costs have declined by over 80% in the last decade, making them cheaper than fossil fuels in many regions. This economic advantage will drive rapid adoption even without policy mandates.',
        scores: { evidenceStrength: 0.9, logicalCoherence: 0.85, verificationCredibility: 0.88, linkageRelevance: 0.92, uniqueness: 0.87, argumentImportance: 0.90 }
      },
      {
        content: 'Energy storage technology, particularly battery systems, is improving exponentially. Tesla\'s Megapack and similar technologies are solving the intermittency problem of renewables.',
        scores: { evidenceStrength: 0.82, logicalCoherence: 0.88, verificationCredibility: 0.85, linkageRelevance: 0.89, uniqueness: 0.83, argumentImportance: 0.86 }
      },
      {
        content: 'Over 140 countries have committed to net-zero emissions by 2050, creating massive policy and market incentives for renewable energy transition.',
        scores: { evidenceStrength: 0.87, logicalCoherence: 0.82, verificationCredibility: 0.91, linkageRelevance: 0.85, uniqueness: 0.79, argumentImportance: 0.84 }
      }
    ],
    opposing: [
      {
        content: 'Current renewable technologies cannot provide baseload power reliably. Nuclear energy must be part of the mix, which technically isn\'t "renewable" but is carbon-free.',
        scores: { evidenceStrength: 0.78, logicalCoherence: 0.85, verificationCredibility: 0.82, linkageRelevance: 0.88, uniqueness: 0.85, argumentImportance: 0.83 }
      },
      {
        content: 'The rare earth minerals required for solar panels and batteries are limited and environmentally damaging to extract. Full replacement would create new environmental problems.',
        scores: { evidenceStrength: 0.75, logicalCoherence: 0.80, verificationCredibility: 0.77, linkageRelevance: 0.82, uniqueness: 0.88, argumentImportance: 0.81 }
      }
    ]
  },
  ubi: {
    supporting: [
      {
        content: 'Finland\'s UBI pilot showed participants experienced less stress, better health outcomes, and no reduction in employment. This contradicts the "people will stop working" objection.',
        scores: { evidenceStrength: 0.85, logicalCoherence: 0.88, verificationCredibility: 0.87, linkageRelevance: 0.90, uniqueness: 0.82, argumentImportance: 0.87 }
      },
      {
        content: 'Current welfare systems create "poverty traps" where earning more money can result in loss of benefits, discouraging work. UBI eliminates this perverse incentive.',
        scores: { evidenceStrength: 0.80, logicalCoherence: 0.92, verificationCredibility: 0.83, linkageRelevance: 0.91, uniqueness: 0.85, argumentImportance: 0.88 }
      }
    ],
    opposing: [
      {
        content: 'The cost of providing meaningful UBI to all citizens would require tax rates that would harm economic growth and entrepreneurship. Most estimates show UBI being prohibitively expensive.',
        scores: { evidenceStrength: 0.77, logicalCoherence: 0.83, verificationCredibility: 0.79, linkageRelevance: 0.88, uniqueness: 0.81, argumentImportance: 0.84 }
      },
      {
        content: 'UBI provides cash to everyone, including the wealthy who don\'t need it. Targeted welfare programs are more efficient at reducing poverty per dollar spent.',
        scores: { evidenceStrength: 0.75, logicalCoherence: 0.85, verificationCredibility: 0.78, linkageRelevance: 0.86, uniqueness: 0.79, argumentImportance: 0.82 }
      }
    ]
  },
  ai: {
    supporting: [
      {
        content: 'Historical precedent: Every major technological revolution (industrial, digital) created more jobs than it destroyed. The computer revolution eliminated typing pools but created millions of IT jobs.',
        scores: { evidenceStrength: 0.83, logicalCoherence: 0.87, verificationCredibility: 0.85, linkageRelevance: 0.84, uniqueness: 0.80, argumentImportance: 0.85 }
      },
      {
        content: 'AI creates entirely new job categories: AI trainers, prompt engineers, AI ethicists, robotic maintenance specialists. These didn\'t exist a decade ago.',
        scores: { evidenceStrength: 0.81, logicalCoherence: 0.79, verificationCredibility: 0.83, linkageRelevance: 0.88, uniqueness: 0.87, argumentImportance: 0.84 }
      }
    ],
    opposing: [
      {
        content: 'Unlike previous technological revolutions, AI can replace cognitive work, not just physical labor. This affects white-collar jobs (accounting, legal research, radiology) that previously seemed automation-proof.',
        scores: { evidenceStrength: 0.86, logicalCoherence: 0.90, verificationCredibility: 0.84, linkageRelevance: 0.89, uniqueness: 0.88, argumentImportance: 0.88 }
      },
      {
        content: 'The pace of AI advancement is exponentially faster than previous technological changes. Workers won\'t have time to retrain before their skills become obsolete.',
        scores: { evidenceStrength: 0.79, logicalCoherence: 0.82, verificationCredibility: 0.77, linkageRelevance: 0.85, uniqueness: 0.83, argumentImportance: 0.83 }
      }
    ]
  },
  freeWill: {
    supporting: [
      {
        content: 'Neuroscience studies by Benjamin Libet showed brain activity preceding conscious awareness of decision-making by several hundred milliseconds, suggesting decisions are made before we\'re aware of them.',
        scores: { evidenceStrength: 0.88, logicalCoherence: 0.85, verificationCredibility: 0.90, linkageRelevance: 0.87, uniqueness: 0.84, argumentImportance: 0.87 }
      },
      {
        content: 'If the universe is deterministic (governed by cause and effect), and our brains are part of the universe, then our thoughts and decisions must also be deterministic. There\'s no room for "free" choices.',
        scores: { evidenceStrength: 0.75, logicalCoherence: 0.91, verificationCredibility: 0.72, linkageRelevance: 0.88, uniqueness: 0.80, argumentImportance: 0.83 }
      }
    ],
    opposing: [
      {
        content: 'Quantum indeterminacy at the subatomic level introduces true randomness into physics, breaking strict determinism. This leaves room for free will, even if we don\'t fully understand the mechanism.',
        scores: { evidenceStrength: 0.77, logicalCoherence: 0.80, verificationCredibility: 0.81, linkageRelevance: 0.74, uniqueness: 0.85, argumentImportance: 0.79 }
      },
      {
        content: 'The subjective experience of making choices is so compelling and universal that dismissing it requires extraordinary evidence. Our legal systems, moral frameworks, and personal relationships all assume free will.',
        scores: { evidenceStrength: 0.70, logicalCoherence: 0.75, verificationCredibility: 0.73, linkageRelevance: 0.79, uniqueness: 0.82, argumentImportance: 0.76 }
      }
    ]
  },
  socialMedia: {
    supporting: [
      {
        content: 'Studies show social media algorithms amplify outrage and extreme content because it drives engagement. The Facebook Papers revealed the company knew its platform was polarizing users.',
        scores: { evidenceStrength: 0.91, logicalCoherence: 0.88, verificationCredibility: 0.93, linkageRelevance: 0.92, uniqueness: 0.86, argumentImportance: 0.91 }
      },
      {
        content: 'Foreign interference in elections (Russian 2016 US election operations) was facilitated by social media\'s ability to microtarget propaganda. This vulnerability is inherent to the platform design.',
        scores: { evidenceStrength: 0.89, logicalCoherence: 0.85, verificationCredibility: 0.90, linkageRelevance: 0.87, uniqueness: 0.83, argumentImportance: 0.88 }
      }
    ],
    opposing: [
      {
        content: 'Social media enabled the Arab Spring and Hong Kong protests, giving voice to oppressed populations. Its role in organizing democratic movements outweighs the negatives.',
        scores: { evidenceStrength: 0.82, logicalCoherence: 0.80, verificationCredibility: 0.85, linkageRelevance: 0.83, uniqueness: 0.81, argumentImportance: 0.83 }
      },
      {
        content: 'The problem is not social media itself but poor digital literacy. With proper education, people can navigate these platforms without being manipulated.',
        scores: { evidenceStrength: 0.68, logicalCoherence: 0.76, verificationCredibility: 0.70, linkageRelevance: 0.77, uniqueness: 0.79, argumentImportance: 0.73 }
      }
    ]
  },
  space: {
    supporting: [
      {
        content: 'Asteroid mining could provide resources worth trillions of dollars and solve resource scarcity on Earth. A single asteroid like 16 Psyche contains metals worth $10 quintillion.',
        scores: { evidenceStrength: 0.79, logicalCoherence: 0.82, verificationCredibility: 0.76, linkageRelevance: 0.85, uniqueness: 0.87, argumentImportance: 0.82 }
      },
      {
        content: 'Becoming a multi-planetary species is essential for long-term survival. A single planet-wide catastrophe (asteroid, nuclear war, pandemic) could end humanity. Mars colonization provides insurance.',
        scores: { evidenceStrength: 0.81, logicalCoherence: 0.88, verificationCredibility: 0.79, linkageRelevance: 0.86, uniqueness: 0.82, argumentImportance: 0.85 }
      }
    ],
    opposing: [
      {
        content: 'The ocean produces over 50% of Earth\'s oxygen and regulates climate. Understanding and protecting ocean ecosystems is crucial for immediate human survival, unlike Mars colonization.',
        scores: { evidenceStrength: 0.88, logicalCoherence: 0.91, verificationCredibility: 0.92, linkageRelevance: 0.90, uniqueness: 0.84, argumentImportance: 0.90 }
      },
      {
        content: 'Ocean exploration costs a fraction of space exploration and has immediate practical benefits: new medicines, protein sources, mineral resources. The ocean floor is closer and more accessible than Mars.',
        scores: { evidenceStrength: 0.84, logicalCoherence: 0.87, verificationCredibility: 0.86, linkageRelevance: 0.89, uniqueness: 0.81, argumentImportance: 0.87 }
      }
    ]
  }
};

const sampleEvidence = [
  {
    title: 'IRENA Renewable Power Generation Costs Report 2021',
    description: 'Comprehensive analysis showing solar and wind costs have dropped 85% and 56% respectively since 2010.',
    type: 'study',
    source: {
      url: 'https://www.irena.org/publications/2021/Jun/Renewable-Power-Costs-in-2020',
      author: 'International Renewable Energy Agency',
      publication: 'IRENA',
      date: new Date('2021-06-01')
    },
    credibilityScore: 92,
    verificationStatus: 'verified',
    tags: ['renewable-energy', 'costs', 'solar', 'wind']
  },
  {
    title: 'Finland Basic Income Experiment Results',
    description: 'Official results from Finland\'s 2017-2018 UBI pilot involving 2,000 unemployed citizens.',
    type: 'study',
    source: {
      url: 'https://www.kela.fi/web/en/experimental-study-on-a-universal-basic-income',
      author: 'Kela Research Department',
      publication: 'Kela (Social Insurance Institution of Finland)',
      date: new Date('2020-05-06')
    },
    credibilityScore: 88,
    verificationStatus: 'verified',
    metadata: {
      citations: 342
    },
    tags: ['UBI', 'finland', 'pilot-study', 'welfare']
  },
  {
    title: 'The Facebook Papers - Internal Research on Polarization',
    description: 'Leaked internal Facebook research showing the platform\'s algorithms increase polarization.',
    type: 'article',
    source: {
      url: 'https://www.wsj.com/articles/the-facebook-files-11631713039',
      author: 'Jeff Horwitz',
      publication: 'Wall Street Journal',
      date: new Date('2021-09-13')
    },
    credibilityScore: 90,
    verificationStatus: 'verified',
    tags: ['facebook', 'polarization', 'algorithms', 'social-media']
  },
  {
    title: 'Libet Experiment: Brain Activity Precedes Conscious Decision',
    description: 'Landmark neuroscience study showing brain activity begins before conscious awareness of making a decision.',
    type: 'study',
    source: {
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3124546/',
      author: 'Benjamin Libet',
      publication: 'Brain',
      date: new Date('1983-09-01')
    },
    credibilityScore: 86,
    verificationStatus: 'verified',
    metadata: {
      pmid: '6640273',
      citations: 4523
    },
    tags: ['neuroscience', 'free-will', 'consciousness', 'determinism']
  },
  {
    title: 'McKinsey: Jobs Lost, Jobs Gained - Workforce Transitions',
    description: 'Analysis of AI impact on employment showing potential for net job growth with proper transition support.',
    type: 'study',
    source: {
      url: 'https://www.mckinsey.com/featured-insights/future-of-work/jobs-lost-jobs-gained-what-the-future-of-work-will-mean-for-jobs-skills-and-wages',
      author: 'McKinsey Global Institute',
      publication: 'McKinsey & Company',
      date: new Date('2017-11-28')
    },
    credibilityScore: 84,
    verificationStatus: 'verified',
    metadata: {
      citations: 892
    },
    tags: ['AI', 'employment', 'automation', 'future-of-work']
  },
  {
    title: '16 Psyche Asteroid Mission Overview',
    description: 'NASA mission to metal-rich asteroid worth an estimated $10 quintillion in resources.',
    type: 'article',
    source: {
      url: 'https://www.nasa.gov/mission/psyche/',
      author: 'NASA',
      publication: 'NASA',
      date: new Date('2023-10-13')
    },
    credibilityScore: 91,
    verificationStatus: 'verified',
    tags: ['space', 'asteroid-mining', 'resources', 'NASA']
  }
];

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  await User.deleteMany({});
  await Belief.deleteMany({});
  await Argument.deleteMany({});
  await Evidence.deleteMany({});
  console.log('✅ Database cleared');
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  const users = [];

  for (const userData of sampleUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({
      ...userData,
      password: hashedPassword
    });
    users.push(user);
    console.log(`   ✓ Created user: ${user.username}`);
  }

  return users;
}

async function seedEvidence(users) {
  console.log('📎 Seeding evidence...');
  const evidenceList = [];

  for (let i = 0; i < sampleEvidence.length; i++) {
    const evidenceData = sampleEvidence[i];
    const randomUser = users[Math.floor(Math.random() * users.length)];

    const evidence = await Evidence.create({
      ...evidenceData,
      submittedBy: randomUser._id,
      verifiedBy: evidenceData.verificationStatus === 'verified' ? [{
        user: users[0]._id, // admin verifies
        status: 'verified',
        notes: 'Verified by admin',
        verifiedAt: new Date()
      }] : []
    });

    evidenceList.push(evidence);
    console.log(`   ✓ Created evidence: ${evidence.title}`);
  }

  return evidenceList;
}

async function seedBeliefs(users, evidenceList) {
  console.log('💡 Seeding beliefs and arguments...');
  const beliefs = [];

  const beliefKeys = ['renewable', 'ubi', 'ai', 'freeWill', 'socialMedia', 'space'];

  for (let i = 0; i < sampleBeliefs.length; i++) {
    const beliefData = sampleBeliefs[i];
    const beliefKey = beliefKeys[i];
    const author = users[i % users.length];

    // Create belief
    const belief = await Belief.create({
      ...beliefData,
      author: author._id,
      conclusionScore: 50, // Will be recalculated
      statistics: {
        views: Math.floor(Math.random() * 1000) + 50,
        supportingCount: 0,
        opposingCount: 0,
        totalArguments: 0
      }
    });

    // Create supporting arguments
    const supportingArgs = [];
    for (const argData of sampleArguments[beliefKey].supporting) {
      const argAuthor = users[Math.floor(Math.random() * users.length)];
      const argument = await Argument.create({
        ...argData,
        type: 'supporting',
        beliefId: belief._id,
        author: argAuthor._id,
        votes: {
          up: Math.floor(Math.random() * 50) + 5,
          down: Math.floor(Math.random() * 10)
        },
        evidence: [evidenceList[i % evidenceList.length]._id],
        reasonRankScore: Math.random() * 0.3 + 0.7 // 0.7-1.0 for supporting
      });

      // Calculate overall score
      await argument.calculateOverallScore();
      supportingArgs.push(argument._id);

      console.log(`   ✓ Created supporting argument for: ${belief.statement.substring(0, 50)}...`);
    }

    // Create opposing arguments
    const opposingArgs = [];
    for (const argData of sampleArguments[beliefKey].opposing) {
      const argAuthor = users[Math.floor(Math.random() * users.length)];
      const argument = await Argument.create({
        ...argData,
        type: 'opposing',
        beliefId: belief._id,
        author: argAuthor._id,
        votes: {
          up: Math.floor(Math.random() * 40) + 3,
          down: Math.floor(Math.random() * 8)
        },
        evidence: [evidenceList[i % evidenceList.length]._id],
        reasonRankScore: Math.random() * 0.3 + 0.5 // 0.5-0.8 for opposing
      });

      // Calculate overall score
      await argument.calculateOverallScore();
      opposingArgs.push(argument._id);

      console.log(`   ✓ Created opposing argument for: ${belief.statement.substring(0, 50)}...`);
    }

    // Update belief with arguments
    belief.supportingArguments = supportingArgs;
    belief.opposingArguments = opposingArgs;
    await belief.updateStatistics();
    await belief.calculateConclusionScore();
    await belief.save();

    beliefs.push(belief);
    console.log(`   ✅ Created belief: ${belief.statement}`);
    console.log(`      Score: ${Math.round(belief.conclusionScore)} | Supporting: ${supportingArgs.length} | Opposing: ${opposingArgs.length}`);
  }

  return beliefs;
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await connectDB();

    // Clear existing data
    await clearDatabase();
    console.log('');

    // Seed in order
    const users = await seedUsers();
    console.log('');

    const evidenceList = await seedEvidence(users);
    console.log('');

    const beliefs = await seedBeliefs(users, evidenceList);
    console.log('');

    console.log('✅ Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Beliefs: ${beliefs.length}`);
    console.log(`   Evidence: ${evidenceList.length}`);
    console.log(`   Total Arguments: ${beliefs.reduce((sum, b) => sum + (b.supportingArguments.length + b.opposingArguments.length), 0)}`);
    console.log('\n🔑 Login credentials:');
    console.log('   Email: admin@ideastockexchange.org');
    console.log('   Password: admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();
