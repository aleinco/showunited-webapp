import { routes } from '@/config/routes';
import {
  PiChartBarDuotone,
  PiUsersDuotone,
  PiUserDuotone,
  PiBriefcaseDuotone,
  PiTagDuotone,
  PiFileTextDuotone,
  PiCreditCardDuotone,
  PiHeartDuotone,
  PiGlobeDuotone,
  PiMusicNotesDuotone,
  PiScissorsDuotone,
  PiTreeStructureDuotone,
  PiBuildingsDuotone,
  PiWrenchDuotone,
  PiTimerDuotone,
  PiQuestionDuotone,
  PiNewspaperClippingDuotone,
  PiStarDuotone,
  PiChatCircleTextDuotone,
  PiMapPinDuotone,
  PiFlagDuotone,
  PiHouseDuotone,
} from 'react-icons/pi';

export const menuItems = [
  {
    name: 'Overview',
  },
  {
    name: 'Dashboard',
    href: routes.dashboard,
    icon: <PiChartBarDuotone />,
  },

  {
    name: 'User Management',
  },
  {
    name: 'Users',
    href: '#',
    icon: <PiUsersDuotone />,
    dropdownItems: [
      {
        name: 'Individual Users',
        href: routes.users.individual,
      },
      {
        name: 'Company Users',
        href: routes.users.company,
      },
    ],
  },

  {
    name: 'Taxonomies',
  },
  {
    name: 'Individual',
    href: '#',
    icon: <PiUserDuotone />,
    dropdownItems: [
      {
        name: 'Categories',
        href: routes.taxonomy.individual.categories,
      },
      {
        name: 'SubCategories',
        href: routes.taxonomy.individual.subcategories,
      },
      {
        name: 'SubCategories L2',
        href: routes.taxonomy.individual.subcategories1,
      },
      {
        name: 'Vocal Categories',
        href: routes.taxonomy.individual.vocalCategories,
      },
      {
        name: 'Hair Colors',
        href: routes.taxonomy.individual.hairColors,
      },
    ],
  },
  {
    name: 'Company',
    href: '#',
    icon: <PiBriefcaseDuotone />,
    dropdownItems: [
      {
        name: 'Categories',
        href: routes.taxonomy.company.categories,
      },
      {
        name: 'SubCategories',
        href: routes.taxonomy.company.subcategories,
      },
      {
        name: 'SubCategories L2',
        href: routes.taxonomy.company.subcategories1,
      },
      {
        name: 'Vocal Categories',
        href: routes.taxonomy.company.vocalCategories,
      },
      {
        name: 'Industry Types',
        href: routes.taxonomy.company.industryTypes,
      },
      {
        name: 'Industry SubTypes',
        href: routes.taxonomy.company.industrySubtypes,
      },
      {
        name: 'Skills',
        href: routes.taxonomy.company.skills,
      },
      {
        name: 'Duration',
        href: routes.taxonomy.company.duration,
      },
    ],
  },

  {
    name: 'Content',
  },
  {
    name: 'Pages',
    href: routes.content.pages,
    icon: <PiNewspaperClippingDuotone />,
  },
  {
    name: 'FAQs',
    href: routes.content.faqs,
    icon: <PiQuestionDuotone />,
  },

  {
    name: 'Subscriptions',
  },
  {
    name: 'Plans',
    href: routes.subscriptions.plans,
    icon: <PiCreditCardDuotone />,
  },
  {
    name: 'User Subscriptions',
    href: routes.subscriptions.userSubscriptions,
    icon: <PiStarDuotone />,
  },

  {
    name: 'Social & Support',
  },
  {
    name: 'User Favorites',
    href: routes.social.favorites,
    icon: <PiHeartDuotone />,
  },
  {
    name: 'User Disputes',
    href: routes.social.disputes,
    icon: <PiChatCircleTextDuotone />,
  },

  {
    name: 'Geographic',
  },
  {
    name: 'Countries',
    href: routes.geographic.countries,
    icon: <PiGlobeDuotone />,
  },
  {
    name: 'Cities',
    href: routes.geographic.cities,
    icon: <PiMapPinDuotone />,
  },
  {
    name: 'Areas',
    href: routes.geographic.areas,
    icon: <PiHouseDuotone />,
  },
];
