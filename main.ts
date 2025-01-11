import * as cheerio from "cheerio";

const getLatestRelease = async (): Promise<string> => {
  const baseUrl = "https://softwareupdate.vmware.com/cds/vmw-desktop/ws/";

  const response = await fetch(baseUrl);
  if (response.status !== 200) {
    throw new Error("Failed to fetch data from VMware CDN");
  }

  const json = await response.text();

  const $ = cheerio.load(json);
  const links: string[] = [];

  $("a").each((_index, element) => {
    const href = $(element).attr("href");
    if (href && href.match(/^\d+\.\d+\.\d+\/$/)) {
      links.push(href.replace("/", ""));
    }
  });

  if (links.length === 0) {
    throw new Error("No versions found");
  }

  links.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  return links[0];
};

const getWindowsBundle = async (version: string): Promise<string> => {
  const url =
    `https://softwareupdate.vmware.com/cds/vmw-desktop/ws/${version}/`;
  const response = await fetch(url);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch data for version ${version}`);
  }

  const $ = cheerio.load(await response.text());

  const ids: string[] = [];

  $("a").each((_index, element) => {
    const href = $(element).attr("href")?.replace("/", "");

    if (href && href.match(/^\d+$/)) {
      ids.push(href);
    }
  });

  ids.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  const highestId = ids[0];

  return `${url}${highestId}/windows/core/VMware-workstation-${version}-${highestId}.exe.tar`;
};

try {
  const latestVersion = await getLatestRelease();
  console.log(`Latest version: ${latestVersion}`);

  const windowsBundleUrl = await getWindowsBundle(latestVersion);
  console.log(`Windows bundle URL: ${windowsBundleUrl}`);
} catch (error) {
  console.error(error);
}
