import NextProgress from '@/components/core/next-progress';
import { ThemeProvider } from './theme-provider';
import { JotaiProvider } from './jotai-provider';
import { DrawerViews } from '@/drawer-views';
import { ModalViews } from '@/modal-views';

export function Providers({
  children,
  defaultTheme,
}: React.PropsWithChildren<{
  defaultTheme: string;
}>) {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <NextProgress />
      <JotaiProvider>
        {children}
        <DrawerViews />
        <ModalViews />
      </JotaiProvider>
    </ThemeProvider>
  );
}
