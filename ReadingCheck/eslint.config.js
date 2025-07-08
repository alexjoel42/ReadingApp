// eslint.config.js or eslint.config.cjs
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
// Import the import plugin
import pluginImport from 'eslint-plugin-import';


export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'], // Apply this configuration to TypeScript and TSX files
    // Extend with recommended rules from various plugins
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      // Add recommended rules from eslint-plugin-import
      pluginImport.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // Add any other globals if needed, e.g., for Node.js if you have server-side TS
      },
      parser: tseslint.parser, // Specify the parser for TypeScript files
      parserOptions: {
        project: true, // This is crucial for type-aware linting
        tsconfigRootDir: import.meta.dirname, // Point to your project root for tsconfig.json
      },
    },
    // Add plugins used in this configuration
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      // Add the import plugin here
      import: pluginImport,
    },
    rules: {
      // Existing rules
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Add the no-cycle rule
      // 'error' will fail the lint, 'warn' will just show a warning
      'import/no-cycle': ['error', { maxDepth: Infinity }],
      
      // Often useful to add these for import plugin with TypeScript:
      'import/no-unresolved': 'off', // Turn off as TypeScript handles this
      'import/named': 'off', // Turn off as TypeScript handles this
      'import/namespace': 'off', // Turn off as TypeScript handles this
    },
    // This is crucial for eslint-plugin-import to resolve TypeScript paths correctly
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json', // Path to your tsconfig.json
        },
        node: true, // Also allow Node.js default resolution
      },
      react: {
        version: 'detect', // Automatically detect React version
      },
    },
  },
);