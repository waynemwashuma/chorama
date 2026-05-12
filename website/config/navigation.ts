import { withBase } from "../utils/url";

export interface NavTab {
  label: string;
  href?: string;
  children?: NavTab[];
}

const tabs: NavTab[] = [
  {
    label: "Introduction",
    href: "#chorama",
    children: [
      { label: "Top", href: "#chorama" },
      { label: "Features", href: "#features" },
      { label: "Who This Is For", href: "#who-this-is-for" },
      { label: "Getting Started", href: "#getting-started" },
      { label: "Core Usage Flow", href: "#core-usage-flow" }
    ]
  },
  {
    label: "Guide",
    href: "/guide",
    children: [
      { label: "Overview", href: "/guide" },
      { label: "Installation", href: "/guide/installation" },
      { label: "First Scene", href: "/guide/first-scene" },
      { label: "Camera and Controls", href: "/guide/camera-and-controls" },
      { label: "Materials and Lighting", href: "/guide/materials-and-lighting" },
      { label: "Textures and Assets", href: "/guide/textures-and-assets" },
      { label: "Render Targets and Views", href: "/guide/render-targets-and-views" },
      { label: "Scene Graph and Transforms", href: "/guide/scene-graph-and-transforms" },
      { label: "Plugins and Render Pipeline", href: "/guide/plugins-and-render-pipeline" },
      { label: "API Map", href: "/guide/api-map" },
      { label: "Troubleshooting", href: "/guide/troubleshooting" }
    ]
  },
  {
    label: "Examples",
    href: "/examples",
    children: [{ label: "Overview", href: "/examples" }]
  }
];

function mapTabLinks(tab: NavTab): NavTab {
  return {
    ...tab,
    href: tab.href ? withBase(tab.href) : undefined,
    children: tab.children?.map(mapTabLinks),
  };
}

export const sidebarTabs: NavTab[] = tabs.map(mapTabLinks);
