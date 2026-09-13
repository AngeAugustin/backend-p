export type InvoiceIssuer = {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  ifu: string;
  website: string;
};

export const defaultIssuer: InvoiceIssuer = {
  name: "Augustin FACHEHOUN",
  title: "FullStack & AI Developer",
  email: "me@augustinfachehoun.pro",
  phone: "+229 54 05 36 60",
  address: "",
  city: "Cotonou",
  country: "Bénin",
  ifu: "",
  website: "https://www.augustinfachehoun.pro",
};
