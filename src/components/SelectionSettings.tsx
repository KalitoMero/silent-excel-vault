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
import { Plus, Save, Trash } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Department {
  id: string;
  name: string;
}

interface AdditionalInfo {
  id: string;
  name: string;
  departmentId: string;
}

const SelectionSettings = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [additionalInfos, setAdditionalInfos] = useState<AdditionalInfo[]>([]);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newAdditionalInfoName, setNewAdditionalInfoName] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');

  useEffect(() => {
    // Load departments from localStorage
    const savedDepartments = localStorage.getItem('departments');
    if (savedDepartments) {
      try {
        setDepartments(JSON.parse(savedDepartments));
      } catch (error) {
        console.error('Error loading departments:', error);
      }
    }

    // Load additional infos from localStorage
    const savedAdditionalInfos = localStorage.getItem('additionalInfos');
    if (savedAdditionalInfos) {
      try {
        setAdditionalInfos(JSON.parse(savedAdditionalInfos));
      } catch (error) {
        console.error('Error loading additional infos:', error);
      }
    }
  }, []);

  const addDepartment = () => {
    if (!newDepartmentName.trim()) {
      toast({
        title: "Ungültige Eingabe",
        description: "Bitte geben Sie einen Abteilungsnamen ein.",
        variant: "destructive"
      });
      return;
    }

    const newDepartment: Department = {
      id: Date.now().toString(),
      name: newDepartmentName.trim()
    };

    const updatedDepartments = [...departments, newDepartment];
    setDepartments(updatedDepartments);
    localStorage.setItem('departments', JSON.stringify(updatedDepartments));
    setNewDepartmentName('');

    toast({
      title: "Abteilung hinzugefügt",
      description: `"${newDepartment.name}" wurde erfolgreich hinzugefügt.`
    });
  };

  const removeDepartment = (departmentId: string) => {
    const updatedDepartments = departments.filter(dept => dept.id !== departmentId);
    setDepartments(updatedDepartments);
    localStorage.setItem('departments', JSON.stringify(updatedDepartments));

    // Remove all additional infos associated with this department
    const updatedAdditionalInfos = additionalInfos.filter(info => info.departmentId !== departmentId);
    setAdditionalInfos(updatedAdditionalInfos);
    localStorage.setItem('additionalInfos', JSON.stringify(updatedAdditionalInfos));

    toast({
      title: "Abteilung entfernt",
      description: "Die Abteilung und alle zugehörigen Erstteilinformationen wurden entfernt."
    });
  };

  const addAdditionalInfo = () => {
    if (!newAdditionalInfoName.trim()) {
      toast({
        title: "Ungültige Eingabe",
        description: "Bitte geben Sie einen Namen für die Erstteilinformation ein.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedDepartmentId) {
      toast({
        title: "Keine Abteilung ausgewählt",
        description: "Bitte wählen Sie eine Abteilung aus.",
        variant: "destructive"
      });
      return;
    }

    const newAdditionalInfo: AdditionalInfo = {
      id: Date.now().toString(),
      name: newAdditionalInfoName.trim(),
      departmentId: selectedDepartmentId
    };

    const updatedAdditionalInfos = [...additionalInfos, newAdditionalInfo];
    setAdditionalInfos(updatedAdditionalInfos);
    localStorage.setItem('additionalInfos', JSON.stringify(updatedAdditionalInfos));
    setNewAdditionalInfoName('');

    toast({
      title: "Erstteilinformation hinzugefügt",
      description: `"${newAdditionalInfo.name}" wurde erfolgreich hinzugefügt.`
    });
  };

  const removeAdditionalInfo = (infoId: string) => {
    const updatedAdditionalInfos = additionalInfos.filter(info => info.id !== infoId);
    setAdditionalInfos(updatedAdditionalInfos);
    localStorage.setItem('additionalInfos', JSON.stringify(updatedAdditionalInfos));

    toast({
      title: "Erstteilinformation entfernt",
      description: "Die Erstteilinformation wurde erfolgreich entfernt."
    });
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : 'Unbekannt';
  };

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
                onKeyDown={(e) => e.key === 'Enter' && addDepartment()}
                className="flex-1"
              />
              <Button onClick={addDepartment} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
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
                onKeyDown={(e) => e.key === 'Enter' && addAdditionalInfo()}
              />
              
              <Button 
                onClick={addAdditionalInfo} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={departments.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
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
                        <TableCell>{getDepartmentName(info.departmentId)}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeAdditionalInfo(info.id)}
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

export default SelectionSettings;