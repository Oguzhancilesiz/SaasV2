import { Status } from "./app";

export type FeatureDto = {
  id: string;
  status: Status;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  appId: string;
  key: string;
  name: string;
  unit: string;
  description: string;
};

