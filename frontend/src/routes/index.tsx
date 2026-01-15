import { createFileRoute, Link } from "@tanstack/react-router";
import { QueryNovels } from "wailsjs/go/main/App";
import { main } from "wailsjs/go/models";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

interface NovelSearch {
  page: number;
  pageSize: number;
  filter: main.NovelQuery;
}

export const Route = createFileRoute("/")({
  component: App,
  validateSearch: (search: Record<string, unknown>): NovelSearch => ({
    page: Number(search.offset) || 0,
    pageSize: Number(search.limit) || 10,
    filter: main.NovelQuery.createFrom(search.filter),
  }),
  loaderDeps: ({ search: { page, pageSize, filter } }) => ({
    page,
    pageSize,
    filter,
  }),
  loader: async ({ deps: { page, pageSize, filter } }) => {
    const novels = await QueryNovels(filter, page, pageSize);
    return { novels };
  },
});

function App() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>🚧</EmptyTitle>
        <EmptyDescription>这个页面还在开发中...</EmptyDescription>
        <Button asChild>
          <Link
            to="/filter"
            search={{
              filter: {},
              page: 1,
              pageSize: 10,
            }}
          >
            去找书
          </Link>
        </Button>
      </EmptyHeader>
    </Empty>
  );
}
