import * as xlsx from 'xlsx';
import { prisma } from '../src/lib/prisma';

// Custom hand-crafted VIP parent-facing marketing profiles
const VIP_BIOS: Record<string, string> = {
  'William Burke-White':
    'Professor William Burke-White is a premier international law scholar and Inaugural Director at the University of Pennsylvania, having served as Deputy Dean of UPenn Law. A former member of the Secretary of State\'s Policy Planning Staff in the Obama Administration, Dr. Burke-White served as a principal drafter for major U.S. foreign policy reviews and advised high-level delegations on international treaties, including the Paris Climate Agreement. Holding a J.D. from Harvard Law School and a Ph.D. in International Relations from Cambridge as a Fulbright Scholar, Dr. Burke-White offers students an unprecedented insider perspective into global diplomacy, treaty negotiation, and international governance.',

  'Jason Sello':
    'A leading pharmaceutical chemist at the University of California, San Francisco (UCSF)—the nation\'s premier biomedical research institution—Professor Jason Sello is an investigator at the Chan Zuckerberg Biohub and recipient of the prestigious U.S. National Science Foundation (NSF) Career Award. Having completed his postdoctoral fellowship at Harvard University, Dr. Sello directs cutting-edge laboratories pioneering next-generation antimicrobial drugs and therapeutic enzymes to combat antibiotic-resistant superbugs. Under his mentorship, students gain direct exposure to elite pharmaceutical discovery pipelines, mastering the molecular modeling and experimental design standards valued by top medical schools and Ivy League bioscience faculties.',

  'Aziz Aboobaker':
    'Chair of Functional Genomics at the University of Oxford and Dean of Lady Margaret Hall, Professor Aziz Aboobaker is an internationally celebrated authority on regenerative biology and stem cell genetics. As Vice Chair of the Oxford Genomics Supervisory Committee and Associate Editor of PLOS Genetics, Dr. Aboobaker leads groundbreaking research into how planarian flatworms achieve biological immortality through limitless tissue regeneration. Students mentored by Professor Aboobaker engage directly with high-throughput genomic data, modern CRISPR gene-editing models, and advanced bioinformatics—developing foundational scholarship alongside one of Oxford\'s premier research supervisors.',

  'David McMillon':
    'A quantitative economist trained at the University of Chicago (Ph.D.) and Harvard University (Postdoctoral Fellow), Professor David McMillon is an Assistant Professor of Economics at Emory University. His research models the dynamics of human capital formation, educational inequality, and behavioral decision-making under scarcity. Dr. McMillon applies sophisticated econometric and machine learning tools to high-stakes policy questions. Students working with Professor McMillon master rigorous empirical data analysis, learning how to test economic hypotheses against real-world datasets and construct mathematically defensible policy recommendations.',

  'Sebastian Rosato':
    'An internationally acclaimed foreign policy realist, Professor Sebastian Rosato is Professor of Political Science at the University of Notre Dame and co-author (with legendary scholar John Mearsheimer) of How States Think: The Rationality of Foreign Policy. Holding degrees from Cambridge, Oxford, and a Ph.D. from the University of Chicago, Dr. Rosato is a foremost authority on grand strategy, great power politics, and global security architectures. Mentorship with Dr. Rosato trains young scholars in the rigorous analytical frameworks employed by diplomats, national security councils, and elite political science programs—equipping students with world-class writing and policy evaluation skills.',

  'Brian Stoltz':
    'Professor of Chemistry at the California Institute of Technology (Caltech) and Director of the Stoltz Group, Dr. Brian Stoltz is the recipient of the prestigious Feynman Prize and an internationally recognized pioneer in synthetic organic chemistry. Renowned for inventing groundbreaking chemical transformations, asymmetric catalysis methods, and total syntheses of bioactive natural products, Dr. Stoltz trains students in the rigorous mechanistic logic and molecular design that define world-class chemical biology laboratories.',

  'Samuel Kunes':
    'Professor of Molecular and Cellular Biology at Harvard University, Dr. Samuel Kunes is a celebrated neuroscientist and geneticist whose laboratory explores the fundamental cellular mechanisms of learning, memory, and neurodegenerative disease. A Pew Scholar in the Biomedical Sciences and recipient of the Damon Runyon–Walter Winchell Fellowship, Professor Kunes guides students through experimental design and molecular neurobiology with the uncompromising academic rigor of Harvard\'s premier bioscience programs.',

  'Anastasia Romanou':
    'Holding a joint appointment as Adjunct Associate Professor of Applied Physics and Applied Mathematics at Columbia University and Physical Research Scientist at the NASA Goddard Institute for Space Studies (GISS), Dr. Anastasia Romanou is a lead contributor to NASA and international climate modeling initiatives. Specializing in Earth system dynamics and high-performance climate simulations, Dr. Romanou mentors students in harnessing supercomputing data, mathematical modeling, and planetary science to solve high-stakes global challenges.',

  'Achilles Venetoulias':
    'With over 30 years of premier leadership in financial risk management and algorithmic hedge funds, Achilles Venetoulias is Adjunct Professor of Finance at Columbia Business School and former faculty at the MIT Sloan School of Management. Having founded two quantitative hedge funds and supervised European fund-of-funds investment strategies, Professor Venetoulias equips aspiring financial economists with elite quantitative modeling, risk parity frameworks, and Wall Street-caliber analytical acumen.',

  'Alexander Ploss':
    'The Harry C. Wiess Professor in Life Sciences at Princeton University and Acting Co-Director of the Global Health Program, Dr. Alexander Ploss is an elected Fellow of the American Academy of Microbiology. Leading premier research on viral immunology and hepatotropic pathogens (HBV, HCV, and malaria), Professor Ploss trains students in the experimental design, immunological modeling, and translational bio-investigation required for competitive Ivy League medical and scientific careers.',

  'Robin Murphy':
    'Professor of Experimental Psychology at the University of Oxford, Fellow, and Tutor for Admissions at Corpus Christi College, Dr. Robin Murphy is Director of the Computational Psychopathology Research Group. An expert on how neural mechanisms and causal reasoning shape cognition, Professor Murphy provides students with an invaluable insider perspective on Oxford tutorial standards, rigorous experimental paradigms, and collegiate-level psychological research.',

  'Ronald Borja':
    'Professor and Associate Chair of Civil and Environmental Engineering at Stanford University, Dr. Ronald Borja is the author of the standard graduate textbook Plasticity Modeling & Computation and recipient of the prestigious Maurice A. Biot Medal. An internationally acknowledged leader in computational geomechanics and materials physics, Dr. Borja instructs students in the mathematical formulation and predictive simulation methods that underpin advanced engineering science.',

  'Philipp Koehn':
    'Professor of Computer Science at Johns Hopkins University affiliated with the Center for Language and Speech Processing, Dr. Philipp Koehn is an ACL Fellow (2024) and internationally celebrated pioneer of statistical machine translation. The creator of the foundational Europarl corpus and the Moses translation architecture used worldwide, Professor Koehn immerses students in the algorithmic frontiers of natural language processing, deep learning, and computational linguistics.',

  'Peter Pietzuch':
    'Professor of Distributed Systems in the Department of Computing at Imperial College London, Dr. Peter Pietzuch leads internationally recognized laboratories developing scalable, fault-tolerant software infrastructures spanning cloud, edge, and secure systems. Students mentored by Professor Pietzuch master the architectural principles, distributed consensus protocols, and systems performance engineering demanded by top technology leaders.',

  'Haifeng Xu':
    'Assistant Professor of Computer Science and Data Science at the University of Chicago, Dr. Haifeng Xu completed his postdoctoral fellowship at Harvard University after earning his Ph.D. from USC. A leading scholar at the nexus of algorithmic game theory, multi-agent systems, and information economics, Professor Xu trains students to design mathematical and machine learning models that govern economic interactions in AI-driven environments.',

  'Ryan Fang':
    'Associate Professor of Economics at the University of Chicago, Dr. Ryan Fang specializes in behavioral economics, strategic game theory, and microeconomic decision mechanisms. Known for connecting abstract economic principles with empirical market data, Professor Fang equips students with advanced quantitative frameworks and evidence-based economic modeling.',

  'Liam Francis Gearon':
    'Professor of Education and Senior Research Fellow at the University of Oxford, Dr. Liam Francis Gearon is an internationally acclaimed authority on educational philosophy, policy, and global civic development. With extensive experience advising national curricula and international educational bodies, Professor Gearon trains students in high-level qualitative analysis, philosophical defense, and academic paper formulation.',

  'Matthew Grimes':
    'Professor of Entrepreneurship and Sustainable Futures at the University of Cambridge Judge Business School, Dr. Matthew Grimes is an international authority on organizational leadership, social innovation, and sustainable enterprise development. Mentoring young scholars in rigorous qualitative and mixed-method inquiry, Professor Grimes guides students to evaluate how enterprise strategy can resolve complex societal challenges.',

  'Steven Fischer':
    'Acclaimed filmmaker, cartoonist, and Northwestern University faculty member, Steven Fischer is a multi-Emmy nominated creator whose documentary and animated productions have been broadcast internationally. Guiding students in cinematic story architecture, visual communication, and creative development, Professor Fischer teaches aspiring storytellers to craft compelling, festival-caliber narrative portfolios.',

  'Thomas Meade':
    'The Eileen M. Foell Professor of Chemistry, Molecular Biosciences, Neurobiology, and Biomedical Engineering at Northwestern University, Dr. Thomas Meade holds over 100 patents and has founded multiple biotechnology ventures. A world leader in bioinorganic chemistry and molecular MRI imaging probes, Professor Meade offers students direct immersion into translational biomedical innovation and medical biotechnology.',

  'Jan Van der Spiegel':
    'Professor of Electrical and Systems Engineering at the University of Pennsylvania, Dr. Jan Van der Spiegel is an IEEE Fellow and former Director of the Center for Sensor Technologies. A pioneer in biologically inspired neuromorphic sensors, mixed-signal VLSI systems, and brain-machine interfaces, Professor Van der Spiegel mentors students in cutting-edge circuit architecture and hardware-software co-design.',

  'Jens Hagendorff':
    'Professor of Finance and Head of the Department of Accounting & Financial Management at King\'s College London, Dr. Jens Hagendorff is a widely consulted advisor to global central banks, financial regulators, and institutional boards on bank systemic risk, corporate governance, and executive decision-making. Students working with Professor Hagendorff develop elite financial econometrics and policy-grade research papers.',

  'Jens Rittscher':
    'Professor of Engineering Science at the University of Oxford and Professorial Research Fellow at Harris Manchester College, Dr. Jens Rittscher is a global leader in biomedical imaging and computational pathology. Directing major clinical AI research collaborations, Professor Rittscher trains students to engineer computer vision and deep learning pipelines that unlock clinical insights from high-resolution medical imagery.',

  'Jiann-Wen Ju':
    'Distinguished Professor of Civil and Environmental Engineering at UCLA, Dr. Jiann-Wen Ju is an elected Fellow of ASME and ASCE and internationally respected authority on damage mechanics and computational nanocomposites. Students under Professor Ju\'s mentorship acquire rigorous computational modeling skills, learning to solve complex mechanics and materials engineering challenges through advanced mathematical frameworks.',

  'Helen Haste':
    'Emeritus Professor of Psychology at the University of Bath and Visiting Professor at the Harvard Graduate School of Education, Dr. Helen Haste is an internationally renowned developmental psychologist. An expert on moral development, civic understanding, and youth engagement, Professor Haste instructs students in foundational developmental paradigms, qualitative methodology, and rigorous behavioral inquiry.',

  'Gbenga Ibikunle':
    'Professor and Chair of Financial Markets at the University of Edinburgh and Director of FinTech at the Edinburgh Futures Institute, Dr. Gbenga Ibikunle is a premier authority on financial market microstructure and carbon trading mechanisms. Mentoring students in empirical financial econometrics and high-frequency trading data analysis, Professor Ibikunle prepares scholars for collegiate finance and public policy research.'
};

