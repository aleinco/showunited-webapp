import { Metadata } from 'next';
import { LAYOUT_OPTIONS } from '@/config/enums';
import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types';

enum MODE {
  DARK = 'dark',
  LIGHT = 'light',
}

export const siteConfig = {
  title: 'Show United Admin Dashboard',
  description: 'Administration panel for Show United - Professional entertainment social network',
  logo: null,
  icon: null,
  mode: MODE.LIGHT,
  layout: LAYOUT_OPTIONS.HYDROGEN,
};

export const metaObject = (
  title?: string,
  openGraph?: OpenGraph,
  description: string = siteConfig.description
): Metadata => {
  return {
    title: title ? `${title} - Show United Admin` : siteConfig.title,
    description,
    openGraph: openGraph ?? {
      title: title ? `${title} - Show United Admin` : title,
      description,
      locale: 'en_US',
      type: 'website',
    },
  };
};
