import { Slider } from "@/components/ui/slider";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { Input } from "@/components/ui/input";

interface StarRatingProps {
  value?: number[];
  defaultValue?: number[];
  onChange?: (value: number[]) => void;
}
const StartRating = ({
  value: controlledValue,
  defaultValue = [4, 5],
  onChange,
}: StarRatingProps) => {
  const [value, setValue] = useControllableState<number[]>({
    prop: controlledValue,
    defaultProp: defaultValue,
    onChange,
  });

  return (
    <div className="p-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="最小星级"
          value={value[0]}
          onChange={(e) => setValue([Number(e.target.value), value[1]])}
        />
        ~
        <Input
          type="number"
          placeholder="最大星级"
          value={value[1]}
          onChange={(e) => setValue([value[0], Number(e.target.value)])}
        />
      </div>
      <Slider
        className="mt-6"
        min={1}
        max={5}
        step={1}
        value={value}
        onValueChange={setValue}
      />
    </div>
  );
};

export default StartRating;
