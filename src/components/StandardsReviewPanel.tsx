import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, Plus, Save } from "lucide-react";

interface Standard {
  code: string;
  subject: string;
  domain: string;
  text: string;
  gradeLevel: string;
}

interface StandardsReviewPanelProps {
  standards: Standard[];
  onUpdate: (standards: Standard[]) => void;
}

export const StandardsReviewPanel = ({ standards, onUpdate }: StandardsReviewPanelProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Standard | null>(null);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...standards[index] });
  };

  const handleSave = () => {
    if (editingIndex !== null && editForm) {
      const updated = [...standards];
      updated[editingIndex] = editForm;
      onUpdate(updated);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const handleDelete = (index: number) => {
    const updated = standards.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const handleAdd = () => {
    const newStandard: Standard = {
      code: '',
      subject: '',
      domain: '',
      text: '',
      gradeLevel: ''
    };
    onUpdate([...standards, newStandard]);
    setEditingIndex(standards.length);
    setEditForm(newStandard);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Standards ({standards.length})</CardTitle>
            <CardDescription>Review and customize compiled standards</CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Standard
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {standards.map((standard, index) => (
              <Card key={index} className="p-4">
                {editingIndex === index ? (
                  <div className="space-y-3">
                    <Input
                      value={editForm?.code || ''}
                      onChange={(e) => setEditForm({ ...editForm!, code: e.target.value })}
                      placeholder="Standard Code (e.g., RL.8.1)"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={editForm?.subject || ''}
                        onChange={(e) => setEditForm({ ...editForm!, subject: e.target.value })}
                        placeholder="Subject"
                      />
                      <Input
                        value={editForm?.domain || ''}
                        onChange={(e) => setEditForm({ ...editForm!, domain: e.target.value })}
                        placeholder="Domain"
                      />
                    </div>
                    <Textarea
                      value={editForm?.text || ''}
                      onChange={(e) => setEditForm({ ...editForm!, text: e.target.value })}
                      placeholder="Standard text"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm" className="gap-2">
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingIndex(null);
                          setEditForm(null);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{standard.code}</Badge>
                          <Badge variant="outline">{standard.subject}</Badge>
                          {standard.domain && (
                            <span className="text-xs text-muted-foreground">{standard.domain}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleEdit(index)}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(index)}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm">{standard.text}</p>
                  </>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};