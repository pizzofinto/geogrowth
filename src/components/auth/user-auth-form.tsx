'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement>;

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estrae la locale corrente dal percorso per i link dinamici
  const currentLocale = pathname.split('/')[1] || 'en';

  // Hook per le traduzioni con next-intl
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');
  const tErrors = useTranslations('errors');

  // Schema di validazione per il form di login con traduzioni
  const formSchema = z.object({
    email: z.string().email({
      message: tValidation('email'),
    }),
    password: z.string().min(1, {
      message: tValidation('required'),
    }),
  });

  // Inizializzazione del form con react-hook-form e Zod
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * Gestisce l'invio del form di login.
   * Esegue l'autenticazione, recupera i dati utente e reindirizza
   * alla dashboard appropriata usando il router di Next.js.
   */
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Esegui il login con Supabase
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

      if (signInError) {
        console.error('❌ Login Error:', signInError);
        setError(tAuth('invalidCredentials'));
        setIsLoading(false);
        return;
      }

      if (!signInData.user) {
        // Controllo di sicurezza nel caso in cui l'utente non venga restituito
        setError(tAuth('loginError'));
        setIsLoading(false);
        return;
      }

      // 2. Recupera profilo e ruoli in parallelo per maggiore efficienza
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('users')
          .select('preferred_language')
          .eq('id', signInData.user.id)
          .single(),
        supabase
          .from('user_role_assignments')
          .select('user_roles(role_name)')
          .eq('user_id', signInData.user.id)
      ]);

      const { data: profile, error: profileError } = profileResult;
      const { data: roleData, error: roleError } = rolesResult;

      if (profileError) {
        console.warn('⚠️ Could not fetch user profile:', profileError.message);
      }
      if (roleError) {
        console.warn('⚠️ Could not fetch user roles:', roleError.message);
      }

      // 3. Determina la lingua e la destinazione finale
      let preferredLanguage = 'en'; // Lingua di default
      if (profile?.preferred_language && ['en', 'it'].includes(profile.preferred_language)) {
        preferredLanguage = profile.preferred_language;
      }

      // Extract roles safely following the same pattern as AuthContext
      const roles: string[] = [];
      if (roleData && Array.isArray(roleData)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        roleData.forEach((item: any) => {
          if (item?.user_roles?.role_name) {
            roles.push(item.user_roles.role_name);
          }
        });
      }
        
      let destination = '/dashboard'; // Destinazione di default
      if (roles.includes('Super User')) {
        destination = '/admin';
      }

      // 4. Reindirizza usando router.push, il metodo corretto in Next.js
      const finalUrl = `/${preferredLanguage}${destination}`;
      console.log(`🚀 Redirecting to: ${finalUrl}`);
      
      router.push(finalUrl);

    } catch (error) {
      console.error('❌ An unexpected error occurred during login:', error);
      setError(tErrors('generic'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>{tCommon('email')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={tAuth('emailPlaceholder')}
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <div className="flex items-center">
                  <FormLabel>{tCommon('password')}</FormLabel>
                  <Link
                    href={`/${currentLocale}/forgot-password`}
                    className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-primary transition-colors"
                  >
                    {tAuth('forgotPassword')}
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      disabled={isLoading}
                      className="pr-10"
                      placeholder={tAuth('passwordPlaceholder')}
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      tabIndex={-1}
                      aria-label={showPassword ? tAuth('hidePassword') : tAuth('showPassword')}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showPassword ? tAuth('hidePassword') : tAuth('showPassword')}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tAuth('loggingIn')}
              </>
            ) : (
              tAuth('loginButton')
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}