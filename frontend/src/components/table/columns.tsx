import { type models } from "wailsjs/go/models";
import { createColumnHelper } from "@tanstack/react-table";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Quote,
  Star,
  User,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { toast } from "sonner";
import { useLoaderData } from "@tanstack/react-router";
import { QueryNovelById } from "wailsjs/go/main/App";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useCopyToClipboard } from "react-use";

const columnHelper = createColumnHelper<models.Novel>();

export const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (props) => <div className="text-xs">{props.getValue()}</div>,
  }),
  columnHelper.accessor("title", {
    header: "标题",
    cell: (props) => {
      const [open, setOpen] = useState(false);
      const [currentNovelId, setCurrentNovelId] = useState<string | null>(null);
      const scrollRef = useRef<HTMLDivElement>(null);
      const { ids } = useLoaderData({
        from: "/filter",
      });
      const { data, isFetching } = useQuery({
        queryKey: ["novel", currentNovelId],
        queryFn: () => QueryNovelById(currentNovelId!),
        enabled: !!currentNovelId,
        placeholderData: (prev) => prev ?? props.row.original,
      });
      const novel = currentNovelId === null ? props.row.original : data!;

      // 切换后自动滚动到顶部
      useEffect(() => {
        if (novel?.id) {
          scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, [novel?.id]);

      useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
          const index = ids.findIndex((id) => id === novel?.id);
          if (e.key === "ArrowLeft" && index > 0) {
            setCurrentNovelId(ids[index - 1]);
          } else if (
            e.key === "ArrowRight" &&
            index < ids.length - 1 &&
            index !== -1
          ) {
            setCurrentNovelId(ids[index + 1]);
          }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }, [open, ids, novel?.id]);

      return (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <div className="text-left cursor-pointer group">
              <div className="font-semibold group-hover:text-primary group-hover:underline transition-colors decoration-primary/30 underline-offset-4">
                {props.getValue()}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {props.row.original.author}
              </div>
            </div>
          </DrawerTrigger>
          <DrawerContent className="max-w-3xl mx-auto h-[90vh] flex flex-col p-0 focus:outline-none">
            <div
              className={clsx(
                "flex-1 flex flex-col min-h-0 transition-opacity duration-200 ease-in-out",
                {
                  "opacity-50": isFetching,
                },
              )}
            >
              {/* Scrollable Area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 scrollbar-none"
              >
                <DrawerHeader className="px-0 pt-8 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <DrawerTitle className="text-xl font-bold text-foreground tracking-tight flex-1">
                      {novel.title}
                    </DrawerTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20">
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs font-bold text-yellow-700 leading-none">
                          {novel.star_rating}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full hover:bg-primary/5"
                        onClick={() => toast.warning("下载功能开发中...")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 text-sm">
                    <div className="flex items-center gap-1.5 bg-secondary/40 px-2.5 py-0.5 rounded-full text-secondary-foreground text-[11px] border border-secondary shadow-sm">
                      <BookOpen className="h-3 w-3 opacity-70" />
                      <span>{novel.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-secondary/40 px-2.5 py-0.5 rounded-full text-secondary-foreground text-[11px] border border-secondary shadow-sm">
                      <User className="h-3 w-3 opacity-70" />
                      <span>{novel.author}</span>
                    </div>
                    {novel.conception && (
                      <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-0.5 rounded-full text-primary text-[11px] border border-primary/10 shadow-sm">
                        <span className="opacity-60 font-bold">立意:</span>
                        <span className="font-semibold truncate max-w-[200px]">
                          {novel.conception}
                        </span>
                      </div>
                    )}
                  </div>

                  {novel.short_intro && (
                    <div className="mt-4 relative bg-muted/20 p-3 rounded-lg border border-dashed border-border/40 overflow-hidden text-left shadow-inner">
                      <Quote className="absolute -top-1 -left-1 h-6 w-6 text-primary/5 fill-primary/5 -rotate-12" />
                      <div className="relative pl-1">
                        <span className="text-[10px] uppercase font-bold text-primary/60 block mb-0.5">
                          短简介
                        </span>
                        <p className="text-[13px] text-muted-foreground/85 italic leading-relaxed">
                          {novel.short_intro}
                        </p>
                      </div>
                    </div>
                  )}
                </DrawerHeader>

                {/* Body Content */}
                <div className="flex-1 py-2 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-3 rounded-full bg-primary/60" />
                    <h3 className="text-[10px] font-bold text-foreground/50 uppercase tracking-[0.2em]">
                      内容简介
                    </h3>
                  </div>
                  <div className="text-[14px] leading-relaxed text-muted-foreground/90 whitespace-pre-wrap font-sans pb-8 px-1">
                    {novel.summary}
                  </div>
                </div>
              </div>

              {/* Fixed Footer at bottom */}
              <div className="flex-none px-6 py-4 border-t bg-background/95 backdrop-blur-md shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                <DrawerFooter className="flex-row items-center justify-between gap-4 p-0">
                  {(() => {
                    const index = ids.findIndex((id) => id === novel?.id);
                    const isFirst = index <= 0;
                    const isLast = index >= ids.length - 1 || index === -1;

                    return (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1 h-10 shadow-sm hover:bg-muted"
                          disabled={isFirst}
                          onClick={() => setCurrentNovelId(ids[index - 1])}
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          上一本
                        </Button>
                        <div className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
                          <span className="text-[10px] font-bold text-muted-foreground tabular-nums opacity-80">
                            {index !== -1 ? index + 1 : "-"} / {ids.length}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="flex-1 h-10 shadow-sm hover:bg-muted"
                          disabled={isLast}
                          onClick={() => setCurrentNovelId(ids[index + 1])}
                        >
                          下一本
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </>
                    );
                  })()}
                </DrawerFooter>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      );
    },
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
      const [_, copyToClipboard] = useCopyToClipboard();
      return (
        <Button
          variant="ghost"
          onClick={() => {
            copyToClipboard(
              `https://www.aqxsw666.com/txt-xx/15/txt-${props.row.original.id}.htm`,
            );
            toast.success("复制链接成功");
          }}
        >
          <Copy />
        </Button>
      );
    },
  }),
];
