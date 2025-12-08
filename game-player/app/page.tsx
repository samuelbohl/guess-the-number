import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, User, Bot } from 'lucide-react';
import { redirect } from 'next/navigation';
import { isActiveToken } from '@/lib/utils';
import { headers } from 'next/headers';

export default async function Home() {
  const headerList = await headers();
  const token = headerList.get('x-ms-token-aad-id-token');
  if (!token) {
    throw new Error("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
  }
  if (!isActiveToken(token)) {
    const loginUrl = `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(`/`)}`;
    redirect(loginUrl);
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Target className="h-10 w-10 text-primary md:h-12 md:w-12" />
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
                Guess the Number
              </h1>
            </div>
            <p className="text-pretty text-base text-muted-foreground md:text-xl">
              Choose your game mode and start guessing numbers between 1 and 10,000
            </p>
          </div>

          {/* Game Modes */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="transition-all hover:border-primary hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Manual Mode</CardTitle>
                <CardDescription className="text-base">Play the game yourself</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/manual">
                  <Button size="lg" className="w-full">
                    Play Manual
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="transition-all hover:border-primary hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                  <Bot className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-2xl">Bot Mode</CardTitle>
                <CardDescription className="text-base">Watch different algorithms compete</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/bot">
                  <Button size="lg" className="w-full bg-accent hover:bg-accent/90">
                    Watch Bots
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
