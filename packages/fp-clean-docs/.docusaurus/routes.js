import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/blog',
    component: ComponentCreator('/blog', '5b9'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive', '182'),
    exact: true
  },
  {
    path: '/blog/authors',
    component: ComponentCreator('/blog/authors', '0b7'),
    exact: true
  },
  {
    path: '/blog/introducing-fp-clean',
    component: ComponentCreator('/blog/introducing-fp-clean', '2ba'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', '287'),
    exact: true
  },
  {
    path: '/blog/tags/fp-clean',
    component: ComponentCreator('/blog/tags/fp-clean', 'cfa'),
    exact: true
  },
  {
    path: '/blog/tags/functional-programming',
    component: ComponentCreator('/blog/tags/functional-programming', '01d'),
    exact: true
  },
  {
    path: '/blog/tags/typescript',
    component: ComponentCreator('/blog/tags/typescript', 'cc0'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'df2'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '7ea'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '542'),
            routes: [
              {
                path: '/docs/api',
                component: ComponentCreator('/docs/api', 'dfe'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '61d'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '2bc'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
