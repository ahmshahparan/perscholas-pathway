import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityLogProps {
  token: string;
  entityType?: string;
  entityId?: number;
  limit?: number;
  title?: string;
  description?: string;
}

export function ActivityLog({ token, entityType, entityId, limit = 50, title, description }: ActivityLogProps) {
  const { data: logs, isLoading } = entityType && entityId
    ? trpc.auditLogs.getByEntity.useQuery({ token, entityType, entityId })
    : trpc.auditLogs.getAll.useQuery({ token, limit });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "update":
        return <Pencil className="h-4 w-4 text-blue-600" />;
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800 border-green-200";
      case "update":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delete":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case "course":
        return "bg-purple-100 text-purple-800";
      case "pathway":
        return "bg-indigo-100 text-indigo-800";
      case "domain":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "Activity Log"}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "Activity Log"}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Activity Log"}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 pb-4 border-b last:border-0">
                <div className="mt-1">{getActionIcon(log.action)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                    <Badge variant="secondary" className={getEntityTypeColor(log.entityType)}>
                      {log.entityType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      by <span className="font-medium">{log.adminUsername}</span>
                    </span>
                  </div>
                  <p className="text-sm">{log.changeDescription}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

