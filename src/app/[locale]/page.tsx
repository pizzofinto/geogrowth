import Link from 'next/link';
import Image from 'next/image';
import { UserAuthForm } from '@/components/auth/user-auth-form';
import { LanguageSwitcher } from '@/components/language-switcher';
import { getTranslations } from 'next-intl/server';
import { AuthProvider } from '@/contexts/AuthContext';

// A simple SVG icon for the logo
const GeoGrowthLogo = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );

interface LoginPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  
  // Ottieni le traduzioni per il server component
  const t = await getTranslations('auth');
  const tCommon = await getTranslations('common');

  return (
    <AuthProvider>
      <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
        <div className="relative flex items-center justify-center py-12">
          <div className="absolute left-8 top-8">
              <Link href={`/${locale}`} className="flex items-center gap-2 text-lg font-semibold">
                  <GeoGrowthLogo />
                  <span>{tCommon('companyName')}</span>
              </Link>
          </div>

          <div className="absolute right-8 top-8">
            <LanguageSwitcher size="icon" variant="ghost" showText={false} />
          </div>

          <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center">
              <h1 className="text-3xl font-bold">{tCommon('login')}</h1>
              <p className="text-balance text-muted-foreground">
                {t('loginSubtitle')}
              </p>
            </div>
            
            <UserAuthForm />

            <div className="mt-4 text-center text-sm">
              {t('needAccess')}{' '}
              <Link href={`/${locale}/request-invitation`} className="underline">
                {t('requestInvitation')}
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden bg-muted lg:block">
          <Image
            src="https://placehold.co/1920x1080"
            alt="GeoGrowth presentation image"
            width={1920}
            height={1080}
            className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    </AuthProvider>
  );
}