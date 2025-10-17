import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, BookOpen, Calendar, GraduationCap, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function StudentAssignments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_assigned' | 'due_date' | 'course' | 'grade' | 'status'>('due_date');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    filterAndSortAssignments();
  }, [assignments, searchQuery, sortBy, filterStatus, filterCourse]);

  const fetchAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentData) return;

      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          *,
          curriculum_items (
            title,
            type,
            body,
            course_id,
            courses (
              id,
              title,
              subject,
              student_id
            )
          ),
          submissions (
            id,
            created_at
          ),
          grades (
            score,
            max_score
          )
        `)
        .eq('curriculum_items.courses.student_id', studentData.id)
        .order('created_at', { ascending: false });

      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .eq('student_id', studentData.id);

      setAssignments(assignmentsData || []);
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchInAssignmentContent = (assignment: any, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    
    // Search in title
    if (assignment.curriculum_items?.title?.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in course name
    if (assignment.curriculum_items?.courses?.title?.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in assignment body/content
    if (assignment.curriculum_items?.body) {
      const body = JSON.stringify(assignment.curriculum_items.body).toLowerCase();
      if (body.includes(lowerQuery)) return true;
    }
    
    return false;
  };

  const filterAndSortAssignments = () => {
    let filtered = [...assignments];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(a => searchInAssignmentContent(a, searchQuery));
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => {
        if (filterStatus === 'assigned') return a.status === 'assigned' && (!a.submissions || a.submissions.length === 0);
        if (filterStatus === 'submitted') return a.submissions && a.submissions.length > 0 && !a.grades;
        if (filterStatus === 'graded') return a.grades && a.grades.length > 0;
        if (filterStatus === 'archived') return a.status === 'archived';
        return true;
      });
    }

    // Apply course filter
    if (filterCourse !== 'all') {
      filtered = filtered.filter(a => a.curriculum_items?.courses?.id === filterCourse);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_assigned':
          return new Date(b.assigned_date || b.created_at).getTime() - new Date(a.assigned_date || a.created_at).getTime();
        case 'due_date':
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        case 'course':
          return (a.curriculum_items?.courses?.title || '').localeCompare(b.curriculum_items?.courses?.title || '');
        case 'grade':
          const gradeA = a.grades?.[0]?.score || 0;
          const gradeB = b.grades?.[0]?.score || 0;
          return gradeB - gradeA;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredAssignments(filtered);
  };

  const getStatusBadge = (assignment: any) => {
    if (assignment.grades && assignment.grades.length > 0) {
      return <Badge variant="default">Graded</Badge>;
    }
    if (assignment.submissions && assignment.submissions.length > 0) {
      return <Badge variant="secondary">Submitted</Badge>;
    }
    if (assignment.status === 'archived') {
      return <Badge variant="outline">Archived</Badge>;
    }
    const now = new Date();
    if (assignment.due_at && new Date(assignment.due_at) < now) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge variant="default">Assigned</Badge>;
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Search through assignments based on query
      const results = assignments.filter(a => searchInAssignmentContent(a, chatInput));
      
      let responseText = '';
      if (results.length === 0) {
        responseText = "I couldn't find any assignments matching that search. Try different keywords or ask me to help you search in a different way.";
      } else {
        responseText = `I found ${results.length} assignment${results.length > 1 ? 's' : ''} matching "${chatInput}":\n\n`;
        results.slice(0, 5).forEach((a, i) => {
          responseText += `${i + 1}. **${a.curriculum_items?.title}** (${a.curriculum_items?.courses?.title})\n`;
        });
        if (results.length > 5) {
          responseText += `\n...and ${results.length - 5} more. Try refining your search to see specific results.`;
        }
      }

      setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">All Assignments</h1>
          <p className="text-muted-foreground">
            {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="lg">
              <MessageSquare className="h-4 w-4 mr-2" />
              Assignment Coach
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Assignment Coach</SheetTitle>
              <SheetDescription>
                Search through your assignments and lessons. I can help you find specific content, topics, or phrases.
              </SheetDescription>
            </SheetHeader>
            
            <div className="flex flex-col h-[calc(100vh-200px)] mt-6">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Ask me to help you find assignments!</p>
                      <p className="text-sm mt-2">Try: "red wheelbarrow" or "photosynthesis"</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <p className="text-sm">Searching...</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Input
                  placeholder="Search for assignments or content..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                />
                <Button onClick={handleChatSubmit} disabled={chatLoading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assignments, courses, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="date_assigned">Date Assigned</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="grade">Grade</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No assignments found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => (
            <Card 
              key={assignment.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/assignment/${assignment.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {assignment.curriculum_items?.courses?.title}
                      </span>
                    </div>
                    <CardTitle className="text-xl mb-2">
                      {assignment.curriculum_items?.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {assignment.assigned_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                        </div>
                      )}
                      {assignment.due_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(assignment.due_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(assignment)}
                    {assignment.grades?.[0] && (
                      <div className="text-sm font-medium">
                        {assignment.grades[0].score}/{assignment.grades[0].max_score}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}