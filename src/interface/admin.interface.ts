export interface IAdminProps {
  name: {
    firstName: string;
    lastName: string;
  };
  auth: {
    password: string;
    changedOn?: string;
  };
  contact: {
    email: string;
    mobile: string;
    address: {
      addressLine1: string;
      addressLine2: string;
    };
  };
  acType: "ADMIN";
}

export interface INewAdminProps {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  mobile: string;
  addressLine1: string;
  addressLine2: string;
}

export interface ILoginProps {
  email: string;
  password: string;
}
