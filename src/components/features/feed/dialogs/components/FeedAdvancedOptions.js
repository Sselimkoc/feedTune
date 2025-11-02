import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/core/ui/form";
import { Input } from "@/components/core/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import { useTranslation } from "react-i18next";
import { Globe, Sparkles, AlignLeft, Film, Plus } from "lucide-react";

const categoryIcons = {
  general: Globe,
  tech: Sparkles,
  news: AlignLeft,
  entertainment: Film,
  other: Plus,
};

const categories = [
  { value: "general", label: "General" },
  { value: "tech", label: "Technology" },
  { value: "news", label: "News" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

export function FeedAdvancedOptions({ form }) {
  const { t } = useTranslation();

  return (
    <Form {...form}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t("feeds.addFeed.customTitle")}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-10 text-sm rounded-lg px-3"
                    placeholder={t("feeds.addFeed.leaveBlankForAutoTitle")}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t("feeds.addFeed.category")}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-10 text-sm rounded-lg px-3">
                      <SelectValue
                        placeholder={t("feeds.addFeed.selectCategory")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => {
                      const IconComponent = categoryIcons[cat.value];
                      return (
                        <SelectItem
                          key={cat.value}
                          value={cat.value}
                          className="text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {IconComponent && (
                              <IconComponent className="h-4 w-4" />
                            )}
                            {t(`feeds.addFeed.categories.${cat.value}`) ||
                              cat.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  );
}
