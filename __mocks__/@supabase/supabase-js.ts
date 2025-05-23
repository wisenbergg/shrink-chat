/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// __mocks__/@supabase/supabase-js.ts

class FromBuilder {
  constructor(private table: string) {}

  upsert(_payload: any): FromBuilder {
    return this;
  }
  insert(_payload: any): FromBuilder {
    return this;
  }
  update(_payload: any): FromBuilder {
    return this;
  }

  // eq() should return a promise
  eq(_column: string, _value: unknown): Promise<any> {
    return Promise.resolve({
      data: null,
      error: null,
      count: null,
      status: 200,
      statusText: "OK",
      headers: {},
    });
  }

  select(): Promise<any> {
    return Promise.resolve({
      data: null,
      error: null,
      count: null,
      status: 200,
      statusText: "OK",
      headers: {},
    });
  }
}

export function createClient(_url: string, _key: string, _opts?: object): any {
  return {
    from: (table: string) => new FromBuilder(table),

    auth: {
      persistSession: false,
      signIn: async () => ({ data: null, error: null }),
      signUp: async () => ({ data: null, error: null }),
    },

    // you can stub additional top-level methods here if your code calls them
  };
}
