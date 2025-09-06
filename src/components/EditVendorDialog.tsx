import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { useVendors, Vendor } from "@/contexts/VendorsContext";
import ConfirmationDialog from "./ConfirmationDialog";
import { Trash2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
});

interface EditVendorDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  vendor: Vendor;
}

const EditVendorDialog: React.FC<EditVendorDialogProps> = ({
  isOpen,
  onOpenChange,
  vendor,
}) => {
  const { updateVendor, deleteVendors } = useVendors();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: vendor.name,
    },
  });

  React.useEffect(() => {
    form.reset({ name: vendor.name });
  }, [vendor, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await updateVendor({ ...vendor, name: values.name });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await deleteVendors([vendor.id]);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="sm:justify-between pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Are you sure you want to delete this vendor?"
        description="This action cannot be undone. This will permanently delete the vendor."
        confirmText="Delete"
      />
    </>
  );
};

export default EditVendorDialog;