function generateBioForGeneralProfessor(name: string, title: string, uni: string, exp: string, major: string): string {
  // If custom VIP exists, use it
  if (VIP_BIOS[name]) return VIP_BIOS[name];

  const field = major || 'their specialized academic field';

  if (exp && exp.length > 25) {
    // Clean up raw exp
    let cleanExp = exp.replace(/\s+/g, ' ').trim();
    // Remove repetitive leading prefixes like "Assistant Professor at Westminster College."
    cleanExp = cleanExp.replace(new RegExp(`^${name}[,\\s]+`, 'i'), '');
    if (!cleanExp.endsWith('.')) cleanExp += '.';

    return `${title} at ${uni}, ${name} is an accomplished scholar at the forefront of ${field}. ${cleanExp} Under their dedicated mentorship, students master university-grade research methodologies, sharpen their critical analytical reasoning, and produce distinctive, publication-standard academic manuscripts that distinguish them in competitive university admissions.`;
  }

  return `${title} at ${uni}, ${name} directs foundational inquiry in ${field}. Renowned for fostering academic excellence and intellectual rigor, their mentorship empowers ambitious students to conduct original, publication-ready research and build compelling academic credentials evaluated highly by top admissions committees.`;
}

// Updated Parent-Centric Program Descriptions
const PROGRAM_UPDATES: Record<string, { description: string }> = {
  // 4 Winter Online Programs
  'cmttsjkvy0000eoptn4ppvad1': { // Biochemistry
    description: 'Directed by UCSF Professor and Chan Zuckerberg Biohub Investigator Dr. Jason Sello (former Harvard Fellow and NSF Award recipient), this intensive program immerses ambitious students in modern drug discovery. Scholars analyze complex biochemical mechanisms, evaluate molecular structures of therapeutic agents, and design novel antibiotic compounds to combat drug resistance—producing a publication-caliber research paper demonstrating mastery of collegiate pharmaceutical chemistry.'
  },
  'cmttsli5900008ks3u8tdt94v': { // Stem Cells / Genomics
    description: 'Under the mentorship of University of Oxford Professor Aziz Aboobaker (Dean of Lady Margaret Hall and Vice Chair of the Oxford Genomics Supervisory Committee), students explore the frontiers of stem cell regeneration and biological immortality. Utilizing authentic Oxford bioinformatics and functional genomics frameworks, scholars investigate cellular renewal, gene networks, and CRISPR gene-editing therapies—authoring an exceptional, peer-review-grade research thesis.'
  },
  'cmttso7iw00018ks3zz25skx0': { // Climate Geopolitics
    description: 'Guided by internationally acclaimed geopolitical realist Professor Sebastian Rosato (co-author with John Mearsheimer of How States Think and graduate of Cambridge, Oxford, and Chicago), this program analyzes how clean energy transition and critical mineral supply chains reshape superpower rivalry. Students master diplomatic strategic analysis and statecraft, formulating definitive, policy-grade research evaluated on Ivy League standards.'
  },
  'cmttspe8800028ks31sr4a4cr': { // Behavioral Economics
    description: 'Led by Emory Economics Professor David McMillon (former Harvard Fellow and University of Chicago Ph.D.), this program challenges orthodox economic assumptions through behavioral economics, cognitive bias, and nudge theory. Students analyze empirical datasets on consumer, healthcare, and educational choices—culminating in a rigorous, publication-ready research manuscript demonstrating superior quantitative and analytical command.'
  },

  // Notable Seoul Programs
  'cmn71d2fw00029nq8etgqdgrm': { // Caltech Chemistry
    description: 'Mentored by Caltech Professor of Chemistry and Feynman Prize Winner Dr. Brian Stoltz, this elite program covers advanced organic synthesis, chemical reaction mechanisms, and bioactive drug design. Students gain direct exposure to Caltech-caliber laboratory logic and chemical inquiry.'
  },
  'cmn71d2bw00009nq8x9wze8qt': { // Harvard Biology
    description: 'Directed by Harvard Professor of Molecular and Cellular Biology Dr. Samuel Kunes (Pew Scholar in Biomedical Sciences), this curriculum investigates neural circuitry, memory formation, and experimental design. Students develop hypothesis-driven reasoning and author a collegiate-style neurobiology paper.'
  },
  'cmn71d2q700099nq8f02evjeb': { // UPenn International Law
    description: 'Led by former Obama Administration State Department Advisor and UPenn Law Deputy Dean Professor William Burke-White (Harvard Law J.D., Cambridge Ph.D.), this program investigates international environmental diplomacy, global treaties, and Paris Climate Agreement compliance mechanisms.'
  },
  'cmn71d2ia00049nq8nvh10rbj': { // Columbia Applied Mathematics
    description: 'Taught by Columbia University Applied Mathematics faculty and NASA Goddard Institute Physical Research Scientist Dr. Anastasia Romanou, students harness advanced mathematical modeling and computational simulations to analyze large-scale climate and planetary datasets.'
  },
  'cmn71d2jg00059nq8jaizb399': { // Columbia Applied Physics
    description: 'Supervised by NASA Goddard Institute climate scientist Dr. Anastasia Romanou of Columbia University, scholars explore atmospheric thermodynamics, fluid mechanics, and quantitative climate physics using real NASA observation systems.'
  },
  'cmn71d2h200039nq8sji8j89y': { // UChicago CS
    description: 'Guided by UChicago Computer Science Assistant Professor Dr. Haifeng Xu (former Harvard Postdoctoral Fellow), this advanced course explores algorithmic game theory, multi-agent AI systems, and machine learning economics.'
  },
  'cmn71d2ls00079nq8g5wu71uy': { // UChicago Economy
    description: 'Mentored by University of Chicago Economics faculty, students analyze strategic microeconomic theory, game theory, and empirical market decision models.'
  },
  'cmn71d2sl000b9nq8hpcpenv8': { // Oxford Psychology
    description: 'Under Oxford Professor of Experimental Psychology and Admissions Tutor Dr. Robin Murphy, students study the neural and computational architecture of human cognition, causal reasoning, and behavioral psychopathology.'
  },
  'cmn71d2rd000a9nq8xims49pj': { // Oxford Education
    description: 'Directed by University of Oxford Professor of Education Dr. Liam Francis Gearon, students investigate comparative educational systems, international literacy development, and global education policy.'
  },
  'cmn71d2mx00089nq8coi4zjot': { // Cambridge Finance
    description: 'Led by University of Cambridge finance faculty, this course equips scholars with empirical asset pricing models, quantitative risk management, and market econometric forecasting.'
  }
};

