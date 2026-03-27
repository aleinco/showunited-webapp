export const routes = {
  dashboard: '/dashboard',
  users: {
    individual: '/users/individual',
    company: '/users/company',
  },
  taxonomy: {
    individual: {
      categories: '/taxonomy/individual/categories',
      subcategories: '/taxonomy/individual/subcategories',
      subcategories1: '/taxonomy/individual/subcategories1',
      vocalCategories: '/taxonomy/individual/vocal-categories',
      hairColors: '/taxonomy/individual/hair-colors',
    },
    company: {
      categories: '/taxonomy/company/categories',
      subcategories: '/taxonomy/company/subcategories',
      subcategories1: '/taxonomy/company/subcategories1',
      vocalCategories: '/taxonomy/company/vocal-categories',
      industryTypes: '/taxonomy/company/industry-types',
      industrySubtypes: '/taxonomy/company/industry-subtypes',
      skills: '/taxonomy/company/skills',
      duration: '/taxonomy/company/duration',
    },
  },
  content: {
    pages: '/content/pages',
    faqs: '/content/faqs',
  },
  subscriptions: {
    plans: '/subscriptions/plans',
    userSubscriptions: '/subscriptions/user-subscriptions',
  },
  social: {
    favorites: '/social/favorites',
    disputes: '/social/disputes',
  },
  geographic: {
    countries: '/geographic/countries',
    cities: '/geographic/cities',
    areas: '/geographic/areas',
  },
  signIn: '/signin',
};
