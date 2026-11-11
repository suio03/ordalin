import { load, save, type Customer } from "../storage.ts";
import { isValidEmail } from "../lib/validate.ts";

export function addCustomer(id: string, name: string, email: string): Customer {
  if (!isValidEmail(email)) throw new Error("Invalid email: " + email);
  const data = load();
  if (data.customers.find((c) => c.id === id)) throw new Error("Customer exists: " + id);
  const customer = { id, name, email };
  data.customers.push(customer);
  save(data);
  return customer;
}

export function getCustomer(id: string): Customer | undefined {
  return load().customers.find((c) => c.id === id);
}

export function listCustomers(): Customer[] {
  return load().customers;
}
