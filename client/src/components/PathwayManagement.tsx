import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PathwayManagementProps {
  token: string;
}

export function PathwayManagement({ token }: PathwayManagementProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPathway, setEditingPathway] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: pathways, isLoading } = trpc.adminPathways.list.useQuery({ token });
  const { data: courses } = trpc.courses.list.useQuery();

  const updatePathwayMutation = trpc.adminPathways.update.useMutation({
    onSuccess: () => {
      toast.success("Pathway updated successfully!");
      utils.adminPathways.list.invalidate();
      utils.courses.list.invalidate();
      setEditDialogOpen(false);
      setEditingPathway(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update pathway");
    },
  });

  const deletePathwayMutation = trpc.adminPathways.delete.useMutation({
    onSuccess: () => {
      toast.success("Pathway deleted successfully!");
      utils.adminPathways.list.invalidate();
      utils.courses.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete pathway");
    },
  });

  const handleEditPathway = (pathway: any) => {
    setEditingPathway(pathway);
    setEditDialogOpen(true);
  };

  const handleUpdatePathway = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updatePathwayMutation.mutate({
      token,
      id: editingPathway.id,
      order: parseInt(formData.get("order") as string),
    });
  };

  const handleDeletePathway = (pathway: any) => {
    // Check if this pathway's next course has downstream dependencies
    const hasDownstream = pathways?.some(
      (p) => p.prerequisiteCourseId === pathway.nextCourseId
    );

    if (hasDownstream) {
      toast.error(
        `Cannot delete: This pathway's destination course is a prerequisite for other courses. Delete those pathways first.`,
        { duration: 5000 }
      );
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete the pathway from "${getCourseName(pathway.prerequisiteCourseId)}" to "${getCourseName(pathway.nextCourseId)}"?`
      )
    ) {
      deletePathwayMutation.mutate({ token, id: pathway.id });
    }
  };

  const getCourseName = (courseId: number) => {
    const course = courses?.find((c) => c.id === courseId);
    return course ? course.courseName : `Course ID ${courseId}`;
  };

  const canDelete = (pathway: any) => {
    return !pathways?.some((p) => p.prerequisiteCourseId === pathway.nextCourseId);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading pathways...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pathway Management</CardTitle>
          <CardDescription>
            View and manage all course pathways. Pathways with downstream dependencies cannot be deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pathways || pathways.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pathways created yet. Use the "Create Pathway" button above to add pathways.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From (Prerequisite)</TableHead>
                  <TableHead>To (Next Course)</TableHead>
                  <TableHead className="text-center">Order</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pathways.map((pathway) => {
                  const deletable = canDelete(pathway);
                  return (
                    <TableRow key={pathway.id}>
                      <TableCell className="font-medium">
                        {getCourseName(pathway.prerequisiteCourseId)}
                      </TableCell>
                      <TableCell>{getCourseName(pathway.nextCourseId)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{pathway.order}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {deletable ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Can Delete
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Has Dependencies
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPathway(pathway)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePathway(pathway)}
                            disabled={!deletable}
                            title={
                              deletable
                                ? "Delete pathway"
                                : "Cannot delete: destination course has downstream pathways"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pathway Order</DialogTitle>
            <DialogDescription>
              Change the display order for this pathway connection
            </DialogDescription>
          </DialogHeader>
          {editingPathway && (
            <form onSubmit={handleUpdatePathway} className="space-y-4">
              <div className="space-y-2">
                <Label>From (Prerequisite)</Label>
                <Input value={getCourseName(editingPathway.prerequisiteCourseId)} disabled />
              </div>
              <div className="space-y-2">
                <Label>To (Next Course)</Label>
                <Input value={getCourseName(editingPathway.nextCourseId)} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-order">Display Order</Label>
                <Input
                  id="edit-order"
                  name="order"
                  type="number"
                  defaultValue={editingPathway.order}
                  min="1"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first when multiple courses follow the same prerequisite
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={updatePathwayMutation.isPending}>
                {updatePathwayMutation.isPending ? "Updating..." : "Update Pathway"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

