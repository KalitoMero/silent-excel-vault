import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Plus, Trash, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService, Department, AdditionalInfo } from '@/services/api';

const SelectionSettingsNew = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [additionalInfos, setAdditionalInfos] = useState<AdditionalInfo[]>([]);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newAdditionalInfoName, setNewAdditionalInfoName] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [departmentsResult, additionalInfosResult] = await Promise.all([
        apiService.getDepartments(),
        apiService.getAdditionalInfos()
      ]);

      if (departmentsResult.success && departmentsResult.departments) {
        setDepartments(departmentsResult.departments);
      }

      if (additionalInfosResult.success && additionalInfosResult.additionalInfos) {
        setAdditionalInfos(additionalInfosResult.additionalInfos);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast("Fehler beim Laden der Daten", { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast("Bitte geben Sie einen Abteilungsnamen ein.", { duration: 2000 });
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiService.createDepartment(newDepartmentName.trim());
      
      if (result.success && result.department) {
        setDepartments([...departments, result.department]);
        setNewDepartmentName('');
        toast(`"${result.department.name}" wurde erfolgreich hinzugefügt.`, { duration: 2000 });
      } else {
        toast(result.error || "Fehler beim Hinzufügen der Abteilung", { duration: 3000 });
      }
    } catch (error) {
      console.error('Error adding department:', error);
      toast("Fehler beim Hinzufügen der Abteilung", { duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const removeDepartment = async (departmentId: string) => {
    setSubmitting(true);
    try {
      const result = await apiService.deleteDepartment(departmentId);
      
      if (result.success) {
        setDepartments(departments.filter(dept => dept.id !== departmentId));
        setAdditionalInfos(additionalInfos.filter(info => info.department_id !== departmentId));
        toast("Die Abteilung und alle zugehörigen Erstteilinformationen wurden entfernt.", { duration: 2000 });
      } else {
        toast(result.error || "Fehler beim Entfernen der Abteilung", { duration: 3000 });
      }
    } catch (error) {
      console.error('Error removing department:', error);
      toast("Fehler beim Entfernen der Abteilung", { duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const addAdditionalInfo = async () => {
    if (!newAdditionalInfoName.trim()) {
      toast("Bitte geben Sie einen Namen für die Erstteilinformation ein.", { duration: 2000 });
      return;
    }

    if (!selectedDepartmentId) {
      toast("Bitte wählen Sie eine Abteilung aus.", { duration: 2000 });
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiService.createAdditionalInfo(newAdditionalInfoName.trim(), selectedDepartmentId);
      
      if (result.success && result.additionalInfo) {
        setAdditionalInfos([...additionalInfos, result.additionalInfo]);
        setNewAdditionalInfoName('');
        toast(`"${result.additionalInfo.name}" wurde erfolgreich hinzugefügt.`, { duration: 2000 });
      } else {
        toast(result.error || "Fehler beim Hinzufügen der Erstteilinformation", { duration: 3000 });
      }
    } catch (error) {
      console.error('Error adding additional info:', error);
      toast("Fehler beim Hinzufügen der Erstteilinformation", { duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const removeAdditionalInfo = async (infoId: string) => {
    setSubmitting(true);
    try {
      const result = await apiService.deleteAdditionalInfo(infoId);
      
      if (result.success) {
        setAdditionalInfos(additionalInfos.filter(info => info.id !== infoId));
        toast("Die Erstteilinformation wurde erfolgreich entfernt.", { duration: 2000 });
      } else {
        toast(result.error || "Fehler beim Entfernen der Erstteilinformation", { duration: 3000 });
      }
    } catch (error) {
      console.error('Error removing additional info:', error);
      toast("Fehler beim Entfernen der Erstteilinformation", { duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : 'Unbekannt';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Departments Section */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Abteilungen verwalten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Neue Abteilung (z.B. Fräsen, Drehen)"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !submitting && addDepartment()}
                className="flex-1"
                disabled={submitting}
              />
              <Button 
                onClick={addDepartment} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Hinzufügen
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Abteilungsname</TableHead>
                    <TableHead className="w-20">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.length > 0 ? (
                    departments.map((department) => (
                      <TableRow key={department.id}>
                        <TableCell className="font-medium">{department.name}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeDepartment(department.id)}
                            disabled={submitting}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                        Noch keine Abteilungen vorhanden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Infos Section */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Erstteilinformationen verwalten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Abteilung auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="text"
                placeholder="Neue Erstteilinformation (z.B. Maschine 3)"
                value={newAdditionalInfoName}
                onChange={(e) => setNewAdditionalInfoName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !submitting && addAdditionalInfo()}
                disabled={submitting}
              />
              
              <Button 
                onClick={addAdditionalInfo} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={departments.length === 0 || submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Hinzufügen
              </Button>
            </div>

            {departments.length === 0 && (
              <p className="text-sm text-gray-500">
                Erstellen Sie zuerst Abteilungen, um Erstteilinformationen hinzufügen zu können.
              </p>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Erstteilinformation</TableHead>
                    <TableHead>Abteilung</TableHead>
                    <TableHead className="w-20">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {additionalInfos.length > 0 ? (
                    additionalInfos.map((info) => (
                      <TableRow key={info.id}>
                        <TableCell className="font-medium">{info.name}</TableCell>
                        <TableCell>{getDepartmentName(info.department_id)}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeAdditionalInfo(info.id)}
                            disabled={submitting}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                        Noch keine Erstteilinformationen vorhanden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectionSettingsNew;