import { type models } from "wailsjs/go/models";
import { createColumnHelper } from "@tanstack/react-table";
import { Download, Star } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { ScrollArea } from "../ui/scroll-area";

const columnHelper = createColumnHelper<models.Novel>();

export const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (props) => <div className="text-xs">{props.getValue()}</div>,
  }),
  columnHelper.accessor("title", {
    header: "标题",
    cell: (props) => (
      <Drawer direction="right">
        <DrawerTrigger>
          <div className="text-left">
            <div className="font-semibold">{props.getValue()}</div>
            <div className="text-xs text-muted-foreground">
              {props.row.original.author}
            </div>
          </div>
        </DrawerTrigger>
        <DrawerContent className="flex flex-col">
          <DrawerHeader>
            <DrawerTitle className="text-xl">
              {props.row.original.title}
            </DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="whitespace-pre-wrap px-4 text-muted-foreground text-sm flex-1 overflow-y-auto">
            {props.row.original.summary}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    ),
  }),
  columnHelper.accessor("category", {
    header: "分类",
    cell: (props) => <Badge variant="secondary">{props.getValue()}</Badge>,
  }),
  columnHelper.accessor("star_rating", {
    header: "星级",
    cell: (props) => (
      <div className="flex items-center">
        {Array.from({ length: props.getValue() }).map((_, index) => (
          <Star
            key={index}
            className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500"
          />
        ))}
      </div>
    ),
  }),
  columnHelper.accessor("update_time", {
    header: "更新时间",
    cell: (props) => (
      <div className="text-xs text-muted-foreground">{props.getValue()}</div>
    ),
  }),
  columnHelper.accessor("size", {
    header: "文件大小",
    cell: (props) => (
      <div className="text-xs text-muted-foreground">{props.getValue()}</div>
    ),
  }),
  columnHelper.display({
    header: "操作",
    cell: (props) => {
      return (
        <Button
          variant="ghost"
          onClick={() => console.log(props.row.original.download_url)}
        >
          <Download />
        </Button>
      );
    },
  }),
];
