import { ComponentLoader } from "adminjs";

const componentLoader = new ComponentLoader();

const Components = {
  Dashboard: componentLoader.add("Dashboard", "./Dashboard"),
  StatsDashboard: componentLoader.add("StatsDashboard", "./StatsDashboard"),
  PreferredCommunicationList: componentLoader.add("PreferredCommunicationList", "./PreferredCommunicationList"),
  ReplyTextPreview: componentLoader.add("ReplyTextPreview", "./ReplyTextPreview"),
};

export { componentLoader, Components };

