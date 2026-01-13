import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  NavigationMenu,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Link } from "@tanstack/react-router";
import { Book, Filter, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QueryNovelsCount } from "../../wailsjs/go/main/App";

export const Route = createRootRoute({
  loader: async () => {
    const count = await QueryNovelsCount();
    return { count };
  },
  component: () => {
    const { count } = Route.useLoaderData();

    return (
      <>
        <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-1 mb-2">
                  <Book />
                  小宝书库
                </h1>
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
                      <Home />
                      首页
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink>
                    <Link to="/filter" className="flex gap-2 items-center">
                      <Filter />
                      筛选器
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
      </>
    );
  },
});
