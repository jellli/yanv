import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Search } from "lucide-react";
import StartRating from "./fields/star-rating";
import Categories from "./fields/categories";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import type { main } from "wailsjs/go/models";
import { produce } from "immer";

interface NovelFilterProps {
  value?: main.NovelQuery;
  onChange?: (value: main.NovelQuery) => void;
  defaultValue?: main.NovelQuery;
}
const NovelFilter = ({
  value: controlledValue,
  onChange,
  defaultValue = {},
}: NovelFilterProps) => {
  const [value, setValue] = useControllableState<main.NovelQuery>({
    prop: controlledValue,
    defaultProp: defaultValue,
    onChange,
  });

  const handleChange = <K extends keyof main.NovelQuery>(
    key: K,
    v: main.NovelQuery[K],
  ) => {
    const newValue = produce(value, (draft) => {
      draft[key] = v;
    });

    setValue(newValue);
  };

  return (
    <Accordion
      type="multiple"
      className="w-[200px]"
      defaultValue={["star_rating", "category"]}
    >
      <AccordionItem value="title">
        <AccordionTrigger>标题</AccordionTrigger>
        <AccordionContent>
          <InputGroup>
            <InputGroupInput
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="搜索小说标题..."
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="author">
        <AccordionTrigger>作者</AccordionTrigger>
        <AccordionContent>
          <InputGroup>
            <InputGroupInput
              onChange={(e) => handleChange("author", e.target.value)}
              placeholder="搜索小说作者..."
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="star_rating">
        <AccordionTrigger>星级</AccordionTrigger>
        <AccordionContent>
          <StartRating onChange={(v) => handleChange("star_rating", v)} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="category">
        <AccordionTrigger>分类</AccordionTrigger>
        <AccordionContent>
          <Categories onChange={(v) => handleChange("category", v)} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default NovelFilter;
