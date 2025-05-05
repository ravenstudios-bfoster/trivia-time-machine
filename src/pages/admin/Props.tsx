import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { Prop } from "@/types";
import { getProps, deleteProp } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { WindowConfigCard } from "@/components/WindowConfigCard";

const AdminProps = () => {
  const { userRole } = useAuth();
  const [props, setProps] = useState<Prop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (userRole === "admin") return;
    const fetchProps = async () => {
      setIsLoading(true);
      try {
        const fetchedProps = await getProps();
        setProps(fetchedProps);
      } catch (error) {
        console.error("Failed to fetch props:", error);
        toast.error("Failed to load props.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProps();
  }, [userRole]);

  if (userRole === "admin") {
    return (
      <AdminLayout title="Manage Props & Memorabilia">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-24">
            <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
            <p className="text-lg text-muted-foreground">You do not have permission to view this page.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const handleDeleteProp = async (propId: string, propTitle: string) => {
    setIsDeleting(propId);
    try {
      await deleteProp(propId);
      setProps((currentProps) => currentProps.filter((p) => p.id !== propId));
      toast.success(`Prop '${propTitle}' deleted successfully.`);
    } catch (error) {
      console.error("Failed to delete prop:", error);
      toast.error(`Failed to delete prop '${propTitle}'.`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <AdminLayout title="Props Management" subtitle="Manage props and memorabilia" breadcrumbs={[{ label: "Props", href: "/admin/props" }]}>
      <WindowConfigCard type="props" title="Props Window" defaultMessage="Props will open at {time}" />
      <div className="flex justify-end mb-4">
        <Link to="/admin/props/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Prop
          </Button>
        </Link>
      </div>

      <div className="rounded-md border border-[#333] bg-[#111]">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[#333]">
              <TableHead className="w-[100px] text-white">Image</TableHead>
              <TableHead className="text-white">Title</TableHead>
              <TableHead className="text-white">Movie</TableHead>
              <TableHead className="text-white">Year</TableHead>
              <TableHead className="text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-[#666]">
                  <Loader2 className="h-6 w-6 animate-spin inline-block" /> Loading props...
                </TableCell>
              </TableRow>
            ) : props.length > 0 ? (
              props.map((prop) => (
                <TableRow key={prop.id} className="border-b-[#333]">
                  <TableCell>
                    {prop.imageUrl ? (
                      <img src={prop.imageUrl} alt={prop.title} className="h-10 w-10 object-cover rounded-sm" />
                    ) : (
                      <div className="h-10 w-10 bg-[#222] rounded-sm flex items-center justify-center text-[#666] text-xs">No Img</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-[#ccc]">{prop.title}</TableCell>
                  <TableCell className="text-[#ccc]">{prop.movie}</TableCell>
                  <TableCell className="text-[#ccc]">{prop.year}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/admin/props/${prop.id}/edit`} className="mr-2">
                      <Button variant="outline" size="icon" className="border-[#333] text-[#666] hover:text-white hover:border-[#FFD700]">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={isDeleting === prop.id}>
                          {isDeleting === prop.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone. This will permanently delete the prop '{prop.title}' and its associated image from storage.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting === prop.id}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProp(prop.id, prop.title)} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting === prop.id}>
                            {isDeleting === prop.id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-[#666]">
                  No props found. Click "Add New Prop" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default AdminProps;
