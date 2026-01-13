import { createFileRoute } from "@tanstack/react-router";
import { QueryNovels } from "../../wailsjs/go/main/App";
import { main, models } from "../../wailsjs/go/models";
import { produce } from "immer";

import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ChevronUp, SearchIcon, Star } from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
  const { novels } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [searchText, setSearchText] = useState(search.filter.title);

  const handleSearch = () => {
    navigate({
      search: (prev) =>
        produce(prev, (draft) => {
          draft.filter.title = searchText;
        }),
    });
  };
  return (
    <div className="p-3">
      <InputGroup>
        <InputGroupInput
          placeholder="搜索小说名称"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="secondary" onClick={handleSearch}>
            搜索
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <div className="flex w-full max-w-md flex-col gap-6">
        <ItemGroup className="flex flex-col gap-3 mt-3">
          {novels.map((novel, index) => (
            <React.Fragment key={novel.id}>
              <Item size="sm" key={novel.id}>
                <ItemContent>
                  <ItemTitle>
                    <div>
                      [{novel.category}]{novel.title}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium text-foreground">
                        {novel.star_rating}
                      </span>
                    </div>
                  </ItemTitle>
                  <div className="flex items-center gap-3">
                    <div>作者：{novel.author}</div>
                  </div>
                  <ItemDescription className="line-clamp-2">
                    {novel.short_intro}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <D novel={novel} />
                </ItemActions>
              </Item>
              {index !== novels.length - 1 && <ItemSeparator />}
            </React.Fragment>
          ))}
        </ItemGroup>
      </div>
    </div>
  );
}

const D = ({ novel }: { novel: models.Novel }) => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" className="cursor-pointer">
          <ChevronUp />
        </Button>
      </DrawerTrigger>
      <DrawerOverlay className="fixed inset-0 bg-black/40" />
      <DrawerPortal>
        <DrawerContent className="h-[80%]">
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-1">
              {Array.from({ length: novel.star_rating }).map((_, index) => (
                <Star
                  key={index}
                  className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500"
                />
              ))}
            </div>
            <DrawerTitle className="text-xl mt-2 font-medium text-gray-900 text-left">
              {novel.title}
            </DrawerTitle>
            <dl className="flex flex-wrap gap-2 text-sm mt-1">
              <dt className="text-gray-500">分类</dt>
              <dd>{novel.category}</dd>
              <dt className="text-gray-500">作者</dt>
              <dd>{novel.author}</dd>
            </dl>
          </DrawerHeader>
          <DrawerDescription className="text-left whitespace-pre-wrap mt-2 overflow-y-auto p-4">
            {novel.summary}
          </DrawerDescription>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};
