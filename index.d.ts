// Type definitions for micrographql-client
// Definitions by: Dmitrii Karpich

export default function micrographql(
    template: TemplateStringsArray,
    ...fragments: (string | number)[]
  ): (variables: object,
  variablesAsObject: boolean) => 
  string;
