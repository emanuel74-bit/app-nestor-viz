import { useState } from 'react';
import { useInfrastructure } from '@/context/InfrastructureContext';
import { AppTypeBadge } from '@/components/AppTypeBadge';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddVMDialog } from '@/components/dialogs/AddVMDialog';
import { Plus, HardDrive, Box } from 'lucide-react';

export function VMsView() {
  const { vms, getAppsByVM, getSourceById } = useInfrastructure();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Virtual Machines</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage VMs and view deployed applications
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add VM
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vms.map((vm) => {
          const apps = getAppsByVM(vm.id);
          
          return (
            <Card key={vm.id} className="bg-gradient-card border-border/50 animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-mono">{vm.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusIndicator status={vm.status} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    App Type
                  </span>
                  <AppTypeBadge type={vm.appType} />
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                    Running Apps ({apps.length})
                  </div>
                  <div className="space-y-2">
                    {apps.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center bg-secondary/30 rounded-md">
                        No apps deployed
                      </p>
                    ) : (
                      apps.map((app) => {
                        const source = getSourceById(app.sourceId);
                        return (
                          <div
                            key={app.id}
                            className="flex items-center justify-between p-2 rounded-md bg-secondary/30 border border-border/50"
                          >
                            <div className="flex items-center gap-2">
                              <Box className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {source?.name || 'Unknown'}
                              </span>
                            </div>
                            <StatusIndicator status={app.status} showLabel={false} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {vms.length === 0 && (
          <Card className="border-dashed md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HardDrive className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No virtual machines available.
                <br />
                Add a VM to start deploying applications.
              </p>
              <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First VM
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AddVMDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
