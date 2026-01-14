import { createFileRoute } from "@tanstack/react-router";
import { QueryNovels } from "wailsjs/go/main/App";
import { main } from "wailsjs/go/models";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

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
      </EmptyHeader>
    </Empty>
  );
}

// const _D = ({ novel }: { novel: models.Novel }) => {
//   return (
//     <Drawer>
//       <DrawerTrigger asChild>
//         <Button variant="ghost" className="cursor-pointer">
//           <ChevronUp />
//         </Button>
//       </DrawerTrigger>
//       <DrawerOverlay className="fixed inset-0 bg-black/40" />
//       <DrawerPortal>
//         <DrawerContent className="h-[80%]">
//           <DrawerHeader className="text-left">
//             <div className="flex items-center gap-1">
//               {Array.from({ length: novel.star_rating }).map((_, index) => (
//                 <Star
//                   key={index}
//                   className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500"
//                 />
//               ))}
//             </div>
//             <DrawerTitle className="text-xl mt-2 font-medium text-gray-900 text-left">
//               {novel.title}
//             </DrawerTitle>
//             <dl className="flex flex-wrap gap-2 text-sm mt-1">
//               <dt className="text-gray-500">分类</dt>
//               <dd>{novel.category}</dd>
//               <dt className="text-gray-500">作者</dt>
//               <dd>{novel.author}</dd>
//             </dl>
//           </DrawerHeader>
//           <DrawerDescription className="text-left whitespace-pre-wrap mt-2 overflow-y-auto p-4">
//             {novel.summary}
//           </DrawerDescription>
//         </DrawerContent>
//       </DrawerPortal>
//     </Drawer>
//   );
// };
