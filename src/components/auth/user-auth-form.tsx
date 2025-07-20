'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
import { supabase } from '@/lib/supabaseClient';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password cannot be empty.',
  }),
});

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // 1. Esegui il login
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

    if (signInError) {
      alert('Login Error: ' + signInError.message);
      return; // Interrompi se il login fallisce
    }

    if (signInData.user) {
    // 2. Se il login ha successo, recupera i ruoli dell'utente
      const { data: roleData, error: roleError } = await supabase
        .from('user_role_assignments')
        .select('user_roles(role_name)')
        .eq('user_id', signInData.user.id);

      if (roleError) {
        console.error('Error fetching user roles:', roleError);
        // In caso di errore nel recupero dei ruoli, reindirizza a una dashboard generica
        router.push('/dashboard');
        return;
      }

      // ✅ CORREZIONE: Aggiungi type assertion
      const roles = roleData
        .map((item: any) => item.user_roles?.role_name)
        .filter(Boolean);

      // 3. Reindirizza in base al ruolo
      if (roles.includes('Super User')) {
        router.push('/admin');
      } else {
        router.push('/dashboard'); // ← Anche questa modifica che avevamo discusso prima
      }
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    type="email"
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
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </Form>
    </div>
  );
}