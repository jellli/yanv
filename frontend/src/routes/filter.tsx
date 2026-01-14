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
  PaginationLink,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    const novels = await QueryNovels(filter, page, pageSize);
    return {
      novels,
    };
  },
});

function RouteComponent() {
  const { novels } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const [showFilter, setShowFilter] = useState(true);
  return (
    <div className="flex py-4 px-4 gap-8">
      {showFilter && (
        <div className="w-[200px]">
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
        <Button onClick={() => setShowFilter(!showFilter)}>
          {showFilter ? "隐藏" : "显示"}筛选器
        </Button>
        <NovelTable data={novels} />
        <Pagination className="ml-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
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
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                onClick={() =>
                  navigate({
                    search: (prev) =>
                      produce(prev, (draft) => {
                        draft.page = draft.page + 1;
                      }),
                  })
                }
              >
                <ChevronRight />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
