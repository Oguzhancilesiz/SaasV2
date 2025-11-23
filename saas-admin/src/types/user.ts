import { Status } from "./app";

export type UserDto = {
  userId: string;
  userName: string;
  email: string;
  phone: string | null;
  status: Status;
};

