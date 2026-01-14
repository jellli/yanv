import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  NavigationMenu,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { QueryNovelsCount } from "wailsjs/go/main/App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
        <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <NavigationMenu>
                  <NavigationMenuLink>
                    <Link
                      to="/"
                      search={{
                        page: 1,
                        pageSize: 10,
                        filter: {},
                      }}
                      className="flex gap-2 items-center"
                    >
                      书架
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink>
                    <Link
                      search={{
                        page: 1,
                        pageSize: 10,
                        filter: {
                          star_rating: [4, 5],
                        },
                      }}
                      to="/filter"
                      className="flex gap-2 items-center"
                    >
                      找书
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenu>
              </div>

              <Badge variant="secondary" className="text-xs">
                {count} 本
              </Badge>
            </div>
          </div>
        </header>
        <Outlet />
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
