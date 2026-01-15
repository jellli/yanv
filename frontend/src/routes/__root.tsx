import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { QueryNovelsCount } from "wailsjs/go/main/App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();
export const Route = createRootRoute({
  loader: async () => {
    const count = await QueryNovelsCount();
    return { count };
  },
  component: () => {
    const { count } = Route.useLoaderData();

    return (
      <QueryClientProvider client={queryClient}>
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-8">
              <Link
                to="/"
                search={{
                  filter: {},
                  page: 1,
                  pageSize: 10,
                }}
                className="flex items-center gap-2 transition-opacity hover:opacity-80"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                  🐷
                </div>
                <span className="hidden text-xl font-bold tracking-tight sm:inline-block">
                  小猪读书
                </span>
              </Link>

              <NavigationMenu>
                <NavigationMenuList className="gap-1">
                  <NavigationMenuItem>
                    <Link
                      to="/"
                      search={{
                        page: 1,
                        pageSize: 10,
                        filter: {},
                      }}
                      className={navigationMenuTriggerStyle()}
                      activeProps={{
                        className:
                          "bg-accent text-accent-foreground font-semibold shadow-sm",
                      }}
                    >
                      书架
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      to="/filter"
                      search={{
                        page: 1,
                        pageSize: 10,
                        filter: {
                          star_rating: [4, 5],
                        },
                      }}
                      className={navigationMenuTriggerStyle()}
                      activeProps={{
                        className:
                          "bg-accent text-accent-foreground font-semibold shadow-sm",
                      }}
                    >
                      找书
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 bg-background px-3 py-1 font-mono text-xs shadow-sm"
              >
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-muted-foreground mr-0.5">库存:</span>
                <span className="font-bold">{count}</span>
              </Badge>
            </div>
          </div>
        </header>
        <Outlet />
        <Toaster position="top-right" />
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      </QueryClientProvider>
    );
  },
});
