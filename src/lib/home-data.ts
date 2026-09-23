export type MentorUniversity = { name: string; logo: string | null; height?: number };

/**
 * Fixed set shown in the home "Mentors teach at" strip. Wordmark images are the universities' own
 * logos as hosted on Wikimedia Commons (rasterised thumbnails); each has a text fallback if the
 * image fails to load. Edit this list to change the strip; the professor inventory is not consulted.
 */
export const FEATURED_UNIVERSITIES: MentorUniversity[] = [
  { name: "Harvard University", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_logo.svg/500px-Harvard_University_logo.svg.png", height: 34 },
  { name: "MIT", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/MIT_logo_2003-2023.svg/500px-MIT_logo_2003-2023.svg.png", height: 30 },
  { name: "Princeton University", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Princeton_text_logo.svg/500px-Princeton_text_logo.svg.png", height: 30 },
  { name: "Yale University", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Yale_University_logo.svg/500px-Yale_University_logo.svg.png", height: 30 },
  { name: "UC Berkeley", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/University_of_California%2C_Berkeley_logo.svg/500px-University_of_California%2C_Berkeley_logo.svg.png", height: 34 },
  { name: "University of Chicago", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/University_of_Chicago_wordmark.svg/500px-University_of_Chicago_wordmark.svg.png", height: 30 },
];
