-- Convert the cleaning planner assignment to proper project format
UPDATE curriculum_items 
SET body = '{
  "title": "Personalized Home Cleaning Routine Planner",
  "description": "Design and build an interactive tool that helps people create customized cleaning routines based on their home size, lifestyle, and preferences. This project combines research, planning, and practical tool development.",
  "modules": [
    {
      "id": "module-1",
      "title": "Research & Planning Phase",
      "description": "Research effective cleaning routines and understand user needs to plan your interactive tool.",
      "objectives": [
        "Research different cleaning methodologies and best practices",
        "Identify key factors that affect cleaning routines (home size, pets, allergies, schedule)",
        "Create a plan for your interactive tool features"
      ],
      "deliverables": [
        {"type": "research_summary", "title": "Cleaning Methods Research", "required": true},
        {"type": "planning_doc", "title": "Tool Feature Plan", "required": true}
      ],
      "questions": [
        "What cleaning methods did you research and which seemed most effective?",
        "What key questions should your tool ask users to personalize their routine?",
        "What features will make your tool most helpful?"
      ]
    },
    {
      "id": "module-2",
      "title": "Tool Development",
      "description": "Build your interactive cleaning routine planner with input forms and personalized output.",
      "objectives": [
        "Create an interactive interface for user inputs",
        "Develop logic to generate personalized cleaning schedules",
        "Design a clear, easy-to-follow output format"
      ],
      "deliverables": [
        {"type": "prototype", "title": "Working Tool Prototype", "required": true},
        {"type": "screenshot", "title": "Tool Interface Screenshots", "required": true},
        {"type": "sample_output", "title": "Sample Generated Schedule", "required": false}
      ],
      "questions": [
        "What challenges did you encounter while building the tool?",
        "How does your tool personalize the cleaning routine for different users?",
        "What makes your tool user-friendly?"
      ]
    },
    {
      "id": "module-3",
      "title": "Testing & Documentation",
      "description": "Test your tool with different scenarios and create documentation for users.",
      "objectives": [
        "Test the tool with various user scenarios",
        "Refine the output based on test results",
        "Create clear usage instructions"
      ],
      "deliverables": [
        {"type": "user_guide", "title": "User Instructions", "required": true},
        {"type": "test_results", "title": "Testing Documentation", "required": true},
        {"type": "final_tool", "title": "Final Working Tool", "required": true}
      ],
      "questions": [
        "What did you learn from testing your tool?",
        "What improvements did you make based on testing?",
        "How would you enhance this tool if you had more time?"
      ]
    }
  ],
  "finalDeliverables": [
    "Fully functional interactive cleaning routine planner",
    "User guide explaining how to use the tool",
    "Sample cleaning schedules for at least 3 different user types",
    "Reflection on the development process and lessons learned"
  ],
  "materials": ["Computer", "Internet access", "Notebook for brainstorming"]
}'::jsonb
WHERE id = '5121d647-732a-4682-bdc2-75491cfe28ed';