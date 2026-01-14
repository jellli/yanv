import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryCategories } from "wailsjs/go/main/App";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useControllableState } from "@radix-ui/react-use-controllable-state";

interface CategoriesProps {
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
}
const Categories = ({
  value: controlledValue,
  defaultValue = [],
  onChange,
}: CategoriesProps) => {
  const [value, setValue] = useControllableState<string[]>({
    prop: controlledValue,
    defaultProp: defaultValue,
    onChange,
  });
  const [searchCategoryText, setSearchCategoryText] = useState("");
  const { data: categories } = useQuery({
    queryKey: ["category"],
    queryFn: () => QueryCategories(),
  });
  const filteredCategories = categories?.filter((c) =>
    c.includes(searchCategoryText),
  );
  return (
    <>
      <InputGroup>
        <InputGroupInput
          placeholder="过滤类别"
          onChange={(e) => {
            setSearchCategoryText(e.target.value);
          }}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      <ScrollArea className="h-48 mt-2">
        {filteredCategories?.map((categroy) => (
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id={categroy}
              onCheckedChange={(checked) =>
                setValue(
                  checked
                    ? [...value, categroy]
                    : value.filter((v) => v !== categroy),
                )
              }
            />
            <Label htmlFor={categroy}>{categroy}</Label>
          </div>
        ))}
      </ScrollArea>
    </>
  );
};

export default Categories;
