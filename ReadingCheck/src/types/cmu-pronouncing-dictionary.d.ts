// src/types/cmu-pronouncing-dictionary.d.ts 

declare module 'cmu-pronouncing-dictionary' {
  // This declares that the module's default export is an object
  // where keys are strings (words) and values are arrays of strings (pronunciations).
  const content: Record<string, string[]>;
  export default content;
}