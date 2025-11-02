import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FORM_DEFAULT_VALUES } from "@/components/features/feed/dialogs/constants";

const formSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
  type: z.enum(["rss", "youtube"]),
  category: z.string().optional(),
  fetch_full_content: z.boolean().optional(),
});

export const useAddFeedForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: FORM_DEFAULT_VALUES,
  });

  const resetForm = () => {
    form.reset(FORM_DEFAULT_VALUES);
  };

  const setFeedType = (type) => {
    form.setValue("type", type);
    form.setValue("url", "");
  };

  const setFeedData = (data) => {
    if (data.title) form.setValue("title", data.title);
    if (data.url) form.setValue("url", data.url);
  };

  return {
    form,
    resetForm,
    setFeedType,
    setFeedData,
  };
};
