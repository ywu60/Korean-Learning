/** Central route builders so links stay consistent. */
export const paths = {
  home: '/',
  journeys: '/journeys',
  journey: (slug: string) => `/journeys/${slug}`,
  module: (slug: string) => `/modules/${slug}`,
  review: '/review',
  progress: '/progress',
  settings: '/settings',
};

export const learnPath = (moduleId: string, sectionId: string, stepId?: string) =>
  stepId ? `/learn/${moduleId}/${sectionId}/${stepId}` : `/learn/${moduleId}/${sectionId}`;

export const printPath = (moduleId: string, sectionId: string) => `/print/${moduleId}/${sectionId}`;