async function main() {
  console.log('Loading CSV data...');
  const csvPath = '/Users/eunsolko/Downloads/Private & Shared/Professor Database 2debaac41f9881ebb9f4c81f62b26a15.csv';
  const workbook = xlsx.readFile(csvPath);
  const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

  const professors = await prisma.professor.findMany();
  console.log(`Found ${professors.length} professors in DB.`);

  let updatedProfCount = 0;

  for (const prof of professors) {
    const csvRow = rows.find(r => r['Professor Name']?.trim().toLowerCase() === prof.name.trim().toLowerCase());
    
    let title = prof.role || 'Professor';
    let uni = prof.university || 'Top University';
    let exp = '';
    let major = prof.relatedMajor || '';

    if (csvRow) {
      if (csvRow['Title']?.trim()) title = csvRow['Title'].trim();
      if (csvRow['University']?.trim()) uni = csvRow['University'].trim();
      if (csvRow['Work Experience']?.trim()) exp = csvRow['Work Experience'].trim();
      if (csvRow['Keywords'] || csvRow['Research Areas']) {
        major = (csvRow['Keywords'] || csvRow['Research Areas']).split(',')[0].trim();
      }
    }

    const marketingBio = generateBioForGeneralProfessor(prof.name, title, uni, exp, major);

    await prisma.professor.update({
      where: { id: prof.id },
      data: {
        bio: marketingBio,
        role: title,
        university: uni,
      }
    });

    updatedProfCount++;
  }

  console.log(`Updated marketing bios for ${updatedProfCount} professors!`);

  // Update Program Descriptions
  let updatedProgCount = 0;
  for (const [progId, update] of Object.entries(PROGRAM_UPDATES)) {
    try {
      await prisma.program.update({
        where: { id: progId },
        data: {
          description: update.description,
        }
      });
      updatedProgCount++;
      console.log(`Updated program: ${progId}`);
    } catch (e: any) {
      console.warn(`Could not update program ${progId}: ${e.message}`);
    }
  }

  console.log(`Successfully updated ${updatedProgCount} programs with compelling marketing copy!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
