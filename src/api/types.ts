export interface CommonResponse<T = any> {
  responseCode: 'success' | 'error' | 'warning' | 'danger' | 'info';
  responseMessage: string;
  responseData: T;
}

export interface PagingData {
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
}

export interface CommonResponsePaging<T = any> extends CommonResponse<T> {
  responsePagingData: PagingData;
}

export interface ListParams {
  PageNumber: number;
  SearchText?: string;
  [key: string]: any;
}

export interface DeleteParams {
  Type: string;
  TypeId: number;
  Reason?: string;
}

export interface DashboardChartData {
  date: string;
  totalCount: number;
  successCount: number;
  errorCount: number;
}

export interface FrequentProduct {
  pipcode: string;
  productName: string;
  count: number;
}

export interface RevenueData {
  revenueMonth: string;
  totalRevenue: number;
  revenueProfit: number;
}

export interface DashboardData {
  dashboardChartDatas: DashboardChartData[];
  frequentProductList: FrequentProduct[];
  dashboardRevenueDatas: RevenueData[];
}

export interface AdminUser {
  id: number;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  statusId: number;
  createdDate: string;
  [key: string]: any;
}

export interface TaxonomyItem {
  id: number;
  name: string;
  sequenceNumber?: number;
  statusId?: number;
  [key: string]: any;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  userType: string;
  duration: string;
  price: number;
  currency: string;
  statusId: number;
  [key: string]: any;
}

export interface UserSubscription {
  id: number;
  userId: number;
  userName: string;
  planName: string;
  price: number;
  startDate: string;
  expiryDate: string;
  [key: string]: any;
}

export interface UserDispute {
  id: number;
  reporterName: string;
  reportedUserName: string;
  title: string;
  description: string;
  statusId: number;
  resolutionReason?: string;
  [key: string]: any;
}

export interface AdminEndpointConfig {
  controller: string;
  getAction: string;
  deleteType: string;
  title: string;
  searchPlaceholder: string;
}

