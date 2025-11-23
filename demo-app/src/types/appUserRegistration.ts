// App User Registration Types
export interface AppUserRegistration {
  id: string;
  appId: string;
  userId: string;
  provider: string;
  externalId: string;
  status: number;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
}

export interface AppUserRegistrationAdd {
  appId: string;
  userId: string;
  provider: string;
  externalId: string;
}

