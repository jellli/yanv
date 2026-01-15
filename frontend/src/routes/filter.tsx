import { createFileRoute } from "@tanstack/react-router";
import NovelTable from "@/components/table";
import { QueryNovels } from "wailsjs/go/main/App";
import { main } from "wailsjs/go/models";
import NovelFilter from "@/components/novel-filter";
import { produce } from "immer";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/filter")({
  component: RouteComponent,
  validateSearch: (search) => {
    return {
      page: Number(search.page ?? 1),
      pageSize: Number(search.pageSize ?? 10),
      filter: main.NovelQuery.createFrom(search.filter),
    };
  },
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    filter: main.NovelQuery.createFrom(search.filter),
  }),
  loader: async ({ deps: { page, pageSize, filter } }) => {
    console.log(filter);
    const result = await QueryNovels(filter, page, pageSize);
    return {
      ...result,
    };
  },
});

function RouteComponent() {
  const { novels, count } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [showFilter, setShowFilter] = useState(true);
  return (
    <div className="container mx-auto py-8">
      <div className="flex gap-8 items-start">
        {showFilter && (
          <aside className="w-64 shrink-0">
            <div className="mb-3">
              <h2 className="font-bold tracking-tight">筛选条件</h2>
              <p className="text-sm text-muted-foreground mt-1">
                根据条件查找小说
              </p>
            </div>
            <NovelFilter
              onChange={(v) =>
                navigate({
                  search: (prev) =>
                    produce(prev, (draft) => {
                      draft.filter = v;
                      draft.page = 1;
                    }),
                })
              }
            />
          </aside>
        )}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowFilter(!showFilter)}
                variant="outline"
                size="sm"
                className="-ml-2 h-8 text-muted-foreground hover:text-foreground"
              >
                {showFilter ? (
                  <PanelLeftClose className="mr-2 h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="mr-2 h-4 w-4" />
                )}
                {showFilter ? "隐藏筛选" : "显示筛选"}
              </Button>
              <div className="text-xs text-muted-foreground">
                共筛选出
                <span className="font-medium text-foreground mx-1 inline-block">
                  {count}
                </span>
                项
              </div>
            </div>
          </div>

          <div className="bg-background rounded-lg ">
            <NovelTable data={novels} />
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                当前第{" "}
                <span className="font-medium text-foreground">
                  {search.page}
                </span>{" "}
                页，共{" "}
                <span className="font-medium text-foreground">
                  {Math.max(1, Math.ceil(count / search.pageSize))}
                </span>{" "}
                页
              </div>
              <Pagination className="justify-end w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({
                          search: (prev) =>
                            produce(prev, (draft) => {
                              draft.page = Math.max(draft.page - 1, 1);
                            }),
                        })
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({
                          search: (prev) =>
                            produce(prev, (draft) => {
                              draft.page = Math.min(
                                draft.page + 1,
                                Math.ceil(count / draft.pageSize),
                              );
                            }),
                        })
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
