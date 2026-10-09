export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetails: { projectId: string; projectName?: string };
};

export type RootTabParamList = {
  Dashboard: undefined;
  Projects: undefined;
  Tasks: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
