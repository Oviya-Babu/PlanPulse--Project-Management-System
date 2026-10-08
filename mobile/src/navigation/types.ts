export type RootTabParamList = {
  Dashboard: undefined;
  Projects: undefined;
  Tasks: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  ProjectDetails: { projectId: string };
  TaskDetails: { taskId: string };
};
