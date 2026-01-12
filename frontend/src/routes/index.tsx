import { createFileRoute } from "@tanstack/react-router";
import { QueryNovels } from "../../wailsjs/go/main/App";
import { main } from "../../wailsjs/go/models";

import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";

interface NovelSearch {
  offset: number;
  limit: number;
  filter: main.NovelQuery;
}

export const Route = createFileRoute("/")({
  component: App,
  validateSearch: (search: Record<string, unknown>): NovelSearch => ({
    offset: Number(search.offset) || 0,
    limit: Number(search.limit) || 10,
    filter: main.NovelQuery.createFrom(search.filter),
  }),
  loaderDeps: ({ search: { offset, limit, filter } }) => ({
    offset,
    limit,
    filter,
  }),
  loader: async ({ deps: { offset, limit, filter } }) => {
    console.log({ offset, limit, filter });
    const novels = await QueryNovels(filter, offset, limit);
    return { novels };
  },
});

function App() {
  const { novels } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [searchText, setSearchText] = useState(search.filter.Title);

  return (
    <div>
      <InputGroup>
        <InputGroupInput
          placeholder="Search..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
          }}
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            variant="secondary"
            onClick={() => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  filter: {
                    ...prev.filter,
                    Title: searchText,
                  },
                }),
              });
            }}
          >
            Search
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <ul>
        {novels.map((novel) => (
          <li key={novel.id}>{novel.title}</li>
        ))}
      </ul>
    </div>
  );
}
