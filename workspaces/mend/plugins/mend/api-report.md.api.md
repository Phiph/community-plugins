## API Report File for "@backstage-community/plugin-mend"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts
/// <reference types="react" />

import { BackstagePlugin } from '@backstage/core-plugin-api';
import { JSX as JSX_2 } from 'react';
import { default as React_2 } from 'react';
import { RouteRef } from '@backstage/core-plugin-api';

// Warning: (ae-missing-release-tag) "Page" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export const MendPage: () => JSX_2.Element;

// Warning: (ae-missing-release-tag) "Sidebar" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export const MendSidebar: () => React_2.JSX.Element;

// Warning: (ae-missing-release-tag) "TabProvider" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export const MendTab: () => React_2.JSX.Element;

// Warning: (ae-missing-release-tag) "plugin" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export const plugin: BackstagePlugin<
  {
    root: RouteRef<undefined>;
  },
  {},
  {}
>;

// Warnings were encountered during analysis:
//
// src/components/Sidebar.d.ts:2:22 - (ae-undocumented) Missing documentation for "Sidebar".
// src/pages/tab/TabProvider.d.ts:2:22 - (ae-undocumented) Missing documentation for "TabProvider".
// src/plugin.d.ts:2:22 - (ae-undocumented) Missing documentation for "plugin".
// src/plugin.d.ts:5:22 - (ae-undocumented) Missing documentation for "Page".

// (No @packageDocumentation comment for this package)
```
