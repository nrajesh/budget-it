"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Category } from "@/contexts/TransactionsContext"; // Import Category type

const formSchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }),
});

interface AddEditCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  onSave: (name: string) => Promise<void>;
  isSaving: boolean;
}

export const AddEditCategoryDialog: React.FC<AddEditCategoryDialogProps> = ({
  isOpen,
  onOpenChange,
  category,
  onSave,
  isSaving,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({ name: category.name });
    } else {
      form.reset({ name: "" });
    }
  }, [category, isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onSave(values.name);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  const title = category ? "Edit Category" : "Add New Category";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Groceries, Utilities" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {category ? "Save Changes" : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};