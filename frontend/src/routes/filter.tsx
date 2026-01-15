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
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

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
    <div className="flex px-16 py-4 gap-8">
      {showFilter && (
        <div className="py-2 px-4 border-r">
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
        </div>
      )}

      <div className="flex-1">
        <div className="mb-2">
          <Button onClick={() => setShowFilter(!showFilter)} variant="outline">
            {showFilter ? (
              <>
                <PanelLeftClose />
                隐藏
              </>
            ) : (
              <>
                <PanelLeftOpen />
                显示
              </>
            )}
            筛选器
          </Button>
        </div>
        <NovelTable data={novels} />
        <div className="flex mt-4 items-center justify-between">
          <div className="flex items-center gap-2 text-sm shrink-0">
            <div>共找到 {count} 条记录</div>
            <Separator orientation="vertical" />
            <div>
              第 {search.page} / {Math.ceil(count / search.pageSize)} 页
            </div>
          </div>
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    navigate({
                      search: (prev) =>
                        produce(prev, (draft) => {
                          draft.page = Math.max(draft.page - 1, 1);
                        }),
                    })
                  }
                >
                  <ChevronLeft />
                </PaginationPrevious>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
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
                >
                  <ChevronRight />
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