export const ADMIN_ENDPOINTS: Record<string, AdminEndpointConfig> = {
  'individual-categories': {
    controller: 'IndividualCategory',
    getAction: 'GetIndividualCategoryData',
    deleteType: 'IndividualCategory',
    title: 'Individual Categories',
    searchPlaceholder: 'Search categories...',
  },
  'individual-subcategories': {
    controller: 'IndividualSubCategory',
    getAction: 'GetIndividualSubCategoryData',
    deleteType: 'IndividualSubCategory',
    title: 'Individual SubCategories',
    searchPlaceholder: 'Search subcategories...',
  },
  'individual-subcategories1': {
    controller: 'IndividualSubCategory1',
    getAction: 'GetIndividualSubCategory1Data',
    deleteType: 'IndividualSubCategory1',
    title: 'Individual SubCategories L2',
    searchPlaceholder: 'Search subcategories...',
  },
  'individual-vocal-categories': {
    controller: 'IndividualVocalCategory',
    getAction: 'GetIndividualVocalCategoryData',
    deleteType: 'IndividualVocalCategory',
    title: 'Individual Vocal Categories',
    searchPlaceholder: 'Search vocal categories...',
  },
  'individual-hair-colors': {
    controller: 'HairColor',
    getAction: 'GetHairColorData',
    deleteType: 'HairColor',
    title: 'Hair Colors',
    searchPlaceholder: 'Search hair colors...',
  },
  'company-categories': {
    controller: 'CompanyCategory',
    getAction: 'GetCompanyCategoryData',
    deleteType: 'CompanyCategory',
    title: 'Company Categories',
    searchPlaceholder: 'Search categories...',
  },
  'company-subcategories': {
    controller: 'CompanySubCategory',
    getAction: 'GetCompanySubCategoryData',
    deleteType: 'CompanySubCategory',
    title: 'Company SubCategories',
    searchPlaceholder: 'Search subcategories...',
  },
  'company-subcategories1': {
    controller: 'CompanySubCategory1',
    getAction: 'GetCompanySubCategory1Data',
    deleteType: 'CompanySubCategory1',
    title: 'Company SubCategories L2',
    searchPlaceholder: 'Search subcategories...',
  },
  'company-vocal-categories': {
    controller: 'CompanyVocalCategory',
    getAction: 'GetCompanyVocalCategoryData',
    deleteType: 'CompanyVocalCategory',
    title: 'Company Vocal Categories',
    searchPlaceholder: 'Search vocal categories...',
  },
  'company-industry-types': {
    controller: 'IndustryType',
    getAction: 'GetIndustryTypeData',
    deleteType: 'IndustryType',
    title: 'Industry Types',
    searchPlaceholder: 'Search industry types...',
  },
  'company-industry-subtypes': {
    controller: 'IndustrySubType',
    getAction: 'GetIndustrySubTypeData',
    deleteType: 'IndustrySubType',
    title: 'Industry SubTypes',
    searchPlaceholder: 'Search industry subtypes...',
  },
  'company-skills': {
    controller: 'Skill',
    getAction: 'GetSkillData',
    deleteType: 'Skill',
    title: 'Skills',
    searchPlaceholder: 'Search skills...',
  },
  'company-duration': {
    controller: 'Duration',
    getAction: 'GetDurationData',
    deleteType: 'Duration',
    title: 'Duration',
    searchPlaceholder: 'Search duration...',
  },
  'individual-users': {
    controller: 'IndividualUser',
    getAction: 'GetIndividualUserData',
    deleteType: 'IndividualUser',
    title: 'Individual Users',
    searchPlaceholder: 'Search users...',
  },
  'company-users': {
    controller: 'CompanyUser',
    getAction: 'GetCompanyUserData',
    deleteType: 'CompanyUser',
    title: 'Company Users',
    searchPlaceholder: 'Search companies...',
  },
  'subscription-plans': {
    controller: 'SubscriptionPlan',
    getAction: 'GetSubscriptionPlanData',
    deleteType: 'SubscriptionPlan',
    title: 'Subscription Plans',
    searchPlaceholder: 'Search plans...',
  },
  'user-subscriptions': {
    controller: 'UserSubscription',
    getAction: 'GetUserSubscriptionData',
    deleteType: 'UserSubscription',
    title: 'User Subscriptions',
    searchPlaceholder: 'Search subscriptions...',
  },
  pages: {
    controller: 'Page',
    getAction: 'GetPageData',
    deleteType: 'Page',
    title: 'Pages',
    searchPlaceholder: 'Search pages...',
  },
  faqs: {
    controller: 'FAQ',
    getAction: 'GetFAQData',
    deleteType: 'FAQ',
    title: 'FAQs',
    searchPlaceholder: 'Search FAQs...',
  },
  'user-favorites': {
    controller: 'UserFavorite',
    getAction: 'GetUserFavoriteData',
    deleteType: 'UserFavorite',
    title: 'User Favorites',
    searchPlaceholder: 'Search favorites...',
  },
  'user-disputes': {
    controller: 'UserDispute',
    getAction: 'GetUserDisputeData',
    deleteType: 'UserDispute',
    title: 'User Disputes',
    searchPlaceholder: 'Search disputes...',
  },
  countries: {
    controller: 'Country',
    getAction: 'GetCountryData',
    deleteType: 'Country',
    title: 'Countries',
    searchPlaceholder: 'Search countries...',
  },
  cities: {
    controller: 'City',
    getAction: 'GetCityData',
    deleteType: 'City',
    title: 'Cities',
    searchPlaceholder: 'Search cities...',
  },
  areas: {
    controller: 'Area',
    getAction: 'GetAreaData',
    deleteType: 'Area',
    title: 'Areas',
    searchPlaceholder: 'Search areas...',
  },
};
