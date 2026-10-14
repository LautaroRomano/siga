import releasesJson from "./releases.json";

export type Release = {
  stage: string;
  number: string;
  date: string;
  changes: string[];
};

export const releases: Release[] = releasesJson.releases;

export const currentRelease: Release = releases[0];

export const formatVersionName = (release: Pick<Release, "stage" | "number">) =>
  [release.stage.trim(), release.number].filter(Boolean).join(" ");

export const formatVersionLabel = (release: Pick<Release, "stage" | "number">) =>
  `Versión ${formatVersionName(release)}`;
